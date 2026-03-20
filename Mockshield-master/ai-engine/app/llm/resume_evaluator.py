import os
import google.generativeai as genai
import json
import itertools
import random
import time
import re
import traceback
import ast
import logging
import sys
import threading
import unicodedata 
import concurrent.futures
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

# ==============================================================================
# 0. DIAGNOSTIC STARTUP & MODEL AUTO-DISCOVERY
# ==============================================================================
print(f"[{datetime.now()}] 🟢 SYSTEM STARTUP: Initializing Supreme Defense Systems (Resume Evaluator)...", flush=True)

# 1. Load Environment Variables
load_dotenv()

# --- WINDOWS UNICODE FIX ---
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Force the logger to override any imported library hijackers
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("system_audit.log", encoding='utf-8')
    ],
    force=True 
)

api_key = os.getenv("GOOGLE_API_KEY")
is_mock_mode = False

if not api_key or ("AIzaSy" in api_key and len(api_key) < 10):
    print(f"[{datetime.now()}] ⚠️ SYSTEM STATUS: No valid Google API Key found. Running in SMART SIMULATION MODE.", flush=True)
    is_mock_mode = True
else:
    masked_key = f"{api_key[:5]}...{api_key[-5:]}"
    print(f"[{datetime.now()}] 🔑 API Key Detected: {masked_key}", flush=True)
    genai.configure(api_key=api_key)

# 2. MODEL AUTO-DISCOVERY (Prevents 404 Errors)
print(f"[{datetime.now()}] 📡 CONNECTING TO GOOGLE TO FETCH AVAILABLE MODELS...", flush=True)

live_models = []
# if not is_mock_mode:
#     try:
#         for m in genai.list_models():
#             if 'generateContent' in m.supported_generation_methods:
#                 live_models.append(m.name)
        
#         if not live_models:
#             print(f"[{datetime.now()}] ⚠️ WARNING: Could not fetch live models. Using fallback list.", flush=True)
#         else:
#             print(f"[{datetime.now()}] ✅ FOUND {len(live_models)} LIVE MODELS. (Top: {live_models[0]})", flush=True)
#     except Exception as e:
#         print(f"[{datetime.now()}] ⚠️ CONNECTION WARNING: {e}", flush=True)
#         live_models = []

# ==============================================================================
# 1. CONFIGURATION: PRIMARY VS FALLBACK MODEL LISTS
# ==============================================================================

def get_tiered_model_lists():
    """
    STRATEGY:
    Separates high-tier models (Primary) from lower-tier/legacy models (Fallback).
    Both lists are subjected to the exact same 15-Layer Defense and Timeout rules.
    """
    primary_candidates = [
        'models/gemini-3-flash-lite-preview',
        'models/gemini-3.1-pro-preview',
        'models/gemini-3.1-pro-preview-customtools',
        'models/gemini-2.5-pro',
        'models/gemini-2.5-flash',
        'models/gemini-2.5-flash-lite',
        'models/gemini-3-flash-preview',
        'models/gemini-2.0-flash',
        'models/gemini-flash-latest',
        'models/gemini-flash-lite-latest',
        'models/gemini-robotics-er-1.5-preview',
        'models/gemini-3.1-flash-preview',
        'models/gemini-3.1-flash-lite-preview',
        'models/gemini-2.0-flash-001',
        'models/gemini-2.0-flash-lite',
        'models/gemini-2.0-flash-lite-001',
        'models/gemini-2.0-flash-exp',
        'models/gemini-exp-1206',
        'models/gemini-2.0-flash-lite-preview',
        'models/gemini-2.0-flash-lite-preview-02-05',
        'models/gemini-2.5-flash-preview-09-2025',
        'models/gemini-2.5-flash-lite-preview-09-2025',
        'models/gemma-3-27b-it',
        'models/gemma-3-12b-it',
        'models/gemma-3-4b-it',
        'models/gemma-3-1b-it',
        'models/gemma-3n-e4b-it',
        'models/gemma-3n-e2b-it',
        'models/gemma-2-27b-it',
        'models/gemma-2-9b-it',
        'models/gemma-2-2b-it',
        'models/gemini-3-pro-preview',
        'models/deep-research-pro-preview-12-2025',
        'models/gemini-1.5-pro',
        'models/gemini-1.5-pro-latest',
        'models/gemini-1.5-pro-001',
        'models/gemini-1.5-pro-002',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-flash-latest',
        'models/gemini-1.5-flash-001',
        'models/gemini-1.5-flash-002',
        'models/gemini-1.5-flash-8b',
        'models/gemini-1.5-flash-8b-latest',
        'models/gemini-1.5-flash-8b-001',
        'models/gemini-pro-latest',
    ]

    fallback_candidates = [
        # --- TIER 4: OPEN WEIGHTS (Prone to formatting errors, kept in fallback) ---
        'models/gemini-pro-latest',
        'models/gemini-1.0-pro-001',
        'models/gemini-pro',
        'models/gemini-pro-vision',
        'models/gemini-2.5-flash-native-audio-dialog',
        'models/gemini-2.5-flash-tts',
        'models/nano-banana-pro-preview',
        'models/aqa',
    ]

    seen = set()
    primary_list = []
    fallback_list = []
    
    # 1. Populate Primary List
    for m in primary_candidates:
        if m not in seen:
            primary_list.append(m)
            seen.add(m)
            
    # 2. Add unlisted live models to Primary (assume new Google releases are good)
    for m in live_models:
        if m not in seen and "gemma" not in m.lower():
            primary_list.append(m)
            seen.add(m)

    # 3. Populate Fallback List
    for m in fallback_candidates:
        if m not in seen:
            fallback_list.append(m)
            seen.add(m)

    return primary_list, fallback_list

