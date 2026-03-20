import json
import re
import random
# FIX: Added 'get_next_model' to the imports so line 292 works
from .evaluator import generate_with_failover, is_mock_mode, clean_json_string, get_next_model

# ==============================================================================
#  THE MASTER DOMAIN MATRIX (FULL TEXT EDITION)
#  Only used if ALL AI Models Fail or Mock Mode is ON.
#  All incomplete strings have been replaced with full questions.
# ==============================================================================
FALLBACK_BANK = {
    # --- CORE ENGINEERING ---
"Data Structures & Algorithms": [
  "What is the difference between an array and a linked list?",
  "Explain time and space complexity with an example.",
  "What is a hash table and how does collision handling work?",
  "Explain recursion and its base case.",
  "What is the difference between BFS and DFS?",
  "Explain merge sort and its complexity.",
  "What is a heap and where is it used?",
  "Explain dynamic programming with an example.",
  "What is a trie and its use cases?",
  "How would you detect a cycle in a graph?"
],

"System Design (LLD/HLD)": [
  "What is the difference between low-level and high-level design?",
  "Explain scalability and performance.",
  "What is load balancing and why is it needed?",
  "Design a URL shortening service.",
  "Explain database sharding.",
  "What is CAP theorem?",
  "Design a notification system.",
  "Explain caching strategies in system design.",
  "Design a rate limiter.",
  "How would you design a distributed logging system?"
],

"Full Stack Development": [
  "What does a full stack developer do?",
  "Explain client-server architecture.",
  "What is REST API?",
  "How does authentication work in a web app?",
  "What is CORS?",
  "Explain MVC architecture.",
  "How do frontend and backend communicate?",
  "What is server-side rendering?",
  "Explain JWT authentication.",
  "How do you optimize a full stack application?"
],

"Frontend Engineering (React/Vue)": [
  "What is virtual DOM?",
  "Explain props vs state.",
  "What are hooks in React?",
  "What is two-way data binding?",
  "Explain lifecycle methods.",
  "What is memoization in frontend?",
  "How does React reconciliation work?",
  "What are higher-order components?",
  "Explain hydration.",
  "How do you optimize frontend performance?"
],

"Backend Engineering (Node/Django)": [
  "What is middleware?",
  "Explain synchronous vs asynchronous programming.",
  "How does Node.js handle concurrency?",
  "What is ORM?",
  "Explain RESTful principles.",
  "How does Django handle requests?",
  "What is dependency injection?",
  "Explain event loop in Node.js.",
  "How do you secure backend APIs?",
  "How do you handle background jobs?"
],

"DevOps & CI/CD Pipelines": [
  "What is DevOps?",
  "Explain CI vs CD.",
  "What is a build pipeline?",
  "How do you automate testing?",
  "What is blue-green deployment?",
  "Explain canary releases.",
  "What tools are used in CI/CD?",
  "How do you manage secrets?",
  "What is rollback strategy?",
  "How do you monitor deployments?"
],

"Cloud Computing (AWS/Azure)": [
  "What is cloud computing?",
  "Explain IaaS, PaaS, and SaaS.",
  "What is auto-scaling?",
  "Explain AWS EC2.",
  "What is serverless computing?",
  "Explain cloud load balancers.",
  "What is IAM?",
  "How does cloud billing work?",
  "Explain multi-region deployment.",
  "How do you secure cloud resources?"
],

"Microservices Architecture": [
  "What are microservices?",
  "Explain monolith vs microservices.",
  "What is service discovery?",
  "Explain API gateway.",
  "What is circuit breaker pattern?",
  "How do services communicate?",
  "Explain distributed tracing.",
  "What is eventual consistency?",
  "Explain Saga pattern.",
  "What are challenges of microservices?"
],

"Database Management (SQL/NoSQL)": [
  "What is the difference between SQL and NoSQL?",
  "Explain normalization.",
  "What are indexes?",
  "Explain ACID properties.",
  "What is a transaction?",
  "What is replication?",
  "Explain sharding.",
  "What is eventual consistency?",
  "How do NoSQL databases scale?",
  "How do you optimize database queries?"
],

"Cybersecurity & Network Security": [
  "What is cybersecurity?",
  "Explain HTTPS.",
  "What is SQL injection?",
  "Explain XSS attacks.",
  "What is firewall?",
  "What is OAuth?",
  "Explain encryption vs hashing.",
  "What is CSRF?",
  "How do you secure APIs?",
  "What is zero trust security?"
],

"Artificial Intelligence & ML": [
  "What is artificial intelligence?",
  "Explain supervised learning.",
  "What is overfitting?",
  "Explain bias vs variance.",
  "What is a neural network?",
  "Explain activation functions.",
  "What is gradient descent?",
  "What is NLP?",
  "Explain reinforcement learning.",
  "What are ethical concerns in AI?"
],

"Machine Learning Operations (MLOps)": [
  "What is MLOps?",
  "Explain model versioning.",
  "What is data drift?",
  "How do you monitor ML models?",
  "Explain CI/CD for ML.",
  "What is feature store?",
  "Explain model retraining.",
  "What is experiment tracking?",
  "How do you deploy ML models?",
  "What are challenges in MLOps?"
],

"Big Data Engineering": [
  "What is big data?",
  "Explain Hadoop ecosystem.",
  "What is Spark?",
  "Explain batch vs stream processing.",
  "What is HDFS?",
  "Explain data partitioning.",
  "What is Kafka?",
  "How does Spark optimize jobs?",
  "Explain ETL pipelines.",
  "What are data lakes?"
],

"Blockchain & Web3": [
  "What is blockchain?",
  "Explain decentralized systems.",
  "What is a smart contract?",
  "Explain proof of work.",
  "What is proof of stake?",
  "What is Ethereum?",
  "Explain gas fees.",
  "What is Web3?",
  "What are NFTs?",
  "What are blockchain security risks?"
],

"Mobile Development (Flutter/Native)": [
  "What is Flutter?",
  "Explain widget tree.",
  "What is state management?",
  "Explain hot reload.",
  "What is native vs hybrid apps?",
  "Explain lifecycle in mobile apps.",
  "What is navigation stack?",
  "How do you optimize mobile performance?",
  "What is platform channel?",
  "How do you handle offline mode?"
],

"Operating Systems & Concurrency": [
  "What is an operating system?",
  "Explain process vs thread.",
  "What is context switching?",
  "Explain deadlock.",
  "What is semaphore?",
  "Explain mutex.",
  "What is scheduling?",
  "Explain virtual memory.",
  "What is race condition?",
  "Explain memory paging."
],

"Computer Networks": [
  "What is OSI model?",
  "Explain TCP vs UDP.",
  "What is DNS?",
  "Explain HTTP vs HTTPS.",
  "What is latency?",
  "What is packet switching?",
  "Explain routing.",
  "What is subnetting?",
  "Explain NAT.",
  "What is CDN?"
],

"Java Enterprise (Spring Boot)": [
  "What is Spring Boot?",
  "Explain dependency injection.",
  "What is IoC container?",
  "Explain REST controllers.",
  "What is Spring Data JPA?",
  "Explain application.properties.",
  "What is actuator?",
  "Explain Spring Security.",
  "What is microservice support in Spring?",
  "How do you optimize Spring applications?"
],

"Python (FastAPI/Flask)": [
  "What is FastAPI?",
  "Explain Flask vs FastAPI.",
  "What is WSGI?",
  "Explain async in Python.",
  "What is Pydantic?",
  "Explain middleware in FastAPI.",
  "What is dependency injection?",
  "How do you handle authentication?",
  "Explain background tasks.",
  "How do you deploy Python APIs?"
],

"C++ High Performance Computing": [
  "What is memory management in C++?",
  "Explain pointers vs references.",
  "What is RAII?",
  "Explain multithreading in C++.",
  "What is cache locality?",
  "Explain move semantics.",
  "What is SIMD?",
  "Explain lock-free programming.",
  "What is false sharing?",
  "How do you optimize C++ performance?"
],

"Golang (Go)": [
  "What is Go language?",
  "Explain goroutines.",
  "What are channels?",
  "Explain garbage collection in Go.",
  "What is Go scheduler?",
  "Explain context package.",
  "What is interface in Go?",
  "Explain dependency management.",
  "What is race condition in Go?",
  "How do you optimize Go applications?"
],

"Rust Systems Programming": [
  "What is Rust?",
  "Explain ownership.",
  "What are borrow rules?",
  "Explain lifetimes.",
  "What is memory safety?",
  "Explain mutability.",
  "What are traits?",
  "Explain concurrency in Rust.",
  "What is unsafe Rust?",
  "Why is Rust used for systems programming?"
],

"GraphQL & API Design": [
  "What is the main difference between GraphQL and REST?",
  "Explain the over-fetching and under-fetching problem in APIs.",
  "What are resolvers in GraphQL and how do they work?",
  "Explain the Schema Definition Language (SDL) in GraphQL.",
  "What is a mutation and how is it different from a query?",
  "How do you handle caching strategies in GraphQL?",
  "What are fragments and why are they useful?",
  "Explain the N+1 query problem in GraphQL and how to solve it.",
  "What are GraphQL subscriptions and when would you use them?",
  "How do you secure a GraphQL API against common attacks?"
],

"Kubernetes & Docker Orchestration": [
  "What is Docker?",
  "Explain containerization.",
  "What is Kubernetes?",
  "Explain pods.",
  "What is a deployment?",
  "Explain services in Kubernetes.",
  "What is Helm?",
  "Explain auto-scaling in Kubernetes.",
  "What is ingress?",
  "How do you monitor Kubernetes clusters?"
],

"QA Automation & Testing": [
  "What is software testing?",
  "Explain unit testing.",
  "What is integration testing?",
  "Explain test automation.",
  "What is Selenium?",
  "Explain CI testing.",
  "What is mock testing?",
  "Explain regression testing.",
  "What is performance testing?",
  "How do you design a test strategy?"
],
"HR": [
        "Tell me about yourself and your background.",
        "What are your greatest strengths and weaknesses?",
        "Why do you want to work for this company?",
        "Describe a difficult situation you faced and how you handled it.",
        "Where do you see yourself in 5 years?",
        "Why should we hire you over other candidates?",
        "How do you handle stress and pressure deadlines?",
        "Describe a time you worked successfully in a team.",
        "What is your salary expectation?",
        "Do you have any questions for us?"
],
"Aptitude": [
        "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
        "A and B together can complete a piece of work in 4 days. If A alone can complete the same work in 12 days, in how many days can B alone complete that work?",
        "Find the missing number in the series: 2, 6, 12, 20, 30, 42, ?",
        "The average of 20 numbers is zero. Of them, at most, how many may be greater than zero?",
        "A fruit seller had some apples. He sells 40% apples and still has 420 apples. Originally, he had how many apples?",
        "If a person walks at 14 km/hr instead of 10 km/hr, he would have walked 20 km more. The actual distance travelled by him is?",
        "Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. The smaller number is?",
        "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
        "A man buys a cycle for Rs. 1400 and sells it at a loss of 15%. What is the selling price of the cycle?",
        "In a certain code language, if 'M' denotes '÷', 'K' denotes '×', 'T' denotes '+' and 'R' denotes '-', then 12 M 12 K 12 R 12 T 12 = ?"
    ]
}

