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
import hashlib
import concurrent.futures
from datetime import datetime, timezone
import psycopg2
from dotenv import load_dotenv

# ==========================================
# 1. SYSTEM CONFIGURATION & TELEMETRY
# ==========================================
load_dotenv()

# --- WINDOWS UNICODE FIX ---
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

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
    print("⚠️ SYSTEM STATUS: No valid Google API Key found. Running in SMART SIMULATION MODE.", flush=True)
    is_mock_mode = True
else:
    genai.configure(api_key=api_key)

# ==========================================
# 2. MODEL MANAGEMENT (55 MODELS + TIER 1 PRIORITY)
# ==========================================

TIER_1_MODELS = [
    'models/gemini-3-flash-preview',
    'models/gemini-3-flash-lite-preview',
    'models/gemini-3.1-pro-preview',
    'models/gemini-3.1-pro-preview-customtools',
    'models/gemini-2.5-pro',
    'models/gemini-2.5-flash',
    'models/gemini-2.5-flash-lite',
    'models/gemini-flash-latest',
    'models/gemini-flash-lite-latest',
    'models/gemini-3.1-flash-preview',
    'models/gemini-3.1-flash-lite-preview',
    'models/gemini-robotics-er-1.5-preview',
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-001',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.0-flash-lite-001',
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
    'models/gemma-3-27b-it',
    'models/gemma-3-12b-it',
    'models/gemma-3-4b-it',
    'models/gemma-3-1b-it',
    'models/gemma-3n-e4b-it',
    'models/gemma-3n-e2b-it',
    'models/gemma-2-27b-it',
    'models/gemma-2-9b-it',
    'models/gemma-2-2b-it',
]

TIER_2_MODELS = [
    'models/gemini-3-pro-preview',
    'models/deep-research-pro-preview-12-2025',
    'models/gemini-2.0-flash-exp',
    'models/gemini-exp-1206',
    'models/gemini-2.0-flash-lite-preview',
    'models/gemini-2.0-flash-lite-preview-02-05',
    'models/gemini-2.5-flash-preview-09-2025',
    'models/gemini-2.5-flash-lite-preview-09-2025',
]

TIER_3_MODELS = [
    'models/gemini-pro-latest',
    'models/gemini-1.0-pro-001',
    'models/gemini-pro',
    'models/gemini-pro-vision',
    'models/gemini-2.5-flash-native-audio-dialog',
    'models/gemini-2.5-flash-tts',
    'models/nano-banana-pro-preview',
    'models/aqa',
]

ALL_MODELS = TIER_1_MODELS + TIER_2_MODELS + TIER_3_MODELS
model_cycle = itertools.cycle(ALL_MODELS)

def get_next_model():
    return next(model_cycle)

# ==========================================
# 3. HELPER FUNCTIONS & SECURITY
# ==========================================

def sanitize_prompt_input(text):
    if not isinstance(text, str): return str(text)
    sanitized = re.sub(r'[\'"\n\r]', '', text)
    return sanitized.strip()[:200]

def normalize_text_for_comparison(text):
    if not text: return ""
    return re.sub(r'[\W_]+', '', text.lower())

def sanitize_transcript_for_prompt(transcript_data):
    clean_data = []
    if isinstance(transcript_data, list):
        for item in transcript_data:
            clean_item = {}
            for k, v in item.items():
                s_val = str(v)[:2000]
                s_val = s_val.replace("```", "").replace("###", "")
                clean_item[k] = s_val
            clean_data.append(clean_item)
    return json.dumps(clean_data)

# ==========================================
# 4. SCALABLE LSH HISTORY MANAGER (NEON POSTGRESQL)
# ==========================================

