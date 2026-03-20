#-----------------------------------------------------------------------------------------------------
# 1 march
import sys
import os
# --- 1. FORCE PATH TO CURRENT DIRECTORY (Crucial for imports) ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import uuid
import traceback  # <--- CRITICAL IMPORT FOR DEBUGGING
from datetime import datetime
import re

# --- 2. IMPORT AI ENGINES ---
try:
    # Resume Engines
    from app.llm.resume_generator import generate_resume_questions_wrapper
    from app.llm.resume_evaluator import evaluate_resume_session, generate_with_failover
    
    # Standard Mock Engines
    from app.llm.generator import generate_questions_ai 
    from app.llm.evaluator import evaluate_full_interview
    
    print("✅ AI Engines Imported Successfully", flush=True)
except ImportError as e:
    print(f"⚠️ Import Warning: {e}", flush=True)
    traceback.print_exc() # Print why import failed
    # Dummies to prevent server crash if files are missing
    def generate_resume_questions_wrapper(*args, **kwargs): return []
    def evaluate_resume_session(*args, **kwargs): return {"score": 0, "summary": "Import Error"}
    def generate_questions_ai(*args, **kwargs): return []
    def evaluate_full_interview(*args, **kwargs): return {"score": 0, "summary": "Import Error"}
    def generate_with_failover(*args): return "AI Unavailable"

app = FastAPI()

# Enable CORS for Frontend (Port 5173)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], #Keep this as "*" for the initial deployment
#     allow_methods=["*"],
#     allow_headers=["*"],
#     # allow_credentials=True,
#     allow_credentials=False, # 
# )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mockshield-20.vercel.app"], # YOUR EXACT VERCEL URL
    allow_credentials=True, # NOW SAFE TO BE TRUE
    allow_methods=["*"],
    allow_headers=["*"],
)
# ==========================================
#  DATABASE UTILS (JSON FILE)
# ==========================================
DB_FILE = "db.json"

def load_db():
    if not os.path.exists(DB_FILE): return []
    try:
        with open(DB_FILE, "r") as f: return json.load(f)
    except: return []

def save_db(data):
    with open(DB_FILE, "w") as f: json.dump(data, f, indent=4)

# ==========================================
#  DATA MODELS
# ==========================================
class ResumeGenRequest(BaseModel):
    resume_text: str
    domain: str
    yoe: int = 1
    count: int = 5

class GeneralGenRequest(BaseModel):
    topic: str
    difficulty: str
    count: int
    round_type: str = "Technical" 

class EvaluationRequest(BaseModel):
    transcript: list
    domain: str
    experience_level: str

class StandardEvalRequest(BaseModel):
    transcript: list

class ChatRequest(BaseModel):
    message: str
    context: dict = {}

# ==========================================
#  ROUTES
# ==========================================

@app.get("/")
def health_check():
    return {"status": "MockShield AI Online", "port": 8000}

# --- 1. RESUME GENERATION (WITH TRACEBACK) ---
@app.post("/generate_resume_questions")
async def generate_resume_endpoint(req: ResumeGenRequest):
    print(f"📄 GENERATING RESUME QUESTIONS: {req.domain} ({req.yoe} YOE)", flush=True)
    try:
        questions = generate_resume_questions_wrapper(
            resume_text=req.resume_text,
            domain=req.domain,
            yoe=req.yoe,
            count=req.count
        )
        return {"questions": questions}
    except Exception as e:
        print(f"❌ Resume Generation Error: {e}", flush=True)
        print("vvvvvvvvvv TRACEBACK vvvvvvvvvv", flush=True)
        traceback.print_exc()  # <--- THIS PRINTS THE REAL ERROR
        print("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^", flush=True)
        # Return empty list to trigger Frontend Emergency Fallback
        return {"questions": []} 

# --- 2. STANDARD MOCK GENERATION (WITH TRACEBACK) ---
@app.post("/generate")
async def generate_general_endpoint(req: GeneralGenRequest):
    print(f"🤖 GENERATING MOCK QUESTIONS: {req.topic}", flush=True)
    try:
        questions = generate_questions_ai(
            topic=req.topic,
            difficulty=req.difficulty,
            count=req.count,
            round_type=req.round_type
        )
        return {"questions": questions}
    except Exception as e:
        print(f"❌ Mock Generation Error: {e}", flush=True)
        print("vvvvvvvvvv TRACEBACK vvvvvvvvvv", flush=True)
        traceback.print_exc() # <--- DEBUGGING ENABLED
        print("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^", flush=True)
        return {"questions": []}