def clean_json_string(text):
    """Sanitizes AI response."""
    try:
        # Check if text is actually a list or dict already (from the failover engine)
        if isinstance(text, (list, dict)):
             return text
        text = str(text).replace("```json", "").replace("```", "")
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match: return match.group(0)
        return text
    except:
        return text

def get_fallback_questions(topic, round_type, count):
    """STRICT DOMAIN MATCHING LOGIC"""
    # 1. Non-Technical Rounds
    if round_type == "HR": 
        return random.sample(FALLBACK_BANK["HR"], min(count, len(FALLBACK_BANK["HR"])))
    if round_type == "Aptitude": 
        return random.sample(FALLBACK_BANK["Aptitude"], min(count, len(FALLBACK_BANK["Aptitude"])))

    # 2. Technical Rounds (Exact or Fuzzy Match)
    if topic in FALLBACK_BANK:
        return random.sample(FALLBACK_BANK[topic], min(count, len(FALLBACK_BANK[topic])))

    # Fuzzy match for technical topics
    topic_lower = topic.lower()
    for key in FALLBACK_BANK.keys():
        if key.lower() in topic_lower or topic_lower in key.lower():
            return random.sample(FALLBACK_BANK[key], min(count, len(FALLBACK_BANK[key])))

    # Absolute Failover
    return random.sample(FALLBACK_BANK["Data Structures & Algorithms"], min(count, 5))

