
//------------------------------------------------------------------------------------------------------------------------------
// 13 feb count store the number of questions 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions, generateResumeQuestions } from '../services/api';

// --- DATASETS ---
const TOPICS = [
  "Data Structures & Algorithms", "System Design (LLD/HLD)", "Full Stack Development",
  "Frontend Engineering (React/Vue)", "Backend Engineering (Node/Django)", "DevOps & CI/CD Pipelines", 
  "Cloud Computing (AWS/Azure)", "Microservices Architecture", "Database Management (SQL/NoSQL)", 
  "Cybersecurity & Network Security", "Artificial Intelligence & ML", "Machine Learning Operations (MLOps)",
  "Big Data Engineering", "Blockchain & Web3", "Mobile Development (Flutter/Native)", 
  "Operating Systems & Concurrency", "Computer Networks", "Java Enterprise (Spring Boot)", 
  "Python (FastAPI/Flask)", "C++ High Performance Computing", "Golang (Go)", 
  "Rust Systems Programming", "GraphQL & API Design", "Kubernetes & Docker Orchestration",
  "QA Automation & Testing"
];

const PROFESSIONAL_FIELDS = [
  "Software Engineering & Development", "Data Science & Analytics", "Product Management",
  "Civil Engineering", "Mechanical Engineering", "Electrical & Electronics Engineering",
  "Medical (Doctor/Surgeon)", "Nursing & Healthcare", "Pharmacy & Biotech",
  "Chartered Accountancy (CA) & Finance", "Investment Banking", "Marketing & Digital Strategy",
  "Human Resources (HR)", "Sales & Business Development", "Supply Chain & Logistics",
  "Corporate Law & Legal", "Journalism & Media", "Architecture & Interior Design",
  "Teaching & Education", "Graphic & UI/UX Design", "Content Writing & Copywriting",
  "Hospitality & Hotel Management", "Aviation & Pilot", "Social Work & NGO",
  "Government & Public Service"
];

const EXPERIENCE_LEVELS = [
  "Entry Level (0-1 Year)",
  "Junior (1-2 Years)",
  "Mid-Level (2-3 Years)",
  "Senior (3+ Years)",
  "Expert / Principal (5+ Years)"
];

// --- EMERGENCY FALLBACK BANK (Silent Crash Prevention) ---
const EMERGENCY_QUESTIONS = {
    "Software": [
        "Explain the difference between a process and a thread.",
        "How do you handle error handling in your preferred language?",
        "Describe a challenging bug you fixed recently.",
        "What is the importance of CI/CD pipelines?",
        "Explain the concept of RESTful APIs and how they differ from GraphQL.",
        "What are the ACID properties in databases?",
        "Describe how you optimize a slow-running query.",
        "Explain the concept of polymorphism in OOP.",
        "How do you manage state in complex applications?",
        "What is Docker and why is it used?"
    ],
    "General": [
        "Tell me about a time you faced a significant challenge at work.",
        "What are your greatest professional strengths and weaknesses?",
        "Describe a project you are particularly proud of.",
        "How do you handle tight deadlines and pressure?",
        "Where do you see yourself in 5 years professionally?",
        "Describe a time you had a conflict with a colleague.",
        "How do you prioritize your tasks?",
        "What motivates you in your daily work?",
        "Describe your leadership style.",
        "How do you adapt to changes in the workplace?"
    ]
};