# --- 3. RESUME EVALUATION (WITH TRACEBACK) ---
@app.post("/evaluate_resume_session")
async def evaluate_resume_endpoint(req: EvaluationRequest):
    print(f"⚖️ EVALUATING RESUME SESSION: {req.domain}", flush=True)
    try:
        feedback = evaluate_resume_session(
            transcript_data=req.transcript,
            field=req.domain,
            experience=req.experience_level
        )
        return feedback
    except Exception as e:
        print(f"❌ Resume Evaluation Error: {e}", flush=True)
        traceback.print_exc() # <--- DEBUGGING ENABLED
        return {"error": "Evaluation failed"}

# --- 4. STANDARD EVALUATION (WITH TRACEBACK) ---
@app.post("/evaluate_session")
async def evaluate_session_endpoint(req: StandardEvalRequest):
    print("⚖️ EVALUATING STANDARD SESSION", flush=True)
    try:
        feedback = evaluate_full_interview(req.transcript)
        return feedback
    except Exception as e:
        print(f"❌ Standard Evaluation Error: {e}", flush=True)
        traceback.print_exc() # <--- DEBUGGING ENABLED
        return {"score": 0, "summary": "Evaluation Error"}

# --- 5. CHAT COACH (WITH TRACEBACK) ---
# ==========================================
#  FORCED TERMINAL DISPLAY: 100-LAYER CHAT LOOP
# ==========================================
@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    import sys
    import os
    import re
    import json
    import ast
    import traceback
    import google.generativeai as genai
    
    # ------------------------------------------------------------------
    # ULTIMATE FORCE PRINT FUNCTION (Bypasses VS Code & FastAPI filters)
    # ------------------------------------------------------------------
    def FORCE_PRINT(msg):
        output = f"{msg}\n"
        sys.stdout.write(output)
        sys.stdout.flush()
        sys.stderr.write(output)
        sys.stderr.flush()
        try:
            os.write(1, output.encode('utf-8'))
        except:
            pass

    FORCE_PRINT("\n" + "🔥"*30)
    FORCE_PRINT("🚨🚨 CHAT ROUTE HIT! INITIATING 2-STAGE FAILOVER 🚨🚨")
    FORCE_PRINT(f"💬 USER MESSAGE: '{req.message}'")
    
    try:
        topic = req.context.get("topic", "General Interview")
        score = req.context.get("score", "N/A")
        page = req.context.get("page", "Live/Dashboard Session")
        
        # --- THE RESTORED SUPREME AI PROFESSIONAL PROMPT ---
        prompt = f"""
            ### SYSTEM ROLE:

            You are the **MockShield Apex AI — Principal/Staff Interview Authority (CODE NAME: BOB)**, an elite polymath across Software Engineering, Distributed Systems, Security, Mathematics, Finance, Medicine, and Law. Deliver **forensic, proof-grade, production-level answers** with zero ambiguity.

            ### SESSION CONTEXT:

            * **Current Location:** {page}
            * **Subject Domain:** {topic}
            * **Competency Score:** {score}/100

            ### USER INQUIRY:

            "{req.message}"

            ### MANDATORY INSTRUCTIONS (STRICT ENFORCEMENT):

            1. **Proof Correctness:** Derive from constraints; prove exhaustiveness; eliminate invalid cases.
            2. **Core Constraint:** Identify and apply the most restrictive condition.
            3. **Mechanistic Depth:** Show stepwise logic; include edge cases and failures.
            4. **Senior Signal:** Add trade-offs or alt approaches; distinguish shallow vs rigorous.
            5. **Gap Analysis:** Justify {score}/100; state exact fixes to reach 100%.
            6. **Critical Insight:** State the key invariant/principle ensuring correctness.
            7. **Precision Language:** Dense, technical, no fluff.

            ### EXTREME CONSTRAINT:

            Max **4 sentences**, each with distinct technical value.

            ### CRITICAL OUTPUT FORMAT:

            Return ONLY a valid JSON dictionary. No Markdown, no extra or plain text.
            Format strictly as: {{"reply": "4-sentence, proof-grade, principal-level response"}}
            """

        gemini_models_list = [
            'models/gemini-3.1-flash-preview', 'models/gemini-3.1-flash-lite-preview',
            'models/gemini-3-flash-preview','models/gemini-3-flash-lite-preview', 'gemini-3.1-pro-preview', 
            'models/gemini-3.1-pro-preview-customtools', 'models/gemini-2.5-pro', 'models/gemini-2.5-flash', 
            'models/gemini-2.5-flash-lite', 'models/gemini-2.0-flash', 'models/gemini-2.0-flash-001', 
            'models/gemini-2.0-flash-lite', 'models/gemini-2.0-flash-lite-001', 'models/gemini-2.0-flash-exp', 
            'models/gemini-exp-1206', 'models/gemini-2.0-flash-lite-preview', 'models/gemini-2.0-flash-lite-preview-02-05',
            'models/gemini-2.5-flash-preview-09-2025', 'models/gemini-2.5-flash-lite-preview-09-2025',
            'models/gemma-3-27b-it', 'models/gemma-3-12b-it', 'models/gemma-3-4b-it',
            'models/gemma-3-1b-it', 'models/gemma-3n-e4b-it', 'models/gemma-3n-e2b-it',
            'models/gemma-2-27b-it', 'models/gemma-2-9b-it', 'models/gemma-2-2b-it',
            'models/gemini-robotics-er-1.5-preview', 'models/gemini-3-pro-preview',
            'models/deep-research-pro-preview-12-2025', 'models/gemini-1.5-pro',
            'models/gemini-1.5-pro-latest', 'models/gemini-1.5-pro-001', 'models/gemini-1.5-pro-002',
            'models/gemini-1.5-flash', 'models/gemini-1.5-flash-latest', 'models/gemini-1.5-flash-001',
            'models/gemini-1.5-flash-002', 'models/gemini-1.5-flash-8b', 'models/gemini-1.5-flash-8b-latest',
            'models/gemini-1.5-flash-8b-001', 'models/gemini-flash-latest', 'models/gemini-flash-lite-latest',
            'models/gemini-pro-latest', 'models/gemini-1.0-pro-001', 'models/gemini-pro',
            'models/gemini-pro-vision', 'models/gemini-2.5-flash-native-audio-dialog',
            'models/gemini-2.5-flash-tts', 'models/nano-banana-pro-preview', 'models/aqa'
        ]

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            FORCE_PRINT("❌ Backend Error: API Key configuration missing.")
            return {"reply": "Backend Error: API Key configuration missing."}
        genai.configure(api_key=api_key)

        # --- BULLETPROOF PARSER LOGIC ---
        def bulletproof_parse(raw_text):
            clean_text = re.sub(r'```[a-zA-Z]*\n', '', str(raw_text)).replace("```", "")
            clean_text = "".join(ch for ch in clean_text if ord(ch) >= 32 or ch in "\n\r\t")
            candidates = [m.group(0) for m in re.finditer(r'(\{.*\}|\[.*\])', clean_text, re.DOTALL)]
            if not candidates and '{' in clean_text: candidates.append(clean_text[clean_text.find('{'):])
            
            for candidate in candidates or [clean_text]:
                try: return json.loads(candidate)
                except: pass
                try: return json.loads(re.sub(r',\s*([\]}])', r'\1', candidate))
                except: pass
                try: return ast.literal_eval(candidate)
                except: pass
            raise ValueError("Bulletproof parser failed to extract JSON.")

        # ==========================================
        # STAGE 1: STRICT NATIVE JSON ENFORCEMENT
        # ==========================================
        FORCE_PRINT("\n🚀 [STAGE 1] Activating Native JSON Protocol...")
        for raw_model in gemini_models_list:
            clean_model = raw_model.replace('models/', '')
            try:
                FORCE_PRINT(f"🔄 Trying model: {clean_model}...")
                model = genai.GenerativeModel(clean_model)
                response = model.generate_content(
                    prompt, 
                    generation_config={"response_mime_type": "application/json"}
                )
                
                parsed = json.loads(response.text)
                if isinstance(parsed, dict) and "reply" in parsed:
                    FORCE_PRINT(f"✅ [SUCCESS - STAGE 1] Model '{clean_model}' generated native JSON!")
                    FORCE_PRINT(f"🤖 AI RESPONSE: {parsed['reply']}")
                    FORCE_PRINT("🔥"*30 + "\n")
                    return {"reply": str(parsed["reply"])}
            except Exception as e:
                error_msg = str(e).splitlines()[0] if str(e) else "Error"
                FORCE_PRINT(f"❌ [S1 FAILED] '{clean_model}': {error_msg[:50]}")
                continue

        # ==========================================
        # STAGE 2: BATTLE-TESTED REGEX/AST FALLBACK
        # ==========================================
        FORCE_PRINT("\n⚠️ [STAGE 2] Stage 1 Extinction Event. Rebooting with Bulletproof Parser...")
        for raw_model in gemini_models_list:
            clean_model = raw_model.replace('models/', '')
            try:
                FORCE_PRINT(f"🔄 Trying fallback model: {clean_model}...")
                model = genai.GenerativeModel(clean_model)
                response = model.generate_content(prompt)
                
                parsed = bulletproof_parse(response.text)
                if isinstance(parsed, dict) and "reply" in parsed:
                    FORCE_PRINT(f"✅ [SUCCESS - STAGE 2] Model '{clean_model}' survived Bulletproof Parsing!")
                    FORCE_PRINT(f"🤖 AI RESPONSE: {parsed['reply']}")
                    FORCE_PRINT("🔥"*30 + "\n")
                    return {"reply": str(parsed["reply"])}
            except Exception as e:
                error_msg = str(e).splitlines()[0] if str(e) else "Error"
                FORCE_PRINT(f"❌ [S2 FAILED] '{clean_model}': {error_msg[:50]}")
                continue

        FORCE_PRINT("🚨 CRITICAL: ALL 100 MODELS FAILED ACROSS BOTH STAGES!")
        return {"reply": "I'm currently overloaded with requests. Please try asking again in a few moments."}
            
    except Exception as critical_error:
        FORCE_PRINT("\n💥 SYSTEM CRASH IN /CHAT ROUTE!")
        traceback.print_exc()
        return {"reply": "A critical system error occurred. Check the backend terminal."}   