PRIMARY_MODELS, FALLBACK_MODELS = get_tiered_model_lists()

# ==============================================================================
# 2. SECURITY & UTILS: SUPREME DEFENSE SYSTEM
# ==============================================================================

def sanitize_input_for_prompt(text, max_chars=25000):
    if not isinstance(text, str): return ""
    if len(text) > max_chars:
        text = text[:max_chars] + "... [TRUNCATED]"
    text = text.replace("### SYSTEM OVERRIDE", "").replace("### INSTRUCTION", "")
    return text.strip()

def sanitize_control_chars(text):
    text = re.sub(r'```[a-zA-Z]*\n', '', str(text))
    text = text.replace("```", "")
    return "".join(ch for ch in text if ord(ch) >= 32 or ch in "\n\r\t")

def balance_brackets(text):
    stack = []
    for char in text:
        if char in '{[':
            stack.append(char)
        elif char in '}]':
            if stack:
                last = stack[-1]
                if (char == '}' and last == '{') or (char == ']' and last == '['):
                    stack.pop()
    balanced = text
    while stack:
        opener = stack.pop()
        if opener == '{': balanced += '}'
        elif opener == '[': balanced += ']'
    return balanced

def extract_json_candidates(text):
    candidates = []
    matches = list(re.finditer(r'(\{.*\}|\[.*\])', text, re.DOTALL))
    for m in matches:
        candidates.append(m.group(0))
    if not candidates:
        start_brace = text.find('{')
        start_bracket = text.find('[')
        if start_brace != -1: candidates.append(text[start_brace:])
        elif start_bracket != -1: candidates.append(text[start_bracket:])
    return candidates if candidates else [text]

def nuclear_json_healing(text):
    pattern = r'("(?:[^"\\]|\\.)*")'
    def replacer(match):
        content = match.group(1)
        content = content.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        return content
    return re.sub(pattern, replacer, text, flags=re.DOTALL)

def rogue_quote_surgeon(text):
    pattern = r'(?<=[\w\s])"(?=[\w\s])'
    return re.sub(pattern, '\\"', text)

def enforce_schema(data, expected_type):
    if expected_type == 'list':
        if isinstance(data, list): return data
        if isinstance(data, dict):
            for key in data:
                if isinstance(data[key], list): return data[key]
            return [data]
        raise ValueError(f"Schema violation: Expected list, got {type(data).__name__}")
        
    if expected_type == 'dict':
        if isinstance(data, dict): return data
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            return data[0]
        raise ValueError(f"Schema violation: Expected dict, got {type(data).__name__}")
        
    return data

def safe_literal_eval(candidate):
    if len(candidate) > 50000: 
        raise ValueError("Candidate too large for safe evaluation")
    return ast.literal_eval(candidate)

