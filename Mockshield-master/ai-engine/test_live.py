import sys
import os

# --- PATH FIX: Add the project root to system path ---
# Get the directory where this script is located (app/llm)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up two levels to reach the root 'ai-engine' folder
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.insert(0, project_root)
# -----------------------------------------------------

from app.llm.resume_evaluator import generate_resume_questions

print("--- TESTING AI GENERATION ---")
try:
    # We use a dummy resume to test the logic
    questions = generate_resume_questions(
        topic="Python Developer", 
        resume_text="Experienced in Django, Flask, and AWS.", 
        difficulty="Senior"
    )
    print("✅ SUCCESS! AI Output:")
    print(questions)
except Exception as e:
    print(f"❌ FAILED: {e}")