# ==========================================
#  DB ROUTES (HISTORY)
# ==========================================
@app.post("/interviews")
async def save_interview(request: Request):
    try:
        data = await request.json()
        db = load_db()
        
        new_record = {
            "id": str(uuid.uuid4()),
            "createdAt": datetime.now().isoformat(),
            "topic": data.get("topic", "Interview Session"), 
            "total_score": data.get("score", 0), 
            "summary": data.get("summary", "No summary."),
            "full_data": data 
        }
        
        db.insert(0, new_record) 
        save_db(db)
        print(f"💾 Saved Session: {new_record['id']}", flush=True)
        return {"message": "Saved", "id": new_record["id"]}
    except Exception as e:
        print(f"❌ Save DB Error: {e}", flush=True)
        traceback.print_exc()
        return {"error": "Failed to save session"}

@app.get("/interviews")
async def get_interviews():
    try:
        return load_db()
    except Exception as e:
        print(f"❌ Read DB Error: {e}", flush=True)
        traceback.print_exc()
        return []

@app.delete("/interviews/{id}")
async def delete_interview(id: str):
    try:
        db = load_db()
        new_db = [item for item in db if item["id"] != id]
        
        if len(db) == len(new_db):
            raise HTTPException(status_code=404, detail="Session not found")
        
        save_db(new_db)
        return {"message": "Deleted successfully"}
    except Exception as e:
        print(f"❌ Delete DB Error: {e}", flush=True)
        traceback.print_exc()
        return {"error": "Failed to delete"}

# --- NEW: CLEAR ALL HISTORY ENDPOINT ---
@app.delete("/api/sessions/clear")
async def clear_all_history():
    try:
        # Overwrite the JSON file with an empty list
        save_db([])
        print("🗑️ All interview history cleared successfully.", flush=True)
        return {"status": "success", "message": "All interview history permanently deleted."}
    except Exception as e:
        print(f"❌ Clear All DB Error: {e}", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to clear history")

# --- STARTUP ---
if __name__ == "__main__":
    import uvicorn
    
    # Render assigns a dynamic port. Default to 8000 for local testing.
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 MockShield AI Engine Starting on Port {port}...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port)