def bulletproof_json_parser(raw_text, expected_type='dict'):
    if isinstance(raw_text, (dict, list)):
        return enforce_schema(raw_text, expected_type)

    clean_text = sanitize_control_chars(str(raw_text))
    candidates = extract_json_candidates(clean_text)

    for candidate in candidates:
        try: return enforce_schema(json.loads(candidate), expected_type)
        except: pass
        try:
            fixed = re.sub(r',\s*([\]}])', r'\1', candidate)
            return enforce_schema(json.loads(fixed), expected_type)
        except: pass
        try: return enforce_schema(safe_literal_eval(candidate), expected_type)
        except: pass
        try:
            fixed = re.sub(r'\\(?![/\\bfnrtu"U])', r'\\\\', candidate)
            return enforce_schema(json.loads(fixed), expected_type)
        except: pass
        try:
            healed = nuclear_json_healing(candidate)
            return enforce_schema(json.loads(healed), expected_type)
        except: pass
        try:
            surgeoed = rogue_quote_surgeon(nuclear_json_healing(candidate))
            return enforce_schema(json.loads(surgeoed), expected_type)
        except: pass
        try:
            balanced = balance_brackets(candidate)
            return enforce_schema(json.loads(balanced), expected_type)
        except: pass
        
        if expected_type == 'list':
            try:
                obj_matches = re.findall(r'\{.*?\}', candidate, re.DOTALL)
                reconstructed_list = []
                for obj_str in obj_matches:
                    try: reconstructed_list.append(json.loads(obj_str))
                    except: pass
                if reconstructed_list: return reconstructed_list
            except: pass

    raise ValueError(f"CRITICAL PARSE FAILURE: Could not extract valid '{expected_type}' from model output.")

# ==============================================================================
# 3. ROBUST HISTORY MANAGER (Neon PostgreSQL Connection Pooling & Traceback)
# ==============================================================================