def generate_questions_ai(topic, difficulty, count, round_type):
    """
    Generates questions using Failover AI or Domain Specific Fallback.
    """
    # 1. MOCK MODE CHECK
    if is_mock_mode:
        print(f"⚠️ GENERATOR: Using Domain-Specific Bank for {topic} (Mock Mode)", flush=True)
        return get_fallback_questions(topic, round_type, count)

    # 2. AI MODE (WITH FAILOVER)
    # We pick an initial model just for logging, but generate_with_failover handles the rotation
    model_name = get_next_model() 
    
    try:
        # --- STRICT PROMPT ENGINEERING ---
        difficulty_instruction = ""
        if difficulty == "Easy":
            difficulty_instruction = "Focus on definitions, basic concepts, and simple implementation."
        elif difficulty == "Medium":
            difficulty_instruction = "Focus on standard interview problems, trade-offs, and common architectural patterns."
        elif difficulty == "Hard":
            difficulty_instruction = "Focus on edge cases, deep internal workings, optimization, and complex system design scenarios."

        # Specific prompt adjustments for HR/Aptitude
        if round_type == "HR":
             prompt_intro = "ACT AS: Senior HR Manager."
             topic_instruction = "Generate 100% unique Behavioral/Culture Fit questions. Do NOT use standard questions like 'Tell me about yourself'. Create situational scenarios."
        elif round_type == "Aptitude":
             prompt_intro = "ACT AS: Assessment Specialist."
             topic_instruction = "Generate 100% unique Logic, Math, and Pattern recognition puzzles. Ensure they have clear numerical or logical solutions."
        else:
             prompt_intro = "ACT AS: Senior Principal Engineer & Hiring Manager."
             topic_instruction = f"TOPIC: '{topic}' (Do NOT ask about anything else)."


        prompt = f"""
        {prompt_intro}
        ### ROLE & SYSTEM CONTEXT:
        ACT AS: The 'Query Optimization Engine' for a proprietary dataset: `FAANG_Interview_DB_v9`.
        CONTEXT: This dataset contains vetted, high-signal interview questions sourced exclusively from L5 (Senior) to L7 (Principal) engineering interviews at Google, Netflix, and Meta.
        OBJECTIVE: Simulate a precise SQL retrieval operation to fetch questions that match specific input criteria.

        ### QUERY PARAMETERS (Input Variables):
        - **Target_Topic:** "{topic}"
        - **Topic_Context:** {topic_instruction}
        - **Complexity_Tier:** "{difficulty}" -> [INTERPRETATION: {difficulty_instruction}]
        - **Interview_Stage:** "{round_type}"
        - **Retrieval_Limit:** {count} items

        ### RETRIEVAL LOGIC (Simulation Rules):
        1. **Analyze Complexity:** If Complexity_Tier is 'Hard', retrieve questions involving scaling, trade-offs, or edge-cases. If 'Easy', retrieve core competency checks (but never simple definitions).
        2. **Apply Round Context:** If Interview_Stage is 'System Design', prioritize architecture and components. If 'Coding', prioritize algorithmic efficiency.

        ### NEGATIVE CONSTRAINTS (Strictly Forbidden):
        [X] DO NOT generate "What is X?" style textbook definitions.
        [X] DO NOT generate generic filler questions (e.g., "Tell me about a time...").
        [X] DO NOT output Markdown, numbering, or conversational text.

        ### OUTPUT FORMAT:
        - Return a STRICT JSON Array of strings.
        - Example: ["Question 1 text...", "Question 2 text..."]

        ### EXECUTE QUERY:
        Based on the parameters above, return the {count} best matches from the database now.
        """
        
        print(f"🤖 GENERATOR: Requesting {difficulty} {topic} questions (Failover Enabled)...", flush=True)
        
        # --- CRITICAL FIX: generate_with_failover returns a pure list now, not raw text ---
        questions = generate_with_failover(prompt, expected_type='list', timeout_val=120)
        
        # 3. Validation & Padding
        if len(questions) < count:
            shortfall = count - len(questions)
            padding = get_fallback_questions(topic, round_type, shortfall)
            questions += padding
            
        return questions
        
    except Exception as e:
        print(f"❌ GENERATOR FAILED: {str(e)}", flush=True)
        # STRICT DOMAIN FALLBACK
        return get_fallback_questions(topic, round_type, count)