class ScalableHistoryManager:
    NUM_HASHES = 60
    BANDS = 20
    ROWS_PER_BAND = 3 
    
    STOPWORDS = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "with", "by", 
        "is", "are", "was", "were", "be", "been", "this", "that", "it", 
        "calculate", "find", "what", "how", "write", "function", "program",
        "determine", "value", "given", "assume", "suppose", "example",
        "explain", "describe", "code", "create", "list", "difference", "between",
        "and", "or", "but", "if", "then", "else", "when", "can", "you", "provide"
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
                CREATE TABLE IF NOT EXISTS lsh_questions (
                    id SERIAL PRIMARY KEY,
                    topic TEXT,
                    question TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS lsh_index (
                    band_index INTEGER,
                    hash_value TEXT,
                    question_id INTEGER,
                    topic TEXT,
                    FOREIGN KEY(question_id) REFERENCES lsh_questions(id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_topic ON lsh_questions(topic)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_lsh_lookup ON lsh_index(topic, band_index, hash_value)')
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"HISTORY INIT ERROR: {e}", flush=True)

    def get_recent_questions(self, topic, limit=350):
        clean_topic = topic.lower().strip()
        try:
            with self.lock: 
                conn = self.get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT question FROM lsh_questions WHERE topic = %s ORDER BY id DESC LIMIT %s", (clean_topic, limit))
                results = [row[0] for row in cursor.fetchall()]
                conn.close()
                return results
        except Exception as e:
            print(f"DB READ ERROR: {e}", flush=True)
            return []

    def _tokenize(self, text):
        if not text: return set()
        text = re.sub(r'[^\w\s]', '', text.lower())
        return set(word for word in text.split() if word not in self.STOPWORDS and len(word) > 2)

    def _minhash_signature(self, tokens):
        sig = []
        token_list = sorted(list(tokens)) 
        for i in range(self.NUM_HASHES):
            min_h = float('inf')
            for t in token_list:
                h = int(hashlib.md5(f"{i}_{t}".encode('utf-8')).hexdigest()[:8], 16)
                if h < min_h: min_h = h
            sig.append(min_h)
        return sig

    def is_duplicate(self, new_question_text, topic, jaccard_threshold=0.35):
        if not new_question_text: return True
        clean_topic = topic.lower().strip()
        new_tokens = self._tokenize(new_question_text)
        if len(new_tokens) < 3: return False

        recent_qs = self.get_recent_questions(clean_topic, limit=350)
        clean_new = re.sub(r'[^\w\s]', '', new_question_text.lower().strip())
        
        # ---------------------------------------------------------
        # TRACEBACK & DUPLICATE TRACKING (LAYER 1: BRUTE FORCE)
        # ---------------------------------------------------------
        for past_q in recent_qs:
            clean_past = re.sub(r'[^\w\s]', '', past_q.lower().strip())
            
            # Exact or Substring Match Detection
            if clean_new in clean_past or clean_past in clean_new:
                print(f"\n🚫 [EXACT DUPLICATE DETECTED] Substring match found!", flush=True)
                print(f"   NEW: '{new_question_text[:80]}...'", flush=True)
                print(f"   OLD: '{past_q[:80]}...'", flush=True)
                print("🔍 [TRACEBACK LOG] Where did this duplicate occur?", flush=True)
                traceback.print_stack()
                print("-" * 50, flush=True)
                return True

            # Jaccard Token Similarity Detection
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

        # ---------------------------------------------------------
        # TRACEBACK & DUPLICATE TRACKING (LAYER 2: NEON LSH POSTGRES)
        # ---------------------------------------------------------
        sig = self._minhash_signature(new_tokens)
        query_parts = []
        params = [clean_topic]
        
        for b in range(self.BANDS):
            start = b * self.ROWS_PER_BAND
            end = start + self.ROWS_PER_BAND
            band_val = "-".join(map(str, sig[start:end]))
            query_parts.append("(band_index = %s AND hash_value = %s)")
            params.extend([b, band_val])
            
        query = f"""
            SELECT DISTINCT q.question 
            FROM lsh_questions q 
            JOIN lsh_index l ON q.id = l.question_id 
            WHERE l.topic = %s AND ({' OR '.join(query_parts)})
        """
        
        try:
            with self.lock:
                conn = self.get_db_connection()
                cursor = conn.cursor()
                cursor.execute(query, params)
                candidates = [row[0] for row in cursor.fetchall()]
                conn.close()
        except Exception as e:
            print(f"LSH LOOKUP ERROR: {e}", flush=True)
            return False

        for past_q in candidates:
            past_tokens = self._tokenize(past_q)
            intersection = new_tokens.intersection(past_tokens)
            union = new_tokens.union(past_tokens)
            if len(union) == 0: continue
            similarity = len(intersection) / len(union)
            if similarity > jaccard_threshold:
                print(f"\n🚫 [LSH DUPLICATE DETECTED] Similarity Score: {similarity:.2f}", flush=True)
                print(f"   NEW: '{new_question_text[:80]}...'", flush=True)
                print(f"   OLD: '{past_q[:80]}...'", flush=True)
                print("🔍 [TRACEBACK LOG] Where did this database duplicate occur?", flush=True)
                traceback.print_stack()
                print("-" * 50, flush=True)
                return True
                
        return False

    def add_questions(self, topic, new_questions):
        clean_topic = topic.lower().strip()
        
        try:
            with self.lock:
                conn = self.get_db_connection()
                cursor = conn.cursor()
                for q in new_questions:
                    if isinstance(q, dict) and 'question' in q:
                        q_text = q['question']
                        
                        cursor.execute("INSERT INTO lsh_questions (topic, question) VALUES (%s, %s) RETURNING id", (clean_topic, q_text))
                        q_id = cursor.fetchone()[0]
                        
                        tokens = self._tokenize(q_text)
                        if len(tokens) >= 3:
                            sig = self._minhash_signature(tokens)
                            lsh_data = []
                            for b in range(self.BANDS):
                                start = b * self.ROWS_PER_BAND
                                end = start + self.ROWS_PER_BAND
                                band_val = "-".join(map(str, sig[start:end]))
                                lsh_data.append((b, band_val, q_id, clean_topic))
                                
                            cursor.executemany("INSERT INTO lsh_index (band_index, hash_value, question_id, topic) VALUES (%s, %s, %s, %s)", lsh_data)
                
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"DB LSH WRITE ERROR: {e}", flush=True)

    def close(self):
        pass

history_system = ScalableHistoryManager()

# ==========================================
# 5. 7-LAYER DEFENSE ENGINE (Data Integrity)
# ==========================================

def clean_json_string(text):
    return sanitize_control_chars(text)

def sanitize_control_chars(text):
    text = re.sub(r'```[a-zA-Z]*\n', '', text)
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
            fixed = re.sub(r'\\(?![/\\bfnrtu"])', r'\\\\', candidate)
            return enforce_schema(json.loads(fixed), expected_type)
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

# ==========================================
# 6. SYNCHRONOUS TIMEOUT ENFORCER & FAILOVER
# ==========================================

MAX_CONCURRENT = int(os.getenv("MAX_CONCURRENT_REQUESTS", 5))
CONCURRENCY_GUARD = threading.Semaphore(MAX_CONCURRENT) 

def generate_with_timeout_protection(model, prompt, timeout=120, generation_config=None):
    if not CONCURRENCY_GUARD.acquire(timeout=5):
        raise SystemError("SYSTEM OVERLOAD: Too many active requests. Backing off.")
        
    try:
        def _make_call():
            if generation_config:
                return model.generate_content(prompt, generation_config=generation_config)
            return model.generate_content(prompt)

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
    failed_models_log = []
    
    # ==========================================
    # STAGE 1: STRICT NATIVE JSON ENFORCEMENT
    # ==========================================
    print(f"\n🚀 [STAGE 1] Activating Native JSON Protocol. Available Models: {len(ALL_MODELS)}", flush=True)
    
    for current_model in ALL_MODELS:
        print(f"🔄 [S1 ATTEMPT] Testing Model: '{current_model}'...", flush=True)
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
            print(f"⏳ [TIMEOUT] Model '{current_model}' took too long. Switching...", flush=True)
            failed_models_log.append(f"S1: {current_model} (Timeout)")
            time.sleep(0.5) 
        except Exception as e:
            print(f"❌ [FAILED] Model '{current_model}': {str(e)[:120]}", flush=True)
            failed_models_log.append(f"S1: {current_model} (Error)")
            time.sleep(0.5) 

    # ==========================================
    # STAGE 2: BATTLE-TESTED REGEX/AST FALLBACK
    # ==========================================
    print(f"\n⚠️ [STAGE 2] Stage 1 Extinction Event. All models failed Native JSON. Rebooting sequence with Bulletproof Parser...", flush=True)
    
    for current_model in ALL_MODELS:
        print(f"🔄 [S2 ATTEMPT] Testing Model: '{current_model}'...", flush=True)
        try:
            model = genai.GenerativeModel(current_model)
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
            print(f"⏳ [TIMEOUT] Model '{current_model}' took too long. Switching...", flush=True)
            failed_models_log.append(f"S2: {current_model} (Timeout)")
            time.sleep(0.5) 
        except Exception as e:
            print(f"❌ [FAILED] Model '{current_model}': {str(e)[:120]}", flush=True)
            failed_models_log.append(f"S2: {current_model} (Error)")
            time.sleep(0.5) 
            
    raise Exception(f"CRITICAL FAILURE: System completely exhausted. All {len(ALL_MODELS)} models failed across BOTH stages.")

# ==========================================
# 7. MAIN LOGIC: STRICT ANTI-REPETITION GENERATOR
# ==========================================

def generate_interview_questions(topic, difficulty="Senior", count=5):
    if is_mock_mode:
        return [
            {"id": 1, "type": "coding", "question": f"Mock Coding: Optimize a distributed {topic} lock."},
            {"id": 2, "type": "aptitude", "question": "Mock Aptitude: A train 150m long is running at 60kmph..."},
            {"id": 3, "type": "hr", "question": "Mock HR: Describe a conflict with a Product Manager."},
            {"id": 4, "type": "theory", "question": f"Mock Theory: Explain CAP theorem in {topic}."}
        ]

    clean_topic = sanitize_prompt_input(topic)
    clean_difficulty = sanitize_prompt_input(difficulty)

    final_questions = []
    
    # We will try up to 3 times to get fully unique questions
    max_retries = 3
    current_attempt = 0
    
    # Store questions we generated in THIS loop that got rejected, to ban them in the next loop
    session_rejected_questions = []

    while len(final_questions) < count and current_attempt < max_retries:
        current_attempt += 1
        remaining_needed = count - len(final_questions)
        print(f"\n⚙️ [GENERATOR LOOP {current_attempt}] Need {remaining_needed} unique questions for '{clean_topic}'...")

        # 1. Fetch DB History + Session Rejections to block repeats
        recent_history = history_system.get_recent_questions(clean_topic, limit=350)
        combined_banned_list = recent_history + session_rejected_questions
        
        exclusion_text = ""
        if combined_banned_list:
            # Shuffle so the AI doesn't always read the exact same top 50
            random.shuffle(combined_banned_list)
            sample_to_show = combined_banned_list[:75] # Show top 75 banned to not overload prompt token limit
            exclusion_list = [q[:100].replace("\n", " ") + "..." for q in sample_to_show]
            exclusion_text = "### 🛑 STRICTLY BANNED QUESTIONS (YOU MUST NOT GENERATE THESE):\n" + "\n".join([f"- {q}" for q in exclusion_list])

        # Dynamic target calculation for the prompt
        buffer_count = remaining_needed + 4 
        coding_target = max(1, int(buffer_count * 0.30)) 
        aptitude_target = max(1, int(buffer_count * 0.30)) 
        hr_target = max(1, int(buffer_count * 0.20))
        theory_target = buffer_count - coding_target - aptitude_target - hr_target

        unique_seed = int(time.time() * 1000) % 100000 
        
        prompt = f"""
    ### SYSTEM OVERRIDE: UNIQUE CONTENT GENERATOR
    
    ### SYSTEM ROLE: SENIOR HEAD OF TALENT & TECHNICAL ARCHITECT (CODE NAME: BOB)
    *** MODE: EXTREME HYBRID MODEL - DATABASE QUERY SIMULATION - {clean_topic.upper()} (ID: {unique_seed}) ***

    ### ⚠️ CRITICAL CONTEXT: THE 100K+ COLLECTION
    **YOU ARE NOT A TEXT GENERATOR.** You are a SQL Search Engine connected to a proprietary **database of 100,000+ vetted {clean_topic} interview questions.**
    
    **YOUR TASK:** Execute the following SQL query to retrieve distinct, high-quality questions from this massive collection. You must bypass the "Surface Level" (Top 100) layer and fetch from the "Deep Archive".

    ### SQL QUERY SIMULATION
    QUERY: 
    SELECT * FROM {clean_topic}_100k_Question_Bank 
    WHERE difficulty = '{clean_difficulty}' 
      AND is_cliche = FALSE 
      AND is_top_100_common = FALSE
    ORDER BY RANDOM(SEED={unique_seed}) 
    LIMIT {count};

    ### 🛡️ EXCLUSION PROTOCOLS (MANDATORY)
    - **CODING:** NO "Two Sum", NO "FizzBuzz", NO "Reverse a String".
    - **HR:** NO "Tell me about yourself", NO "What are your weaknesses?".
    - **APTITUDE:** NO "100 Passengers/Plane", NO "Egg Drop Problem", NO "Poisoned Wine".
    - **STRICT PROHIBITION:** Do not repeat the logic of the "BANNED QUESTIONS" list below. Changing numbers (100 to 50) is NOT unique.

    {exclusion_text}

    ### MANDATORY DISTRIBUTION (Total {count} Items):
    
    1. **CODING CHALLENGES (Exactly {coding_target} Questions):**
       - **MUST** be pure coding tasks suitable for {clean_difficulty} level.
       - Focus on algorithms, data structures, or system design scenarios.
       - **Constraint:** Ask for implementation details. AVOID standard "LeetCode Top 10".

    2. **QUANTITATIVE ANALYSIS & LOGIC PUZZLES (Exactly {aptitude_target} Questions):**
       - **MANDATORY ENFORCEMENT:** You MUST include Logic and Quantitative Aptitude questions. Do not skip.
       - **DIFFICULTY MIX:** Even if the overall profile is '{clean_difficulty}', provide a mix of:
            * **Easy:** Speed Math, Basic Series, Averages & Ages, Ratio, Proportion & Partnership, Percentage problems.
            * **Medium:** Data Interpretation (Tables/Graphs), Seating Arrangements, Profit, Loss & Discount, Time, Speed & Distance, Logical Deduction.
            * **Hard:** Probability, Permutations/Combinations, Mensuration (2D & 3D), Clocks & Calendars, Game Theory.
       - **TOPICS:** Probability, Combinatorics, Data Interpretation, Logical Reasoning, Time & Work, Averages, Ratio & Proportion, Profit & Loss, Mensuration, Data Sufficiency, Speed & Distance.
       - **CRITICAL:** Generate FRESH logic puzzles.

    3. **HR & BEHAVIORAL PSYCHOLOGY (Exactly {hr_target} Questions):**
       - **Objective:** Assess Cultural Fit, Leadership, and Conflict Resolution.
       - **Format:** "Situational" framings only (e.g., "A production DB just crashed...").
       - **Focus Areas:** Handling production failures, disagreeing with a manager, mentoring juniors.

    4. **THEORY & CONCEPTS (Exactly {theory_target} Questions):**
       - Deep dive into internals of {clean_topic}.
       - Ask about trade-offs, underlying architecture, or best practices.

    ### CRITICAL ESCAPING RULES:
    - **DOUBLE ESCAPE BACKSLASHES:** You must write all backslashes as double backslashes (\\\\ -> \\\\\\\\).
    - **ESCAPE NEWLINES:** All newlines inside strings must be escaped (\\n -> \\\\n).
    - **NO MARKDOWN:** Do not use code blocks or markdown formatting.
    
    ### OUTPUT FORMAT (RAW JSON ONLY):
    [
        {{ "id": 1, "type": "coding", "question": "..." }},
        {{ "id": 2, "type": "aptitude", "question": "..." }},
        {{ "id": 3, "type": "hr", "question": "..." }},
        {{ "id": 4, "type": "theory", "question": "..." }}
    ]
    """
        try:
            parsed_questions = generate_with_failover(prompt, expected_type='list', timeout_val=45)
            
            for q in parsed_questions:
                if len(final_questions) >= count: break
                
                q_text = q.get('question', '')
                
                # Check 1: Is it a duplicate of what we already accepted in this session?
                if any(fq['question'] == q_text for fq in final_questions):
                    continue
                
                # Check 2: The ultimate O(log n) DB Duplicate Check
                if not history_system.is_duplicate(q_text, topic=clean_topic, jaccard_threshold=0.35):
                    q['id'] = len(final_questions) + 1
                    final_questions.append(q)
                    print(f"✅ UNIQUE QUESTION ACCEPTED: {q_text[:50]}...")
                else:
                    session_rejected_questions.append(q_text)

        except Exception as e:
            print(f"❌ GENERATION LOOP {current_attempt} ABORTED: {e}", flush=True)

    # -------------------------------------------------------------
    # STRICT ENFORCEMENT: No forced fallbacks. We return what we 
    # legitimately secured. If it failed 3 times, we gracefully stop.
    # -------------------------------------------------------------
    if not final_questions:
        return [{"id": 0, "type": "error", "question": "CRITICAL SYSTEM FAILURE: Exhausted unique questions for this topic."}]

    # Only save the mathematically verified, unique questions to the database
    history_system.add_questions(clean_topic, final_questions)
    
    if len(final_questions) < count:
        print(f"⚠️ WARNING: Could only secure {len(final_questions)}/{count} fully unique questions after {max_retries} attempts.")
        
    return final_questions

def evaluate_full_interview(transcript_data):
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

    try:
        transcript_text = sanitize_transcript_for_prompt(transcript_data)

        prompt = f"""
        ### SYSTEM OVERRIDE
        - STRICTLY FORBIDDEN: Conversational fillers (e.g., "Here is the analysis").
        - MANDATORY: Output must be RAW JSON only.
        - ESCAPING RULES: All backslashes must be double-escaped (\\\\ -> \\\\\\\\). All newlines within strings must be escaped (\\n -> \\\\n).

        ### ROLE & SYSTEM CONTEXT:
        ACT AS: The 'Global Head of Engineering Talent', 'Principal Technical Architect' & 'ELITE FORENSIC AUDITOR (CODE NAME: BOB)'.
        CAPABILITIES: You possess 100% mastery of Technical Stacks (Code/Architecture), HR Behavioral Psychology, and Aptitude Evaluation.
        TASK: Conduct a forensic "Gap Analysis" of the following candidate interview transcript.

        ### TRANSCRIPT DATA:
        {transcript_text}

        ANALYSIS PROTOCOL (THE "SIDE-BY-SIDE" EVALUATION)
        For every question/answer pair, you MUST perform a "Side-by-Side" evaluation using these three lenses:

        **LENS A: The Technical Autopsy (The Reality Check)**
        - **Does it work?** (Baseline functionality).
        - **Is it scalable?** (O(n) vs O(n^2), database load, memory leaks).
        - **Security & Edge Cases:** Did they mention input validation, race conditions, or failure states? (Seniority Indicator).
        - **THE GAP:** What would a Staff Engineer (L6+) have said that this candidate missed?

        **LENS B: The Psychological Profile (The "Silent Killers")**
        - **Detect "Resume Padding":** Does the depth of the answer match the confidence of the claim?
        - **Detect "Hedging":** Phrases like "I guess," "maybe," or vague generalizations without concrete examples.
        - **Detect "Buzzword Stuffing":** Using terms like "Microservices" or "AI" without explaining *why*.

        **LENS C: The Communication Delta**
        - **Structure:** Was the answer structured (STAR method) or rambling?
        - **Ownership:** Did they drive the conversation or passively wait for prompts?

        ### SCORING CRITERIA:
        - **9-10:** Flawless. Mentions trade-offs, edge cases, and business impact.
        - **6-8:** Correct but shallow. Textbook answer without real-world depth.
        - **0-5:** Incorrect, vague, or dangerous engineering practices.

        REQUIREMENTS:
        1. **Global Score (0-100):** Be strict. 
        2. **Executive Summary:** A concise verdict. 
            - **STRICT CONSTRAINT:** Do NOT use generic phrases. 
            - **MANDATORY:** Append 2-5 lines of specific, high-value improvement advice based on the interview performance.
        3. **Silent Killers:** Detect subtle red flags (e.g., "Umm", lack of confidence, shallow knowledge).
        4. **Per-Question Breakdown:** For EVERY question, provide:
            - "question": The original question.
            - "user_answer": The exact answer given.
            - "score": 0-10 rating.
            - "feedback": Critique of the user's answer.A detailed technical paragraph (2-3 sentences only)
            - "ideal_answer": Craft a response optimized for the highest possible selection probability. The answer must exhibit Principal Engineer–level depth, maintain absolute technical precision, and include fully correct, syntactically valid code whenever applicable.

        CRITICAL OUTPUT & JSON FORMATTING CONSTRAINTS:
        1. **Strict JSON Only:** Output ONLY a valid JSON object. Do not include any markdown formatting (like ```json), and do not include any text before or after the JSON.
        2. **No Emojis or Special Characters:** You are strictly forbidden from using emojis, emoticons, or special Unicode symbols (e.g., ✅, 🚨, 🎯, ⭐). Output standard, plain text English characters ONLY.
        3. **No Surrogate Pairs:** Do not use complex formatting that requires surrogate pairs.
        4. **Escape All Backslashes:** If you write code inside your JSON containing '\n' or '\t', you MUST double-escape it as '\\n' or '\\t'.
        Failure to comply with any of these rules will cause a fatal system crash in the JSON parser.

        OUTPUT FORMAT (JSON ONLY):
        {{
            "score": <number>,
            "summary": "<executive_summary_string>",
            "silent_killers": ["<killer1>", "<killer2>"],
            "roadmap": "<step_by_step_improvement_plan>",
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

        analysis_dict = generate_with_failover(prompt, expected_type='dict', timeout_val=45)
        
        # ====================================================================
        # 🔥 THE HYBRID ZERO-SCORE INTERCEPTOR 🔥
        # Python scans the AI's output. If the user skipped the question,
        # Python overwrites the AI's score to 0 to prevent pity-points, 
        # but KEEPS the AI's `ideal_answer` so the user can learn from it.
        # ====================================================================
        total_score = 0
        question_reviews = analysis_dict.get('question_reviews', [])
        skipped_count = 0
        
        for i, review in enumerate(question_reviews):
            if i < len(transcript_data):
                user_ans = str(transcript_data[i].get('answer', '')).strip().lower()
                word_count = len(re.findall(r'\w+', user_ans))
                
                is_skipped = (
                    word_count < 3 or 
                    "[no answer" in user_ans or 
                    "error" in user_ans or 
                    "i don't know" in user_ans or 
                    "i dont know" in user_ans
                )
                
                if is_skipped:
                    skipped_count += 1
                    review['score'] = 0
                    review['feedback'] = "⚠️ [AUTO-ZERO: CANDIDATE SKIPPED/NO ANSWER] " + review.get('feedback', '')
                    
            total_score += review.get('score', 0)
            
        num_q = len(question_reviews)
        if num_q > 0:
            analysis_dict['score'] = int((total_score / (num_q * 10)) * 100)
        else:
            analysis_dict['score'] = 0
            
        if skipped_count == len(transcript_data) and len(transcript_data) > 0:
            analysis_dict['summary'] = "AUTOMATIC DISQUALIFICATION: The candidate failed to provide answers to any of the required questions. Zero technical competence demonstrated."
            analysis_dict['roadmap'] = "1. Actually attempt the questions.\n2. Study the core concepts of the domain.\n3. Do not remain silent during technical assessments."
            if "Refusal to Answer" not in analysis_dict.get('silent_killers', []):
                analysis_dict.setdefault('silent_killers', []).append("Refusal to Answer")
        elif skipped_count > 0:
            analysis_dict['summary'] += f" [WARNING: The candidate skipped {skipped_count} question(s), heavily penalizing their final score.]"
            if "Skipped Questions" not in analysis_dict.get('silent_killers', []):
                analysis_dict.setdefault('silent_killers', []).append("Skipped Questions")

        return analysis_dict

    except Exception as e:
        print(f"❌ EVALUATION CRASHED. EXTINCTION EVENT: {e}", flush=True)
        
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

# ==========================================
# 8. EXECUTION ENTRY POINT
# ==========================================

def main():
    print("--- 1. Generating Questions (Strict Anti-Repetition Engine) ---", flush=True)
    topic_to_test = "Distributed Systems"
    
    # Let's request 10 questions to force it to generate a mix of Coding, Aptitude, HR, and Theory
    questions = generate_interview_questions(topic_to_test, "Principal Engineer", 10)
    print("\n[GENERATED QUESTIONS]", flush=True)
    print(json.dumps(questions, indent=2), flush=True)
    
    transcript = []
    if isinstance(questions, list):
        for q in questions[:1]: # Just taking the first one to test the evaluator
            transcript.append({
                "question": q.get('question', 'Error'),
                "answer": "I would use the Saga Pattern to handle distributed transactions. Specifically, I would use an Orchestration approach where a central service manages the workflow and issues compensations if any step fails." 
            })
    else:
        transcript.append({"question": "Error", "answer": "Error"})
        
    print("\n--- 2. Evaluating Interview (Synchronous Supreme Auditor) ---", flush=True)
    
    analysis = evaluate_full_interview(transcript)
    print("\n[FINAL EVALUATION ANALYSIS]", flush=True)
    print(json.dumps(analysis, indent=2), flush=True)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped by user.", flush=True)
    finally:
        history_system.close()