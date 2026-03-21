
// //--------------------------------------------------------------------------------------------------------------
// import axios from 'axios';

// // --- CONFIGURATION ---
// // We are routing everything to the Python AI Engine (Port 8000)
// // const PYTHON_API = 'http://localhost:8000';
// // const NODE_API = 'http://localhost:5000/api'; 
// // --- CONFIGURATION ---
// // VITE_PYTHON_API_URL will be injected by Render during deployment
// const PYTHON_API = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
// const NODE_API = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';
// // ==========================================
// //  1. AI GENERATION & LOGIC
// // ==========================================

// // Standard Mock Interview Questions
// // FIXED: Now accepts a single 'config' object to match your previous Setup.jsx
// export const generateQuestions = (config) => {
//     return axios.post(`${PYTHON_API}/generate`, config);
// };
// // Resume Analysis Questions
// export const generateResumeQuestions = (resumeText, domain, yoe, count) => {
//     return axios.post(`${PYTHON_API}/generate_resume_questions`, {
//         resume_text: resumeText,
//         domain: domain,
//         yoe: parseInt(yoe),
//         count: parseInt(count)
//     });
// };

// // Chat Coach (Assistant)
// export const chatWithCoach = (message, context) => {
//     return axios.post(`${PYTHON_API}/chat`, {
//         message,
//         context
//     });
// };

// // ==========================================
// //  2. EVALUATION ENDPOINTS
// // ==========================================

// export const evaluateSession = (transcript) => {
//     return axios.post(`${PYTHON_API}/evaluate_session`, { transcript });
// };

// export const evaluateResumeSession = (transcript, domain, experienceLevel) => {
//     return axios.post(`${PYTHON_API}/evaluate_resume_session`, {
//         transcript,
//         domain,
//         experience_level: experienceLevel
//     });
// };

// // ==========================================
// //  3. DATA STORAGE (Python db.json)
// // ==========================================

// export const saveInterview = (data) => {
//     return axios.post(`${PYTHON_API}/interviews`, data);
// };

// export const getInterviews = () => {
//     return axios.get(`${PYTHON_API}/interviews`);
// };

// export const deleteSession = (id) => {
//     return axios.delete(`${PYTHON_API}/interviews/${id}`);
// };
// export const clearAllSessions = () => {
//     return axios.delete(`${PYTHON_API}/api/sessions/clear`);
// };
// // ==========================================
// //  4. AUTH (Node.js - Optional)
// // ==========================================
// export const loginUser = (data) => axios.post(`${NODE_API}/auth/login`, data);
// export const registerUser = (data) => axios.post(`${NODE_API}/auth/register`, data);

// // ==========================================
// //  5. ADMIN TELEMETRY / LOGGING
// // ==========================================
// export const logUserAction = async (data) => {
//     // For now, this safely logs to the console so your app doesn't crash.
//     // If you add a dedicated Python logging route later, you can swap this to an axios.post
//     console.log("🛡️ [ADMIN TELEMETRY]:", data);
//     return Promise.resolve({ success: true });
// };
// // ==========================================
// //  FEEDBACK / CONTACT API
// // ==========================================
// export const submitFeedback = async (feedbackData) => {
//     try {
//         // FIXED: Now using the dynamic Vercel/Render URL
//         const response = await axios.post(`${PYTHON_API}/feedback`, feedbackData);
//         console.log("✅ [API] Feedback submitted successfully");
//         return response.data;
//     } catch (error) {
//         console.error("❌ [API] Error submitting feedback:", error);
//         throw error;
//     }
// };
//-----------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
import axios from 'axios';

// --- CONFIGURATION ---
// Automatically switches between your Render URLs (Production) and localhost (Testing)
const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const NODE_API_BASE = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';

// Clean trailing slashes to prevent "double-slash" errors in the URL
const PYTHON_API = PYTHON_API_BASE.replace(/\/+$/, '');
const NODE_API = NODE_API_BASE.replace(/\/+$/, '');

// ==========================================
//  1. AI GENERATION & LOGIC (Python Engine)
// ==========================================

// ✅ Fixes the "generateQuestions" import in Setup.jsx
export const generateQuestions = (config) => 
    axios.post(`${PYTHON_API}/generate`, config);

// ✅ Fixes the "generateResumeQuestions" Build Error in Setup.jsx
export const generateResumeQuestions = (resumeText, domain, yoe, count) => 
    axios.post(`${PYTHON_API}/generate_resume_questions`, { 
        resume_text: resumeText, 
        domain: domain, 
        yoe: parseInt(yoe), 
        count: parseInt(count) 
    });

export const chatWithCoach = (message, context) => 
    axios.post(`${PYTHON_API}/chat`, { message, context });

// ==========================================
//  2. EVALUATION ENDPOINTS (Python Engine)
// ==========================================

export const evaluateSession = (transcript) => 
    axios.post(`${PYTHON_API}/evaluate_session`, { transcript });

export const evaluateResumeSession = (transcript, domain, experienceLevel) => 
    axios.post(`${PYTHON_API}/evaluate_resume_session`, { 
        transcript, 
        domain, 
        experience_level: experienceLevel 
    });

// ==========================================
//  3. DATA STORAGE (Node.js + Neon PostgreSQL)
// ==========================================

// 🔥 CRITICAL: Returns the FULL response so Dashboard.jsx (res.data) works perfectly
export const getInterviews = async (config = {}) => {
    try {
        return await axios.get(`${NODE_API}/interview`, config);
    } catch (error) {
        console.error("❌ API FETCH ERROR:", error);
        throw error;
    }
};

export const saveInterview = async (data) => {
    try {
        return await axios.post(`${NODE_API}/interview`, data);
    } catch (error) {
        console.error("❌ API SAVE ERROR:", error);
        throw error;
    }
};

export const deleteSession = (id) => 
    axios.delete(`${NODE_API}/interview/${id}`);

export const clearAllSessions = () => 
    axios.delete(`${NODE_API}/interview/clear`);

// ==========================================
//  4. FEEDBACK & TELEMETRY
// ==========================================

export const submitFeedback = async (feedbackData) => {
    const response = await axios.post(`${PYTHON_API}/feedback`, feedbackData);
    return response.data;
};

export const logUserAction = async (data) => {
    console.log("🛡️ [ADMIN TELEMETRY]:", data);
    return Promise.resolve({ success: true });
};