const Setup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [setupMode, setSetupMode] = useState('mock'); // 'mock' or 'resume'

  // Config for MOCK
  const [mockConfig, setMockConfig] = useState({
    round: 'Technical',
    topic: TOPICS[0],
    difficulty: 'Medium',
    count: 3
  });

  // Config for RESUME
  const [resumeConfig, setResumeConfig] = useState({
    file: null,
    field: "", // Default empty to force selection
    experience: EXPERIENCE_LEVELS[1], // Default Junior
    count: 3
  });

  // Dynamic Logic: Reset topic if round changes
  useEffect(() => {
    if (mockConfig.round === 'HR') {
        setMockConfig(prev => ({ ...prev, topic: 'Behavioral & Culture Fit' }));
    } else if (mockConfig.round === 'Aptitude') {
        setMockConfig(prev => ({ ...prev, topic: 'Logic & Quantitative Analysis' }));
    } else if (mockConfig.round === 'Technical' && !TOPICS.includes(mockConfig.topic)) {
        setMockConfig(prev => ({ ...prev, topic: TOPICS[0] }));
    }
  }, [mockConfig.round]);

  // Helper to parse YOE string to int for backend
  const getYOE = (expString) => {
    if (expString.includes("Entry")) return 0;
    if (expString.includes("Junior")) return 2;
    if (expString.includes("Mid")) return 3;
    if (expString.includes("Senior")) return 5;
    if (expString.includes("Expert")) return 8;
    return 1;
  };

  const handleStart = async () => {
    setLoading(true); // Trigger the blur and spinner
    let finalQuestions = [];
    let finalTopic = "";
    
    // --- WISE DETECTION OF USER SELECTION ---
    // We capture the target count BEFORE any logic runs to ensure consistency
    const targetCount = setupMode === 'resume' 
        ? parseInt(resumeConfig.count) 
        : parseInt(mockConfig.count);

    try {
        // ==========================================
        // PATH A: RESUME ANALYSIS
        // ==========================================
        if (setupMode === 'resume') {
             // --- 0. FIELD CHECK (STRICT VALIDATION) ---
             if (!resumeConfig.field) {
                alert("Please select a Professional Field first.");
                setLoading(false);
                return;
             }

             if (!resumeConfig.file) {
                alert("Please upload a resume file.");
                setLoading(false);
                return;
            }

            // --- 1. SIZE CHECK ---
            const MAX_SIZE_MB = 5;
            if (resumeConfig.file.size > MAX_SIZE_MB * 1024 * 1024) {
                alert(`File too large! Please upload a file smaller than ${MAX_SIZE_MB}MB.`);
                setLoading(false);
                return;
            }

            // Read File
            const text = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsText(resumeConfig.file);
            });

            // Call API
            const yoe = getYOE(resumeConfig.experience);
            console.log(`📄 Requesting ${targetCount} Resume Questions for ${resumeConfig.field}...`);
            finalTopic = resumeConfig.field;
            
            const res = await generateResumeQuestions(text, resumeConfig.field, yoe, targetCount);
            finalQuestions = res.data?.questions || res.questions || [];

            // --- SILENT CRASH CHECK ---
            if (!finalQuestions || finalQuestions.length === 0) {
                console.warn("⚠️ Resume API returned 0 questions. Engaging Fallback.");
                throw new Error("0 Questions Returned");
            }

            // Success Navigation
            navigate('/resume-interview', { 
                state: { 
                    questions: finalQuestions, 
                    config: { 
                        mode: 'resume', 
                        field: resumeConfig.field, 
                        experience: resumeConfig.experience,
                        topic: resumeConfig.field, 
                        requestedCount: targetCount, // Store Wise Selection
                        detectSilentKillers: true 
                    } 
                } 
            });

        } 
        // ==========================================
        // PATH B: STANDARD MOCK (FIXED)
        // ==========================================
        else {
            console.log(`🤖 Requesting ${targetCount} General Questions...`);
            finalTopic = mockConfig.topic;

            // Call API
            const res = await generateQuestions({
                topic: mockConfig.topic, 
                difficulty: mockConfig.difficulty, 
                count: targetCount,
                round_type: mockConfig.round 
            });
            finalQuestions = res.data?.questions || res.questions || [];

            // --- SILENT CRASH CHECK ---
            if (!finalQuestions || finalQuestions.length === 0) {
                console.warn("⚠️ Mock API returned 0 questions. Engaging Fallback.");
                throw new Error("0 Questions Returned");
            }

            // Success Navigation
            navigate('/interview', { 
                state: { 
                    questions: finalQuestions, 
                    config: { 
                        mode: 'standard', 
                        ...mockConfig,
                        requestedCount: targetCount, // Store Wise Selection
                        detectSilentKillers: true 
                    } 
                } 
            });
        }

    } catch (err) {
        console.error("\n🛑 SILENT CRASH PREVENTED 🛑");
        console.error("📍 Detail:", err.message);
        console.warn(`⚠️ ACTIVATING EMERGENCY PROTOCOL for ${targetCount} Questions`);
        
        // 3. EMERGENCY FALLBACK LOGIC WITH WISE PADDING
        const safeTopic = (finalTopic || "").toLowerCase();
        const isSoftwareContext = safeTopic.includes("soft") || safeTopic.includes("dev") || safeTopic.includes("code") || safeTopic.includes("tech") || safeTopic.includes("data");
        const fallbackKey = isSoftwareContext ? "Software" : "General";
        
        const baseEmergencyQuestions = EMERGENCY_QUESTIONS[fallbackKey];
        
        // --- WISE PADDING ALGORITHM ---
        // If user asked for 20 questions but we only have 10 emergency ones,
        // we cycle through them to ensure the Simulation has the EXACT length user requested.
        let paddedQuestions = [];
        while (paddedQuestions.length < targetCount) {
            paddedQuestions = paddedQuestions.concat(baseEmergencyQuestions);
        }
        // Trim to exact size
        finalQuestions = paddedQuestions.slice(0, targetCount);

        console.log(`✅ Recovered with ${finalQuestions.length} Emergency Questions.`);

        if (setupMode === 'resume') {
            navigate('/resume-interview', { 
                state: { 
                    questions: finalQuestions, 
                    config: { 
                        mode: 'resume', 
                        field: resumeConfig.field || "General Professional",
                        experience: resumeConfig.experience,
                        topic: resumeConfig.field || "Resume Audit",
                        requestedCount: targetCount, // Persist the selection
                        detectSilentKillers: true
                    } 
                } 
            });
        } else {
            navigate('/interview', { 
                state: { 
                    questions: finalQuestions, 
                    config: { 
                        mode: 'standard', 
                        topic: mockConfig.topic || "General Interview", 
                        round: mockConfig.round,
                        requestedCount: targetCount, // Persist the selection
                        detectSilentKillers: true
                    } 
                } 
            });
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 overflow-hidden font-sans">
      
      {/* ===========================================
        LOADING OVERLAY (BLUR & SPINNER) 
        - Covers entire card when loading is true
        - Uses backdrop-blur for the effect
        ===========================================
      */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/30 backdrop-blur-md transition-all duration-300">
           {/* Round Tickling Animation (Spinner) */}
           <div className="relative w-24 h-24">
             <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
             <div className="absolute inset-4 border-4 border-blue-500 rounded-full border-b-transparent animate-spin-slow"></div>
           </div>
           
           <h2 className="mt-8 text-2xl font-black text-slate-800 tracking-tight animate-pulse">
              {setupMode === 'resume' ? 'ANALYZING PROFILE' : 'INITIALIZING SIMULATION'}
           </h2>
           <p className="text-sm font-bold text-slate-500 mt-2 tracking-widest">
              PLEASE WAIT...
           </p>
        </div>
      )}

      {/* MAIN CARD */}
      <div className={`bg-white p-6 md:p-10 max-w-3xl w-full relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${loading ? 'blur-sm grayscale opacity-80 pointer-events-none' : ''}`}>
        
        {/* Top Decorative Bar */}
        <div className={`absolute top-0 left-0 w-full h-3 transition-colors duration-500 ${setupMode === 'resume' ? 'bg-blue-600' : 'bg-red-600'}`}></div>

        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-tighter text-slate-800">
                Simulation <span className={`transition-colors duration-500 ${setupMode === 'resume' ? 'text-blue-600' : 'text-red-600'}`}>Protocol</span>
            </h1>
            <p className="font-mono text-xs md:text-sm text-gray-400 font-bold tracking-widest">
                SELECT ENTRY VECTOR
            </p>
        </div>

        {/* --- TABS (AUTO DISABLE LOGIC) --- */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Mock Interview Tab */}
            <button 
                onClick={() => setSetupMode('mock')}
                className={`py-4 px-2 font-black uppercase rounded-lg transition-all duration-300 transform active:scale-95 ${
                    setupMode === 'mock' 
                    ? 'bg-slate-100 text-red-600 border-2 border-red-100 shadow-inner' 
                    : 'text-gray-400 hover:bg-slate-50 border-2 border-transparent hover:border-slate-100'
                }`}
            >
                <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                    <i className="fa-solid fa-code"></i>
                    <span>Mock Interview</span>
                </div>
            </button>

            {/* Resume Upload Tab */}
            <button 
                onClick={() => setSetupMode('resume')}
                className={`py-4 px-2 font-black uppercase rounded-lg transition-all duration-300 transform active:scale-95 ${
                    setupMode === 'resume' 
                    ? 'bg-slate-100 text-blue-600 border-2 border-blue-100 shadow-inner' 
                    : 'text-gray-400 hover:bg-slate-50 border-2 border-transparent hover:border-slate-100'
                }`}
            >
                <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                    <i className="fa-solid fa-file-arrow-up"></i>
                    <span>Upload Resume</span>
                </div>
            </button>
        </div>

        <div className="min-h-[400px]">
          
          {/* ======================= MOCK CONFIG (Disable Resume Logic) ======================= */}
          <div className={`transition-all duration-500 ${setupMode === 'mock' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden'}`}>
              
                {/* 1. Interaction Type */}
                <div className="flex flex-col gap-2 mb-6">
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs">1</span> 
                        Interaction Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['Technical', 'HR', 'Aptitude'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setMockConfig({...mockConfig, round: type})}
                                className={`py-3 rounded-lg border-2 font-bold transition-all text-sm md:text-base ${
                                    mockConfig.round === type 
                                    ? 'border-red-600 bg-red-50 text-red-700 shadow-sm' 
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Target Domain */}
                <div className={`flex flex-col gap-2 mb-6 transition-all duration-300 ${mockConfig.round !== 'Technical' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs">2</span>
                        Target Domain
                    </label>
                    <div className="relative">
                        <select 
                            className="appearance-none w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-700 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer"
                            value={mockConfig.topic}
                            onChange={(e) => setMockConfig({...mockConfig, topic: e.target.value})}
                        >
                            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <i className="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 3. Intensity */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs">3</span>
                            Intensity
                        </label>
                        <select 
                            className="w-full p-3 border-2 border-slate-200 rounded-lg font-bold text-slate-700 focus:border-red-500 outline-none bg-slate-50 focus:bg-white transition-all"
                            onChange={(e) => setMockConfig({...mockConfig, count: e.target.value})}
                            value={mockConfig.count}
                        >   
                            <option value="3">Sprint Dive (3 Qs)</option>
                            <option value="5">Standard (5 Qs)</option>
                            <option value="8">Deep Dive (8 Qs)</option>
                            

                        </select>
                    </div>

                    {/* 4. Difficulty */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs">4</span>
                            Difficulty
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {['Easy', 'Medium', 'Hard'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setMockConfig({...mockConfig, difficulty: level})}
                                    className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${
                                        mockConfig.difficulty === level 
                                        ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
          </div>

          {/* ======================= RESUME CONFIG (Disable Mock Logic) ======================= */}
          <div className={`transition-all duration-500 ${setupMode === 'resume' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden'}`}>
              
                 <div className="relative group border-2 border-dashed border-slate-300 rounded-2xl p-8 md:p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer mb-6">
                        <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,.txt" 
                            onChange={(e) => setResumeConfig({...resumeConfig, file: e.target.files[0]})}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`text-5xl mb-4 transition-transform group-hover:scale-110 ${resumeConfig.file ? 'text-green-500' : 'text-slate-300 group-hover:text-blue-500'}`}>
                             <i className={`fa-solid ${resumeConfig.file ? 'fa-check-circle' : 'fa-cloud-upload'}`}></i>
                        </div>
                        <p className="font-bold text-lg text-slate-700">
                            {resumeConfig.file ? resumeConfig.file.name : "Drop Resume Here"}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">PDF, DOC, TXT (Max 5MB)</p>
                 </div>

                 <div className="flex flex-col gap-2 mb-6">
                    <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                         <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                         Professional Field
                    </label>
                    <div className="relative">
                        <select 
                            className="appearance-none w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all"
                            value={resumeConfig.field}
                            onChange={(e) => setResumeConfig({...resumeConfig, field: e.target.value})}
                        >
                            <option value="" disabled>-- Select Professional Field --</option>
                            {PROFESSIONAL_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <i className="fa-solid fa-chevron-down"></i>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                            Experience
                        </label>
                        <select 
                            className="w-full p-3 border-2 border-slate-200 rounded-lg font-bold text-slate-700 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                            value={resumeConfig.experience}
                            onChange={(e) => setResumeConfig({...resumeConfig, experience: e.target.value})}
                        >
                            {EXPERIENCE_LEVELS.map(exp => (
                                <option key={exp} value={exp}>{exp}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                             <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                             Scrutiny Level
                        </label>
                        <select 
                            className="w-full p-3 border-2 border-slate-200 rounded-lg font-bold text-slate-700 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                            value={resumeConfig.count}
                            onChange={(e) => setResumeConfig({...resumeConfig, count: e.target.value})}
                        >
                            <option value="3">Sprint Audit (3 Qs)</option>
                            <option value="5">Standard Review (5 Qs)</option>
                            <option value="8">Deep Check (8 Qs)</option>
                        </select>
                    </div>
                </div>
          </div>
        </div>

        <button 
            onClick={handleStart}
            disabled={loading}
            className={`w-full py-5 mt-8 text-xl font-black text-white uppercase rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                setupMode === 'resume' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500' 
                : 'bg-gradient-to-r from-red-600 to-red-500'
            }`}
        >
            {setupMode === 'resume' ? "ANALYZE RESUME" : "INITIATE SIMULATION"}
        </button>

      </div>
    </div>
  );
};

export default Setup;