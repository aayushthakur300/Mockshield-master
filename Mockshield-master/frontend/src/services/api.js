
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
import axios from 'axios';

// --- CONFIGURATION & MANUAL FORCE LOGIC ---
const rawPythonUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const rawNodeUrl = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';

// 1. Strip any accidental trailing slashes from the Vercel variables
const cleanPythonUrl = rawPythonUrl.replace(/\/+$/, '');
let cleanNodeUrl = rawNodeUrl.replace(/\/+$/, '');

// 2. 🔥 MANUALLY FORCE '/api': If Vercel URL doesn't have it, inject it here 🔥
if (!cleanNodeUrl.endsWith('/api')) {
    cleanNodeUrl += '/api';
}

const PYTHON_API = cleanPythonUrl;
const NODE_API = cleanNodeUrl;

// --- SECURITY PROTOCOL (PREFLIGHT TRIGGER) ---
// Helper function to securely get the user token from localStorage.
// Adding this custom header automatically triggers the required OPTIONS preflight check in the browser.
const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
        headers: { 'x-auth-token': token }
    };
};

// ==========================================
//  1. AI GENERATION & LOGIC
// ==========================================

// Standard Mock Interview Questions
export const generateQuestions = (config) => {
    return axios.post(`${PYTHON_API}/generate`, config);
};

// Resume Analysis Questions
export const generateResumeQuestions = (resumeText, domain, yoe, count) => {
    return axios.post(`${PYTHON_API}/generate_resume_questions`, {
        resume_text: resumeText,
        domain: domain,
        yoe: parseInt(yoe),
        count: parseInt(count)
    });
};

// Chat Coach (Assistant)
export const chatWithCoach = (message, context) => {
    return axios.post(`${PYTHON_API}/chat`, {
        message,
        context
    });
};

// ==========================================
//  2. EVALUATION ENDPOINTS
// ==========================================

export const evaluateSession = (transcript) => {
    return axios.post(`${PYTHON_API}/evaluate_session`, { transcript });
};

export const evaluateResumeSession = (transcript, domain, experienceLevel) => {
    return axios.post(`${PYTHON_API}/evaluate_resume_session`, {
        transcript,
        domain,
        experience_level: experienceLevel
    });
};

// ==========================================
//  3. DATA STORAGE (Node.js + Neon PostgreSQL)
// ==========================================

export const saveInterview = (data) => {
    // ✅ Routed to NODE_API with Auth Headers to save permanently in Neon DB
    return axios.post(`${NODE_API}/interview`, data, getAuthHeaders());
};

export const getInterviews = () => {
    // ✅ Routed to NODE_API with Auth Headers to fetch permanently from Neon DB
    return axios.get(`${NODE_API}/interview`, getAuthHeaders());
};

export const deleteSession = (id) => {
    // ✅ Routed to NODE_API to delete from Neon DB
    return axios.delete(`${NODE_API}/interview/${id}`, getAuthHeaders());
};

export const clearAllSessions = () => {
    // ✅ Routed to NODE_API to wipe user history from Neon DB
    return axios.delete(`${NODE_API}/interview/clear`, getAuthHeaders());
};

// ==========================================
//  4. AUTH (Node.js - Optional)
// ==========================================
export const loginUser = (data) => axios.post(`${NODE_API}/auth/login`, data);
export const registerUser = (data) => axios.post(`${NODE_API}/auth/register`, data);

// ==========================================
//  5. ADMIN TELEMETRY / LOGGING
// ==========================================
export const logUserAction = async (data) => {
    // For now, this safely logs to the console so your app doesn't crash.
    // If you add a dedicated Python logging route later, you can swap this to an axios.post
    console.log("🛡️ [ADMIN TELEMETRY]:", data);
    return Promise.resolve({ success: true });
};

// ==========================================
//  FEEDBACK / CONTACT API
// ==========================================
export const submitFeedback = async (feedbackData) => {
    try {
        const response = await axios.post(`${PYTHON_API}/feedback`, feedbackData);
        console.log("✅ [API] Feedback submitted successfully");
        return response.data;
    } catch (error) {
        console.error("❌ [API] Error submitting feedback:", error);
        throw error;
    }
};