class HistoryManager:
    STOPWORDS = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "with", "by", 
        "is", "are", "was", "were", "be", "been", "this", "that", "it", 
        "calculate", "find", "what", "how", "write", "function", "program",
        "determine", "probability", "value", "given", "assume", "suppose",
        "explain", "describe", "code", "create", "list", "difference", "between"
    }

    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.lock = threading.Lock() 
        self._initialize_db()

    def get_db_connection(self):
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = True
        return conn

    def _initialize_db(self):
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS resume_evaluations (
                    id SERIAL PRIMARY KEY,
                    topic TEXT,
                    data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            conn.close()
        except Exception as e: 
            print(f"HISTORY INIT ERROR: {e}", flush=True)

    def get_past_questions(self, topic):
        clean_topic = topic.lower().strip()
        try:
            with self.lock: 
                conn = self.get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT data FROM resume_evaluations WHERE topic = %s ORDER BY id DESC LIMIT 350", (clean_topic,))
                results = [row[0] for row in cursor.fetchall()]
                conn.close()
                return results
        except Exception as e:
            print(f"DB READ ERROR: {e}", flush=True)
            return []

    def add_questions(self, topic, new_questions):
        clean_topic = topic.lower().strip()
        data_to_insert = []
        for q in new_questions:
            if isinstance(q, dict) and 'question' in q:
                data_to_insert.append((clean_topic, q['question']))
            elif isinstance(q, str):
                data_to_insert.append((clean_topic, q))
        try:
            with self.lock:
                conn = self.get_db_connection()
                cursor = conn.cursor()
                cursor.executemany("INSERT INTO resume_evaluations (topic, data) VALUES (%s, %s)", data_to_insert)
                conn.commit()
                conn.close()
        except Exception as e: 
            print(f"DB WRITE ERROR: {e}", flush=True)

    def close(self):
        pass # Psycopg2 connections are opened and closed per request

    def _tokenize(self, text):
        if not text: return set()
        text = re.sub(r'[^\w\s]', '', text.lower())
        return set(word for word in text.split() if word not in self.STOPWORDS and len(word) > 2)

    def is_duplicate(self, new_question_text, past_questions, jaccard_threshold=0.45):
        if not new_question_text: return True
        new_tokens = self._tokenize(new_question_text)
        if len(new_tokens) < 3: return False 
        
        for past_q in past_questions:
            clean_past = re.sub(r'[^\w\s]', '', past_q.lower().strip())
            clean_new = re.sub(r'[^\w\s]', '', new_question_text.lower().strip())
            
            # Exact or Substring Match Detection
            if clean_new in clean_past or clean_past in clean_new:
                print(f"\n🚫 [EXACT DUPLICATE DETECTED] Substring match found!", flush=True)
                print(f"   NEW: '{new_question_text[:80]}...'", flush=True)
                print(f"   OLD: '{past_q[:80]}...'", flush=True)
                print("🔍 [TRACEBACK LOG] Where did this duplicate occur?", flush=True)
                traceback.print_stack()
                print("-" * 50, flush=True)
                return True

            past_tokens = self._tokenize(past_q)
            intersection = new_tokens.intersection(past_tokens)
            union = new_tokens.union(past_tokens)
            if len(union) == 0: continue
            
            similarity = len(intersection) / len(union)
            if similarity > jaccard_threshold:
                print(f"\n🚫 [JACCARD DUPLICATE DETECTED] Similarity Score: {similarity:.2f}", flush=True)
                print(f"   NEW: '{new_question_text[:80]}...'", flush=True)
                print(f"   OLD: '{past_q[:80]}...'", flush=True)
                print("🔍 [TRACEBACK LOG] Where did this duplicate occur?", flush=True)
                traceback.print_stack()
                print("-" * 50, flush=True)
                return True
                
        return False

history_system = HistoryManager()

# ==============================================================================
# 4. CORE ENGINE: SYNCHRONOUS TIMEOUT ENFORCER & 2-STAGE FAILOVER
# ==============================================================================

MAX_CONCURRENT = int(os.getenv("MAX_CONCURRENT_REQUESTS", 5))
CONCURRENCY_GUARD = threading.Semaphore(MAX_CONCURRENT) 

def generate_with_timeout_protection(model, prompt, timeout=120, generation_config=None):
    if not CONCURRENCY_GUARD.acquire(timeout=5):
        raise SystemError("SYSTEM OVERLOAD: Too many active requests. Backing off.")
        
    try:
        def _make_call():
            from google.generativeai.types import HarmCategory, HarmBlockThreshold
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
            if generation_config:
                return model.generate_content(prompt, safety_settings=safety_settings, generation_config=generation_config)
            return model.generate_content(prompt, safety_settings=safety_settings)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            try:
                future = executor.submit(_make_call)
                return future.result(timeout=timeout)
            except Exception as e:
                if isinstance(e, concurrent.futures.TimeoutError):
                    raise TimeoutError(f"Model execution exceeded {timeout}s.")
                else:
                    raise e
    finally:
        CONCURRENCY_GUARD.release()

def generate_with_failover(prompt, expected_type='dict', timeout_val=45):
    """
    TWO-STAGE 110-LAYER STRICT FAILOVER:
    Stage 1: Attempts all Primary & Fallback models enforcing strict native JSON formatting.
    Stage 2: If Stage 1 is fully exhausted, drops native formatting and restarts the loop relying entirely on the bulletproof Regex/AST parser.
    """
    combined_models = PRIMARY_MODELS + FALLBACK_MODELS
    failed_models_log = []
    
    # ==========================================
    # STAGE 1: STRICT NATIVE JSON ENFORCEMENT
    # ==========================================
    print(f"\n🚀 [STAGE 1] Activating Native JSON Protocol. Available Models: {len(combined_models)}", flush=True)
    attempts_s1 = 0
    
    for current_model in combined_models:
        attempts_s1 += 1
        
        if current_model in FALLBACK_MODELS and attempts_s1 > 1 and current_model == FALLBACK_MODELS[0]:
            print("\n⚠️ [WARNING] PRIMARY MODELS EXHAUSTED. DEPLOYING FALLBACK MODELS WITH NATIVE JSON...\n", flush=True)
            
        print(f"🔄 [S1 ATTEMPT {attempts_s1}] Testing Model: '{current_model}' (Timeout: {timeout_val}s)...", flush=True)
        
        try:
            model = genai.GenerativeModel(current_model)
            response = generate_with_timeout_protection(
                model, 
                prompt, 
                timeout=timeout_val, 
                generation_config={"response_mime_type": "application/json"}
            )
            
            if not response:
                raise ValueError("API returned a None response.")
            
            try:
                raw_text = response.text
            except ValueError:
                raise ValueError("Response blocked by AI safety filters or missing text payload.")
            
            if not raw_text or not str(raw_text).strip():
                raise ValueError("Empty text received from model.")
                
            try:
                parsed_data = json.loads(raw_text)
                parsed_data = enforce_schema(parsed_data, expected_type)
            except Exception as parse_err:
                raise ValueError(f"Native JSON syntax failed to parse: {parse_err}")
            
            if expected_type == 'list' and not isinstance(parsed_data, list):
                 raise ValueError(f"AI Format Error: Expected a list `[]`, but got {type(parsed_data).__name__}.")
            if expected_type == 'dict' and not isinstance(parsed_data, dict):
                 raise ValueError(f"AI Format Error: Expected a dict `{{}}`, but got {type(parsed_data).__name__}.")
            if not parsed_data:
                 raise ValueError("Parsed data is empty.")

            print(f"✅ [SUCCESS - STAGE 1] Model '{current_model}' generated native valid JSON!", flush=True)
            if isinstance(parsed_data, dict):
                parsed_data["evaluating_model_success"] = current_model
                parsed_data["evaluating_model_failures"] = failed_models_log
                parsed_data["parsing_stage"] = "Stage 1 (Native JSON)"

            return parsed_data
            
        except TimeoutError:
            print(f"⏳ [TIMEOUT] Model '{current_model}' breached {timeout_val}s limit. Switching immediately...", flush=True)
            failed_models_log.append(f"S1: {current_model} (Timeout)")
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                backoff_time = min(2 ** attempts_s1, 8) 
                print(f"⚠️ [RATE LIMITED] 429 Quota Error. Backing off for {backoff_time}s to avoid ban...", flush=True)
                failed_models_log.append(f"S1: {current_model} (429 Rate Limit)")
                time.sleep(backoff_time)
            else:
                print(f"❌ [FAILED] Model '{current_model}' rejected output: {error_msg[:120]}", flush=True)
                failed_models_log.append(f"S1: {current_model} (Error)")

    # ==========================================
    # STAGE 2: BATTLE-TESTED REGEX/AST FALLBACK
    # ==========================================
    print(f"\n⚠️ [STAGE 2] Stage 1 Extinction Event. All models failed Native JSON. Rebooting sequence with Bulletproof Parser...", flush=True)
    attempts_s2 = 0
    
    for current_model in combined_models:
        attempts_s2 += 1
        print(f"🔄 [S2 ATTEMPT {attempts_s2}] Testing Model: '{current_model}' (Timeout: {timeout_val}s)...", flush=True)
        
        try:
            model = genai.GenerativeModel(current_model)
            # Stage 2 drops the generation_config restriction
            response = generate_with_timeout_protection(model, prompt, timeout=timeout_val) 
            
            if not response:
                raise ValueError("API returned a None response.")
            
            try:
                raw_text = response.text
            except ValueError:
                raise ValueError("Response blocked by AI safety filters or missing text payload.")
            
            if isinstance(raw_text, (dict, list)):
                raw_text = json.dumps(raw_text)
                
            if not raw_text or not str(raw_text).strip():
                raise ValueError("Empty text received from model.")
                
            # THE BULLETPROOF AST/REGEX PARSER CATCHES THE MESSY TEXT HERE:
            parsed_data = bulletproof_json_parser(raw_text, expected_type=expected_type)
            
            if expected_type == 'list' and not isinstance(parsed_data, list):
                 raise ValueError(f"AI Format Error: Expected a list `[]`, but got {type(parsed_data).__name__}.")
            if expected_type == 'dict' and not isinstance(parsed_data, dict):
                 raise ValueError(f"AI Format Error: Expected a dict `{{}}`, but got {type(parsed_data).__name__}.")
            if not parsed_data:
                 raise ValueError("Parsed data is empty.")

            print(f"✅ [SUCCESS - STAGE 2] Model '{current_model}' survived AST/Regex parsing!", flush=True)
            if isinstance(parsed_data, dict):
                parsed_data["evaluating_model_success"] = current_model
                parsed_data["evaluating_model_failures"] = failed_models_log
                parsed_data["parsing_stage"] = "Stage 2 (AST/Regex Fallback)"

            return parsed_data
            
        except TimeoutError:
            print(f"⏳ [TIMEOUT] Model '{current_model}' breached {timeout_val}s limit. Switching immediately...", flush=True)
            failed_models_log.append(f"S2: {current_model} (Timeout)")
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                backoff_time = min(2 ** attempts_s2, 8) 
                print(f"⚠️ [RATE LIMITED] 429 Quota Error. Backing off for {backoff_time}s to avoid ban...", flush=True)
                failed_models_log.append(f"S2: {current_model} (429 Rate Limit)")
                time.sleep(backoff_time)
            else:
                print(f"❌ [FAILED] Model '{current_model}' rejected output: {error_msg[:120]}", flush=True)
                failed_models_log.append(f"S2: {current_model} (Error)")
            
    raise Exception(f"CRITICAL FAILURE: System completely exhausted. All {len(combined_models)*2} attempts failed across BOTH stages. Failure Log: {failed_models_log}")

# ==============================================================================
# 5. ENGINE: RESUME QUESTION GENERATOR (FULL SUPREME MODE RESTORED)
# ==============================================================================

def generate_resume_questions(topic, resume_text, difficulty="Expert", count=5):
    # Defense Layers 1-2
    clean_topic = sanitize_input_for_prompt(topic)
    clean_resume = sanitize_input_for_prompt(resume_text)
    
    # --- EXACT MOCK MODE YOU REQUESTED ---
    if is_mock_mode:
        return [
            {"id": 1, "type": "coding", "question": f"Mock Coding: Optimize a distributed {clean_topic} lock."},
            {"id": 2, "type": "theory", "question": f"Mock Theory: Explain CAP theorem in {clean_topic}."},
            {"id": 3, "type": "hr", "question": "Mock HR: Describe a conflict with a Product Manager."},
            {"id": 4, "type": "aptitude", "question": "Mock Aptitude: A train 150m long is running at 60kmph..."}
        ]
    
    # --- REQUESTED EMPTY RESUME CHECK ---
    if not clean_resume or len(clean_resume) < 50:
        print(f"[{datetime.now()}] ❌ RESUME_GENERATOR FAILED: Standalone mode - AI skipped", flush=True)
        return [] 
    # --------------------------------

    # Setup History
    db_key = f"{clean_topic}_{difficulty}"
    past_questions = history_system.get_past_questions(db_key)
    exclusion_sample = past_questions[:350]
    exclusion_text = ""
    if exclusion_sample:
        exclusion_text = "### EXCLUSION LIST (DO NOT ASK THESE):\n" + "\n".join([f"- {q}" for q in exclusion_sample])

    unique_seed = random.randint(10000, 99999)
    buffer_count = count * 2 
    
    prompt = f"""
    ### SYSTEM OVERRIDE: SUPREME ARCHITECT MODE
    - **STRICTLY FORBIDDEN:** Conversational fillers.
    - **MANDATORY:** Output must be RAW JSON only.
    - **ESCAPING RULES:** Double-escape all backslashes (\\\\ -> \\\\\\\\). Escape newlines in strings (\\n -> \\\\n).
    
    - **IDENTITY:** You are the 'Chief Talent Architect' AND 'Bob' (The Elite Forensic Auditor).
    - **DATABASE ACCESS:** You have direct access to a simulated **Global Interview Database of 100,000+ Verified Questions** across 25+ domains.
    - **METHOD:** You perform 'Resume DNA Analysis' combined with 'Forensic Text Interrogation'.
    - **GOAL:** 90%+ Difficulty. Top 1% Hiring Standard.

    ### CONTEXT & SIMULATION PARAMETERS:
    1. **THE FIELD:** {clean_topic.upper()}
    2. **DIFFICULTY:** {difficulty}
    3. **SEED:** {unique_seed} (Randomization Token).

    {exclusion_text}

    ### CANDIDATE RESUME TEXT:
    \"\"\"
    {clean_resume}
    \"\"\"

    ### PHASE 1: FORENSIC DNA & TEMPLATE CHECK
    Analyze if the resume matches the **structural and semantic DNA** of a {clean_topic} professional.
    **SUPPORTED DNA DOMAINS:**
    - Software Engineering (Scalability, Trade-offs)
    - Medical/Doctor (Pathology, Protocol)
    - Chartered Accountancy (Compliance, Risk)
    - Civil/Mech Engineering (Safety, Physics)
    - Law, HR, Sales, Aviation, & Government.

    **FAILURE CONDITION:**
    If the resume is generic gibberish or belongs to a wrong profession REJECT IT.
    Output: [{{ "id": 0, "error": "TEMPLATE_MISMATCH", "question": "Resume template not matched." }}]

    ### PHASE 2: RESUME AUTOPSY (BOB'S PAPER TIGER SCAN)
    (Execute only if Phase 1 passes). Scan for buzzwords without depth ("Paper Tigers"):
    - **Microservices?** Ask about *Distributed Tracing & Saga Patterns*.
    - **Management?** Ask about *Handling Toxic High-Performers*.
    - **Audit?** Ask about *Detecting Fraud in seemingly perfect books*.

    ### PHASE 3: QUERY RANDOMIZATION PROTOCOL (MANDATORY)
    You must simulate a Random SQL Retrieval to ensure high entropy and avoid cliches.
    
    **EXECUTE THE FOLLOWING SIMULATION LOGIC:**
    1. **SET SEED:** {unique_seed}
    2. **ACCESS TABLE:** `{clean_topic}_QuestionBank` (Size: 100,000+ Rows)
    3. **FILTER:** `WHERE Difficulty = '{difficulty}' AND Type = 'Scenario_Based' AND Is_Cliche = FALSE`
    4. **RANDOMIZE:** `ORDER BY RANDOM(SEED={unique_seed})`
    5. **LIMIT:** {buffer_count}

    **CRITICAL CONSTRAINT:** - Do NOT select the top 100 most common questions for {clean_topic}. (e.g., NO "What is OOP?", NO "What is a Debit?").
    - Select specific, scenario-based edge cases that only a practitioner would know.

    ### PHASE 4: QUESTION REFINEMENT (90%+ QUALITY)
    Refine the selected questions using Bob's "Brutal Difficulty" rules:
    1. **Disaster Scenarios:** Ask "Here is a disaster involving X, how do you fix it?"
    2. **Trade-Offs:** Force a choice between two bad options (Latency vs Consistency, Speed vs Safety).
    3. **Resume Specificity:** Start with: "Your resume claims [Project X]..." or "You listed [Tool Y]..."

    ### OUTPUT FORMAT (JSON ONLY):
    [
        {{
            "id": 1,
            "type": "resume_specific", 
            "question": "Referring to your 'Cloud Migration' project: You moved from On-Prem to AWS. If your specific latency requirements were <5ms but the new cloud load balancer added 10ms overhead, how did you re-architect the network layer to solve this without abandoning the cloud?" 
        }}
    ]
    """
    try:
        parsed_questions = generate_with_failover(prompt, expected_type='list', timeout_val=45)

        unique_batch = []
        for item in parsed_questions:
            q_text = item.get("question", "")
            if not history_system.is_duplicate(q_text, past_questions):
                unique_batch.append(item)
                if len(unique_batch) >= count: break
        
        if unique_batch:
            history_system.add_questions(db_key, unique_batch)
            return unique_batch
        else:
            return parsed_questions[:count]

    except Exception as e:
        print(f"[{datetime.now()}] ❌ GENERATION ERROR: {e}", flush=True)
        return [{"id": 0, "error": "GENERATION_CRASH", "question": "System failure after maximum retries. Please try again."}]

# ==============================================================================
# 6. ENGINE: RESUME EVALUATOR (FULL BOB PROMPT RESTORED)
# ==============================================================================

def evaluate_resume_session(transcript_data, field="General", experience="Entry Level"):
    if is_mock_mode:
        return {
            "score": 85,
            "summary": "Mock Mode: Simulation active.",
            "silent_killers": ["Mock Mode Active"],
            "roadmap": "Deploy to production.",
            "question_reviews": [],
            "evaluating_model_success": "mock-simulation-engine",
            "evaluating_model_failures": []
        }

    if not transcript_data: return {}

    clean_field = sanitize_input_for_prompt(field)
    
    prompt = f"""
    ### SYSTEM OVERRIDE: SUPREME AUDITOR MODE
    - **STRICTLY FORBIDDEN:** Conversational fillers.
    - **MANDATORY:** Output must be RAW JSON only.
    - **ESCAPING RULES:** Double-escape all backslashes (\\\\ -> \\\\\\\\). Escape newlines in strings (\\n -> \\\\n).

    ### ROLE: CHIEF TALENT ARCHITECT & SUPREME FORENSIC AUDITOR (CODE NAME: BOB)
    - **CONTEXT:** You are the Global Head of Talent Acquisition with 100% mastery of 50+ Professional Domains (Engineering, Medical, Finance, Law, etc.).
    - **TASK:** Conduct a ruthless "Resume Verification Analysis" & "Forensic Audit" of the candidate.
    - **DIRECTIVE:** Provide MAXIMUM DATA DENSITY. Do not summarize; expand on every detail with paragraph-length forensic insights.

    ### TRANSCRIPT DATA:
    {json.dumps(transcript_data)}

    ### PHASE 1: FORENSIC DNA & TEMPLATE INTEGRITY CHECK
    Analyze if the candidate's answers match the **structural and semantic DNA** of a {clean_field} professional.
    - **Lexicon Verification:** Does a Doctor use 'Triage'? Does a Dev use 'CI/CD'? Does a Pilot use 'METAR'?
    - **Experience Verification:** Does the depth match {experience}? (Entry = 'How', Senior = 'Why/Trade-offs').
    - **Fraud Detection:** Identify vague answers ("I handled everything") that suggest Resume Padding.

    ### PHASE 2: THE "BOB" DEEP DIVE (HIGH DETAIL PROTOCOL)
    For every answer, perform a "Claim vs. Reality" Check:
    1. **Deep Dive Analysis:** Write a PARAGRAPH (not a sentence) explaining exactly *why* the answer was strong or weak.
    2. **Technical Nuance:** Even if the answer is good, add "Expert Level Nuance" to show what a Top 1% answer would look like.
    3. **Benefit of Doubt vs. Rigor:** Be generous in interpretation but strict in scoring.

    ### PHASE 3: SCORING CRITERIA (STRICT & MERIT-BASED)
    Do NOT inflate the score. Judge honestly based on the "Golden Standard":
    - **90-100 (Hired):** Exceptional. Perfect domain lexicon. Senior-level trade-off analysis.
    - **70-89 (Strong):** Good. Minor gaps but generally truthful and competent.
    - **40-69 (Weak):** Inconsistent. Struggles with concepts expected at this level.
    - **0-39 (Fraud/Mismatch):** Imposter. Answers contradict the resume or professional standards.

    ### OUTPUT REQUIREMENTS (JSON):
    1. **score:** (Integer 0-100). Be strict.
    2. **summary:** A detailed forensic executive summary (60-80 words). Verdict on hireability.
    3. **silent_killers:** List 2-3 specific behavioral or technical red flags (e.g., "Claimed 5 years Java but stuck on basic OOP").
    4. **roadmap:** A specific, actionable 3-step plan to bridge the gap to the next level.
    5. **question_reviews:** - "feedback": A detailed technical paragraph (2-3 sentences).
        - "ideal_answer": A textbook-perfect response demonstrating deep technical clarity and expressed using correct industry-standard terminology and conventions.

    OUTPUT FORMAT (JSON ONLY):
    {{
        "score": <number>,
        "summary": "...",
        "silent_killers": ["..."],
        "roadmap": "...",
        "question_reviews": [
            {{
                "question": "...",
                "user_answer": "...",
                "score": 8,
                "feedback": "...",
                "ideal_answer": "..."
            }}
        ]
    }}
    """
    try:
        analysis_dict = generate_with_failover(prompt, expected_type='dict', timeout_val=45)
        return analysis_dict
    except Exception as e:
        print(f"[{datetime.now()}] ❌ EVALUATION CRASHED. EXTINCTION EVENT: {e}", flush=True)
        
        # Hard Heuristic Fallback
        total_words = 0
        reviews = []
        safe_transcript = transcript_data if isinstance(transcript_data, list) else []
        
        for item in safe_transcript:
            ans = str(item.get('answer', ''))
            word_count = len(ans.split())
            total_words += word_count
            algo_score = 4
            if word_count > 30: algo_score = 8
            elif word_count > 10: algo_score = 6
            reviews.append({
                "question": item.get('question', 'Unknown'),
                "user_answer": ans,
                "score": algo_score,
                "feedback": "Detailed AI analysis bypassed due to API failure.",
                "ideal_answer": "Provide a well-structured answer with examples."
            })

        safe_len = len(safe_transcript) or 1
        final_score = min(88, max(40, int((total_words / safe_len) * 2)))

        return {
            "score": final_score,
            "summary": "Evaluation Complete. AI analysis bypassed due to complete API cascade failure.",
            "silent_killers": ["System Extinction Event Triggered"], 
            "roadmap": "Retry API connection later.",
            "question_reviews": reviews,
            "evaluating_model_success": "hard-fallback-heuristic-engine",
            "evaluating_model_failures": ["ALL_MODELS_FAILED"],
            "parsing_stage": "Fallback Engine"
        }

# ==============================================================================
# MAIN EXECUTION (FOR TESTING)
# ==============================================================================
if __name__ == "__main__":
    
    # 1. Setup
    field = "Senior DevOps Engineer"
    resume = "Experience with Kubernetes, Terraform, AWS, and CI/CD pipelines."
    
    print(f"\n[{datetime.now()}] --- 1. Generating Unique Questions (2 Max) ---")
    try:
        q1 = generate_resume_questions(field, resume, "Senior", 2)
        print(json.dumps(q1, indent=2))
        
        # Build mock transcript
        transcript = []
        for q in q1:
             transcript.append({
                 "question": q.get("question", "Error"),
                 "answer": "I used Terraform to provision EKS clusters and wrote Jenkins pipelines."
             })
             
        print(f"\n[{datetime.now()}] --- 2. Evaluating Interview ---")
        analysis = evaluate_resume_session(transcript, field, "Senior")
        print(json.dumps(analysis, indent=2))
        
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        traceback.print_exc()

    history_system.close()
    #---------------------------------------------------------------------------------------
    # # ==========================================
    # # STAGE 1: STRICT NATIVE JSON ENFORCEMENT
    # # ==========================================
    # print(f"\n🚀 [STAGE 1] Activating Native JSON Protocol. Available Models: {len(combined_models)}", flush=True)
    # attempts_s1 = 0
    
    # for current_model in combined_models:
    #     attempts_s1 += 1
        
    #     if current_model in FALLBACK_MODELS and attempts_s1 > 1 and current_model == FALLBACK_MODELS[0]:
    #         print("\n⚠️ [WARNING] PRIMARY MODELS EXHAUSTED. DEPLOYING FALLBACK MODELS WITH NATIVE JSON...\n", flush=True)
            
    #     print(f"🔄 [S1 ATTEMPT {attempts_s1}] Testing Model: '{current_model}' (Timeout: {timeout_val}s)...", flush=True)
        
    #     try:
    #         # 👇 INJECT THIS EXACT LINE HERE 👇
    #         raise ValueError("CHAOS TEST: Assassinating Stage 1 to trigger Bulletproof Parser in Stage 2")
    #         # 👆 INJECT THIS EXACT LINE HERE 👆

    #         model = genai.GenerativeModel(current_model)
    #         response = generate_with_timeout_protection(
    #             model, 
    #             prompt, 
    #             timeout=timeout_val, 
    #             generation_config={"response_mime_type": "application/json"}
    #         )