//
// ----------------------------> refresh one 
// // import React, { useEffect, useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { getInterviews, deleteSession, clearAllSessions } from '../services/api';

// const Dashboard = () => {
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isClearing, setIsClearing] = useState(false);
//   const navigate = useNavigate();

//   // --- DATA FETCHING ---
//   const fetchHistory = async () => {
//       try {
//           // Pass a timestamp to force Axios to bypass any browser cache
//           const res = await getInterviews({ params: { t: new Date().getTime() } });
          
//           const data = res.data ? (Array.isArray(res.data) ? res.data : []) : [];
//           const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
//           setHistory(sortedData);
//       } catch (err) {
//           console.error("Failed to load history", err);
//       }
//       setLoading(false);
//   };

//   useEffect(() => {
//     // ==================================================================
//     // 🔥 SAFE ONE-TIME HARD REFRESH LOGIC 🔥
//     // This will ONLY trigger if the user just finished an interview.
//     // ==================================================================
//     const justFinished = sessionStorage.getItem('just_finished_interview');
    
//     if (justFinished === 'true') {
//         // 1. DELETE THE FLAG IMMEDIATELY to prevent infinite loops
//         sessionStorage.removeItem('just_finished_interview');
        
//         // 2. Execute the hard reload (Ctrl+F5 equivalent)
//         window.location.reload(true); 
//     } else {
//         // 3. Normal load, fetch data
//         fetchHistory();
//     }
//   }, []);

//   // --- DELETE SINGLE RECORD HANDLER ---
//   const handleDelete = async (e, id) => {
//     e.stopPropagation(); 
//     if(!window.confirm("CONFIRM DELETION: This record will be permanently erased.")) return;

//     try {
//         setHistory(prev => prev.filter(item => item.id !== id));
//         await deleteSession(id);
//     } catch (err) {
//         alert("Deletion Failed. Check console/network.");
//         console.error(err);
//         fetchHistory(); 
//     }
//   };

//   // --- CLEAR ALL HISTORY HANDLER ---
//   const handleClearAll = async () => {
//     if (history.length === 0) return;
//     if (!window.confirm("⚠️ CRITICAL WARNING: This will permanently erase ALL interview history. This action cannot be undone. Are you absolutely sure?")) return;

//     setIsClearing(true);
//     try {
//         await clearAllSessions();
//         setHistory([]); 
//     } catch (err) {
//         alert("Failed to completely clear history. Check console.");
//         console.error(err);
//         fetchHistory(); 
//     } finally {
//         setIsClearing(false);
//     }
//   };

//   // --- SILENT KILLER DETECTOR: Score Extraction Logic ---
//   const extractSafeScore = (item) => {
//       const deepScore = item.full_data?.totalScore;
//       const topScore = item.total_score;

//       if (deepScore !== undefined && topScore !== undefined && Number(deepScore) !== Number(topScore)) {
//           console.warn(`[SILENT KILLER DETECTED] ID: ${item.id} | Deep Score: ${deepScore} vs Dashboard Score: ${topScore}. Using Deep score.`);
//       }

//       if (deepScore !== undefined && deepScore !== null) return Number(deepScore);
//       if (topScore !== undefined && topScore !== null) return Number(topScore);
      
//       return 0;
//   };

//   // --- REPORT VIEWER HANDLER ---
//   const handleViewReport = (item) => {
//     const rawData = item.full_data || item;
    
//     const feedbackData = {
//         score: extractSafeScore(item), 
//         summary: rawData.overallFeedback || item.summary || "No summary available.",
//         roadmap: rawData.roadmap || "No roadmap data found.",
//         silent_killers: rawData.silent_killers || [],
//         question_reviews: rawData.question_reviews || [],
//         questions: rawData.questions || [],
//         topic: item.topic,
//         type: determineSessionType(item)
//     };
    
//     const sessionType = determineSessionType(item);
//     if (sessionType === "Resume Assessment") {
//          navigate('/resume-report', { state: { feedback: feedbackData, answers: rawData.questions, topic: item.topic } });
//     } else {
//          navigate('/report', { state: { feedback: feedbackData, answers: rawData.questions } });
//     }
//   };

//   // --- HELPER: Detect Disqualification ---
//   const isSessionDisqualified = (item) => {
//       const summary = (item.summary || item.overallFeedback || "").toUpperCase();
//       const topic = (item.topic || "").toUpperCase();
//       return summary.includes("DISQUALIFIED") || 
//              topic.includes("TERMINATED") || 
//              summary.includes("CHEATING DETECTED");
//   };

//   // --- HELPER: Determine Component Type ---
//   const determineSessionType = (item) => {
//       const topic = (item.topic || "").toLowerCase();
//       if (topic.includes("resume") || topic.includes("cv") || item.type === "Resume") {
//           return "Resume Assessment";
//       }
//       return "Mock Interview";
//   };

//   // --- HELPER: Get Precise Formatted Score ---
//   const getScoreColor = (score, disqualified) => {
//       if (disqualified) return 'border-red-500 text-red-600 bg-red-50';
//       if (score >= 80) return 'border-green-500 text-green-600 bg-green-50';
//       if (score >= 50) return 'border-yellow-500 text-yellow-600 bg-yellow-50';
//       return 'border-gray-300 text-gray-500 bg-gray-50';
//   };

//   // --- HELPER: Get Formatted Topic Name ---
//   const getTopicDisplay = (item) => {
//       const topic = item.topic;
//       const deepTopic = item.full_data?.topic;

//       if (topic && topic.trim() !== "" && topic !== "Unknown") return topic;
//       if (deepTopic && deepTopic.trim() !== "") return deepTopic;
//       return "General Interview"; 
//   };

//   return (
//     <div className="min-h-screen p-4 md:p-8 bg-slate-50 relative overflow-hidden">
      
//       {/* ========================================================= */}
//       {/* BACKGROUND WATERMARK (Z-0, pointer-events-none ensures no overlap blocking) */}
//       {/* ========================================================= */}
//       <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
//           <h1 className="text-[12vw] font-black text-slate-900 opacity-[0.03] transform -rotate-12 whitespace-nowrap">
//               MOCKSHIELD
//           </h1>
//       </div>

//       {/* Main Content Wrapper - relative z-10 keeps it above the watermark */}
//       <div className="max-w-6xl mx-auto relative z-10">
        
//         {/* ========================================================= */}
//         {/* FORMAL STABILITY DISCLAIMER */}
//         {/* ========================================================= */}
        

//         {/* Header */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
//           <div>
//             <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 mb-1">
//               Candidate <span className="text-red-600">Dashboard</span>
//             </h1>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-4 items-center">
//              {history.length > 0 && (
//                  <button 
//                      onClick={handleClearAll}
//                      disabled={isClearing}
//                      className="bg-white text-red-600 border border-red-200 px-6 py-4 rounded-xl font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                  >
//                      {isClearing ? (
//                          <><i className="fa-solid fa-spinner fa-spin"></i> Clearing...</>
//                      ) : (
//                          <><i className="fa-solid fa-trash-can"></i> Clear History</>
//                      )}
//                  </button>
//              )}
//              <Link to="/setup" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2">
//                 <i className="fa-solid fa-play"></i> Initiate New Session
//              </Link>
//           </div>
//         </div>
//              <div className="bg-white border-l-4 border-blue-500 p-4 mb-6 shadow-sm rounded-r-lg flex items-center gap-3">
//     <i className="fa-solid fa-circle-info text-blue-500"></i>
//     <p className="text-sm text-slate-700 font-medium">
//         <span className="font-bold text-slate-900">Note:</span> Refresh this page to ensure your latest interview data is fully synchronized.
//     </p>
// </div>
//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
//                 <span className="font-mono text-xs font-bold text-gray-400 uppercase mb-2">Total Sessions</span>
//                 <p className="text-5xl font-black text-slate-800">{history.length}</p>
//             </div>
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
//                 <span className="font-mono text-xs font-bold text-gray-400 uppercase mb-2">Avg Performance</span>
//                 <p className="text-5xl font-black text-slate-800">
//                     {history.length > 0 
//                         ? (history.reduce((acc, curr) => acc + extractSafeScore(curr), 0) / history.length).toFixed(0) 
//                         : "0"}
//                 </p>
//             </div>
//         </div>

//         {/* Logs List Header */}
//         <div className="flex justify-between items-end mb-4 ml-2">
//             <h3 className="font-mono text-sm font-bold text-gray-500 uppercase">Recent Activity Logs</h3>
//         </div>
        
//         {/* Logs List Body */}
//         {loading ? (
//             <div className="text-center py-20 font-mono text-gray-400 animate-pulse">
//                 [LOADING DATA STREAMS...]
//             </div>
//         ) : (
//             <div className="space-y-4">
//                 {history.length === 0 ? (
//                     <div className="bg-white p-16 text-center border-dashed border-2 border-gray-300 rounded-xl">
//                         <div className="text-gray-300 text-6xl mb-4"><i className="fa-solid fa-folder-open"></i></div>
//                         <h3 className="text-xl font-bold text-slate-800 mb-2">Database Empty</h3>
//                         <p className="text-gray-500 mb-6 max-w-md mx-auto">
//                             No interview records found. Initiate your first technical assessment to generate data points.
//                         </p>
//                     </div>
//                 ) : (
//                     history.map((item) => {
//                       const disqualified = isSessionDisqualified(item);
//                       const sessionType = determineSessionType(item); 
//                       const score = extractSafeScore(item);

//                       return (
//                         <div 
//                           key={item.id} 
//                           onClick={() => handleViewReport(item)} 
//                           className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
//                               disqualified ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'
//                           }`}
//                         >
                          
//                           {/* 1. Session Metadata */}
//                           <div className="md:w-1/4 z-10">
//                               <span className="font-mono text-xs text-gray-400 block mb-1">
//                                   {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                               </span>
                              
//                               <h4 className="font-black text-lg leading-tight text-slate-800 group-hover:text-blue-600 transition-colors uppercase break-words">
//                                   {getTopicDisplay(item)}
//                               </h4>
                              
//                               <span className={`text-xs font-bold px-2 py-1 rounded mt-2 inline-flex items-center gap-1 border ${
//                                   sessionType === "Resume Assessment" 
//                                   ? "bg-purple-50 text-purple-700 border-purple-100" 
//                                   : "bg-blue-50 text-blue-700 border-blue-100"
//                               }`}>
//                                   {sessionType === "Resume Assessment" ? (
//                                       <><i className="fa-solid fa-file-arrow-up"></i> Resume Audit</>
//                                   ) : (
//                                       <><i className="fa-solid fa-microphone-lines"></i> Mock Interview</>
//                                   )}
//                               </span>
//                           </div>
                          
//                           {/* 2. Summary */}
//                           <div className="md:w-2/4 z-10">
//                                <div className={`p-3 rounded border transition-colors ${
//                                    disqualified ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100 group-hover:bg-blue-50/50"
//                                }`}>
//                                   {disqualified ? (
//                                       <div className="flex flex-col gap-1">
//                                           <div className="text-red-600 font-bold flex items-center gap-2">
//                                               <i className="fa-solid fa-triangle-exclamation"></i>
//                                               SESSION TERMINATED
//                                           </div>
//                                           <p className="text-xs text-red-800 font-mono">
//                                               Reason: {item.summary || item.overallFeedback || "Policy Violation"}
//                                           </p>
//                                           <p className="text-xs text-gray-400 font-mono mt-1 border-t border-red-200 pt-1">
//                                               SID: {item.id}
//                                           </p>
//                                       </div>
//                                   ) : (
//                                       <p className="text-xs text-gray-600 font-mono line-clamp-2">
//                                           "{item.summary || item.overallFeedback || "Processing feedback..."}"
//                                       </p>
//                                   )}
//                                </div>
//                           </div>

//                           {/* 3. Score & Actions */}
//                           <div className="md:w-1/4 flex items-center justify-end gap-4 z-10">
//                               <div className={`px-4 py-2 font-black text-xl border-2 rounded ${getScoreColor(score, disqualified)}`}>
//                                   {score.toFixed(0)}
//                               </div>

//                               <button 
//                                   onClick={(e) => handleDelete(e, item.id)}
//                                   className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
//                                   title="Delete Record"
//                               >
//                                   <i className="fa-solid fa-trash"></i>
//                               </button>
//                           </div>
//                         </div>
//                       );
//                     })
//                 )}
//             </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
//-----------------------------------------------------------------------------------------------------
// ---------------------> watermark and refresh disclaimer 
// import React, { useEffect, useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { getInterviews, deleteSession, clearAllSessions } from '../services/api';

// const Dashboard = () => {
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isClearing, setIsClearing] = useState(false);
//   const navigate = useNavigate();

//   // --- DATA FETCHING ---
//   const fetchHistory = async () => {
//       try {
//           // Pass a timestamp to force Axios to bypass any browser cache
//           const res = await getInterviews({ params: { t: new Date().getTime() } });
          
//           const data = res.data ? (Array.isArray(res.data) ? res.data : []) : [];
//           const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
//           setHistory(sortedData);
//       } catch (err) {
//           console.error("Failed to load history", err);
//       }
//       setLoading(false);
//   };

//   useEffect(() => {
//     // ==================================================================
//     // 🔥 SAFE ONE-TIME HARD REFRESH LOGIC 🔥
//     // ==================================================================
//     const justFinished = sessionStorage.getItem('just_finished_interview');
    
//     if (justFinished === 'true') {
//         sessionStorage.removeItem('just_finished_interview');
//         window.location.reload(true); 
//     } else {
//         fetchHistory();
//     }
//   }, []);

//   // --- DELETE SINGLE RECORD HANDLER ---
//   const handleDelete = async (e, id) => {
//     e.stopPropagation(); 
//     if(!window.confirm("CONFIRM DELETION: This record will be permanently erased.")) return;

//     try {
//         setHistory(prev => prev.filter(item => item.id !== id));
//         await deleteSession(id);
//     } catch (err) {
//         alert("Deletion Failed. Check console/network.");
//         console.error(err);
//         fetchHistory(); 
//     }
//   };

//   // --- CLEAR ALL HISTORY HANDLER ---
//   const handleClearAll = async () => {
//     if (history.length === 0) return;
//     if (!window.confirm("⚠️ CRITICAL WARNING: This will permanently erase ALL interview history. This action cannot be undone. Are you absolutely sure?")) return;

//     setIsClearing(true);
//     try {
//         await clearAllSessions();
//         setHistory([]); 
//     } catch (err) {
//         alert("Failed to completely clear history. Check console.");
//         console.error(err);
//         fetchHistory(); 
//     } finally {
//         setIsClearing(false);
//     }
//   };

//   // --- SILENT KILLER DETECTOR: Score Extraction Logic ---
//   const extractSafeScore = (item) => {
//       const deepScore = item.full_data?.totalScore;
//       const topScore = item.total_score;

//       if (deepScore !== undefined && topScore !== undefined && Number(deepScore) !== Number(topScore)) {
//           console.warn(`[SILENT KILLER DETECTED] ID: ${item.id} | Deep Score: ${deepScore} vs Dashboard Score: ${topScore}. Using Deep score.`);
//       }

//       if (deepScore !== undefined && deepScore !== null) return Number(deepScore);
//       if (topScore !== undefined && topScore !== null) return Number(topScore);
      
//       return 0;
//   };

//   // --- REPORT VIEWER HANDLER ---
//   const handleViewReport = (item) => {
//     const rawData = item.full_data || item;
    
//     // 🔥 THE ABSOLUTE BIND: We force the historic flags and time into the payload 🔥
//     const feedbackData = {
//         score: extractSafeScore(item), 
//         summary: rawData.overallFeedback || item.summary || "No summary available.",
//         roadmap: rawData.roadmap || "No roadmap data found.",
//         silent_killers: rawData.silent_killers || [],
//         question_reviews: rawData.question_reviews || [],
//         questions: rawData.questions || [],
//         topic: item.topic,
//         type: determineSessionType(item),
//         integrity: rawData.integrity || rawData.feedback?.integrity || { score: 100, count: 0 },
//         timeTaken: rawData.timeTaken || rawData.feedback?.timeTaken || "N/A"
//     };
    
//     const sessionType = determineSessionType(item);
//     if (sessionType === "Resume Assessment") {
//          navigate('/resume-report', { state: { feedback: feedbackData, answers: rawData.questions, topic: item.topic } });
//     } else {
//          navigate('/report', { state: { feedback: feedbackData, answers: rawData.questions } });
//     }
//   };

//   // --- HELPER: Detect Disqualification ---
//   const isSessionDisqualified = (item) => {
//       const summary = (item.summary || item.overallFeedback || "").toUpperCase();
//       const topic = (item.topic || "").toUpperCase();
//       return summary.includes("DISQUALIFIED") || 
//              topic.includes("TERMINATED") || 
//              summary.includes("CHEATING DETECTED");
//   };

//   // --- HELPER: Determine Component Type ---
//   const determineSessionType = (item) => {
//       const topic = (item.topic || "").toLowerCase();
//       if (topic.includes("resume") || topic.includes("cv") || item.type === "Resume") {
//           return "Resume Assessment";
//       }
//       return "Mock Interview";
//   };

//   // --- HELPER: Get Precise Formatted Score ---
//   const getScoreColor = (score, disqualified) => {
//       if (disqualified) return 'border-red-500 text-red-600 bg-red-50';
//       if (score >= 80) return 'border-green-500 text-green-600 bg-green-50';
//       if (score >= 50) return 'border-yellow-500 text-yellow-600 bg-yellow-50';
//       return 'border-gray-300 text-gray-500 bg-gray-50';
//   };

//   // --- HELPER: Get Formatted Topic Name ---
//   const getTopicDisplay = (item) => {
//       const topic = item.topic;
//       const deepTopic = item.full_data?.topic;

//       if (topic && topic.trim() !== "" && topic !== "Unknown") return topic;
//       if (deepTopic && deepTopic.trim() !== "") return deepTopic;
//       return "General Interview"; 
//   };

//   return (
//     <div className="min-h-screen p-4 md:p-8 bg-slate-50 relative overflow-hidden">
      
//       {/* BACKGROUND WATERMARK */}
//       <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
//           <h1 className="text-[12vw] font-black text-slate-900 opacity-[0.03] transform -rotate-12 whitespace-nowrap">
//               MOCKSHIELD
//           </h1>
//       </div>

//       {/* Main Content Wrapper */}
//       <div className="max-w-6xl mx-auto relative z-10">
        
//         {/* FORMAL STABILITY DISCLAIMER */}
//         <div className="bg-white border-l-4 border-blue-500 p-4 mb-6 shadow-sm rounded-r-lg flex items-center gap-3">
//             <i className="fa-solid fa-circle-info text-blue-500"></i>
//             <p className="text-sm text-slate-700 font-medium">
//                 <span className="font-bold text-slate-900">Note:</span> Refresh this page to ensure your latest interview data is fully synchronized.
//             </p>
//         </div>

//         {/* Header */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
//           <div>
//             <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 mb-1">
//               Candidate <span className="text-red-600">Dashboard</span>
//             </h1>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-4 items-center">
//              {history.length > 0 && (
//                  <button 
//                      onClick={handleClearAll}
//                      disabled={isClearing}
//                      className="bg-white text-red-600 border border-red-200 px-6 py-4 rounded-xl font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                  >
//                      {isClearing ? (
//                          <><i className="fa-solid fa-spinner fa-spin"></i> Clearing...</>
//                      ) : (
//                          <><i className="fa-solid fa-trash-can"></i> Clear History</>
//                      )}
//                  </button>
//              )}
//              <Link to="/setup" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2">
//                 <i className="fa-solid fa-play"></i> Initiate New Session
//              </Link>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
//                 <span className="font-mono text-xs font-bold text-gray-400 uppercase mb-2">Total Sessions</span>
//                 <p className="text-5xl font-black text-slate-800">{history.length}</p>
//             </div>
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
//                 <span className="font-mono text-xs font-bold text-gray-400 uppercase mb-2">Avg Performance</span>
//                 <p className="text-5xl font-black text-slate-800">
//                     {history.length > 0 
//                         ? (history.reduce((acc, curr) => acc + extractSafeScore(curr), 0) / history.length).toFixed(0) 
//                         : "0"}
//                 </p>
//             </div>
//         </div>

//         {/* Logs List Header */}
//         <div className="flex justify-between items-end mb-4 ml-2">
//             <h3 className="font-mono text-sm font-bold text-gray-500 uppercase">Recent Activity Logs</h3>
//         </div>
        
//         {/* Logs List Body */}
//         {loading ? (
//             <div className="text-center py-20 font-mono text-gray-400 animate-pulse">
//                 [LOADING DATA STREAMS...]
//             </div>
//         ) : (
//             <div className="space-y-4">
//                 {history.length === 0 ? (
//                     <div className="bg-white p-16 text-center border-dashed border-2 border-gray-300 rounded-xl">
//                         <div className="text-gray-300 text-6xl mb-4"><i className="fa-solid fa-folder-open"></i></div>
//                         <h3 className="text-xl font-bold text-slate-800 mb-2">Database Empty</h3>
//                         <p className="text-gray-500 mb-6 max-w-md mx-auto">
//                             No interview records found. Initiate your first technical assessment to generate data points.
//                         </p>
//                     </div>
//                 ) : (
//                     history.map((item) => {
//                       const disqualified = isSessionDisqualified(item);
//                       const sessionType = determineSessionType(item); 
//                       const score = extractSafeScore(item);
                      
//                       // 🔥 EXTRACTING FLAG COUNT DIRECTLY FOR THE UI DASHBOARD CARD 🔥
//                       const rawData = item.full_data || {};
//                       const flagCount = rawData.integrity?.count || rawData.feedback?.integrity?.count || 0;

//                       return (
//                         <div 
//                           key={item.id} 
//                           onClick={() => handleViewReport(item)} 
//                           className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
//                               disqualified ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'
//                           }`}
//                         >
                          
//                           {/* 1. Session Metadata */}
//                           <div className="md:w-1/4 z-10 flex flex-col items-start">
//                               <span className="font-mono text-xs text-gray-400 block mb-1">
//                                   {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                               </span>
                              
//                               <h4 className="font-black text-lg leading-tight text-slate-800 group-hover:text-blue-600 transition-colors uppercase break-words">
//                                   {getTopicDisplay(item)}
//                               </h4>
                              
//                               <div className="flex flex-wrap gap-2 mt-2">
//                                   <span className={`text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 border ${
//                                       sessionType === "Resume Assessment" 
//                                       ? "bg-purple-50 text-purple-700 border-purple-100" 
//                                       : "bg-blue-50 text-blue-700 border-blue-100"
//                                   }`}>
//                                       {sessionType === "Resume Assessment" ? (
//                                           <><i className="fa-solid fa-file-arrow-up"></i> Resume Audit</>
//                                       ) : (
//                                           <><i className="fa-solid fa-microphone-lines"></i> Mock Interview</>
//                                       )}
//                                   </span>

//                                   {/* 🔥 NEW UI ELEMENT: PERMANENT FLAG BADGE 🔥 */}
//                                   {flagCount > 0 ? (
//                                       <span className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 border bg-red-50 text-red-700 border-red-200">
//                                           <i className="fa-solid fa-flag"></i> {flagCount} Flags
//                                       </span>
//                                   ) : (
//                                       <span className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 border bg-green-50 text-green-700 border-green-200">
//                                           <i className="fa-solid fa-shield-check"></i> Clean
//                                       </span>
//                                   )}
//                               </div>
//                           </div>
                          
//                           {/* 2. Summary */}
//                           <div className="md:w-2/4 z-10">
//                                <div className={`p-3 rounded border transition-colors ${
//                                    disqualified ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100 group-hover:bg-blue-50/50"
//                                }`}>
//                                   {disqualified ? (
//                                       <div className="flex flex-col gap-1">
//                                           <div className="text-red-600 font-bold flex items-center gap-2">
//                                               <i className="fa-solid fa-triangle-exclamation"></i>
//                                               SESSION TERMINATED
//                                           </div>
//                                           <p className="text-xs text-red-800 font-mono">
//                                               Reason: {item.summary || item.overallFeedback || "Policy Violation"}
//                                           </p>
//                                           <p className="text-xs text-gray-400 font-mono mt-1 border-t border-red-200 pt-1">
//                                               SID: {item.id}
//                                           </p>
//                                       </div>
//                                   ) : (
//                                       <p className="text-xs text-gray-600 font-mono line-clamp-2">
//                                           "{item.summary || item.overallFeedback || "Processing feedback..."}"
//                                       </p>
//                                   )}
//                                </div>
//                           </div>

//                           {/* 3. Score & Actions */}
//                           <div className="md:w-1/4 flex items-center justify-end gap-4 z-10">
//                               <div className={`px-4 py-2 font-black text-xl border-2 rounded ${getScoreColor(score, disqualified)}`}>
//                                   {score.toFixed(0)}
//                               </div>

//                               <button 
//                                   onClick={(e) => handleDelete(e, item.id)}
//                                   className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
//                                   title="Delete Record"
//                               >
//                                   <i className="fa-solid fa-trash"></i>
//                               </button>
//                           </div>
//                         </div>
//                       );
//                     })
//                 )}
//             </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
//------------------------------------------------------------------------------------------------------------------
// ---------------> Cold Start Retry Logic"
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInterviews, deleteSession, clearAllSessions } from '../services/api';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isServerAwake, setIsServerAwake] = useState(false); // New state to track connection
  const navigate = useNavigate();

  // --- DATA FETCHING (INFINITE LOOP LOGIC) ---
  const fetchHistory = async () => {
      try {
          // Pass a timestamp to force Axios to bypass any browser cache
          const res = await getInterviews({ params: { t: new Date().getTime() } });
          
          // If we reach this line, the server is AWAKE and responded
          const data = res.data ? (Array.isArray(res.data) ? res.data : []) : [];
          const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setHistory(sortedData);
          setIsServerAwake(true); // Mark server as ready
          setLoading(false);      // Stop the loading pulse
          console.log("✅ Data Stream Synchronized Successfully.");
      } catch (err) {
          console.warn("⏳ Render is sleeping or disconnected. Retrying in 5 seconds...");
          // INFINITE LOOP: If it fails, wait 5 seconds and call itself again
          setTimeout(fetchHistory, 5000);
      }
  };

  useEffect(() => {
    // ==================================================================
    // 🔥 SAFE ONE-TIME HARD REFRESH LOGIC 🔥
    // ==================================================================
    const justFinished = sessionStorage.getItem('just_finished_interview');
    
    if (justFinished === 'true') {
        sessionStorage.removeItem('just_finished_interview');
        window.location.reload(true); 
    } else {
        fetchHistory();
    }
  }, []);

  // --- DELETE SINGLE RECORD HANDLER ---
  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if(!window.confirm("CONFIRM DELETION: This record will be permanently erased.")) return;

    try {
        setHistory(prev => prev.filter(item => item.id !== id));
        await deleteSession(id);
    } catch (err) {
        alert("Deletion Failed. Check console/network.");
        console.error(err);
        fetchHistory(); 
    }
  };

  // --- CLEAR ALL HISTORY HANDLER ---
  const handleClearAll = async () => {
    if (history.length === 0) return;
    if (!window.confirm("⚠️ CRITICAL WARNING: This will permanently erase ALL interview history. This action cannot be undone. Are you absolutely sure?")) return;

    setIsClearing(true);
    try {
        await clearAllSessions();
        setHistory([]); 
    } catch (err) {
        alert("Failed to completely clear history. Check console.");
        console.error(err);
        fetchHistory(); 
    } finally {
        setIsClearing(false);
    }
  };

  // --- SILENT KILLER DETECTOR: Score Extraction Logic ---
  const extractSafeScore = (item) => {
      const deepScore = item.full_data?.totalScore;
      const topScore = item.total_score;

      if (deepScore !== undefined && topScore !== undefined && Number(deepScore) !== Number(topScore)) {
          console.warn(`[SILENT KILLER DETECTED] ID: ${item.id} | Deep Score: ${deepScore} vs Dashboard Score: ${topScore}. Using Deep score.`);
      }

      if (deepScore !== undefined && deepScore !== null) return Number(deepScore);
      if (topScore !== undefined && topScore !== null) return Number(topScore);
      
      return 0;
  };

  // --- REPORT VIEWER HANDLER ---
  const handleViewReport = (item) => {
    const rawData = item.full_data || item;
    
    // 🔥 THE ABSOLUTE BIND: We force the historic flags and time into the payload 🔥
    const feedbackData = {
        score: extractSafeScore(item), 
        summary: rawData.overallFeedback || item.summary || "No summary available.",
        roadmap: rawData.roadmap || "No roadmap data found.",
        silent_killers: rawData.silent_killers || [],
        question_reviews: rawData.question_reviews || [],
        questions: rawData.questions || [],
        topic: item.topic,
        type: determineSessionType(item),
        integrity: rawData.integrity || rawData.feedback?.integrity || { score: 100, count: 0 },
        timeTaken: rawData.timeTaken || rawData.feedback?.timeTaken || "N/A"
    };
    
    const sessionType = determineSessionType(item);
    if (sessionType === "Resume Assessment") {
          navigate('/resume-report', { state: { feedback: feedbackData, answers: rawData.questions, topic: item.topic } });
    } else {
          navigate('/report', { state: { feedback: feedbackData, answers: rawData.questions } });
    }
  };

  // --- HELPER: Detect Disqualification ---
  const isSessionDisqualified = (item) => {
      const summary = (item.summary || item.overallFeedback || "").toUpperCase();
      const topic = (item.topic || "").toUpperCase();
      return summary.includes("DISQUALIFIED") || 
             topic.includes("TERMINATED") || 
             summary.includes("CHEATING DETECTED");
  };

  // --- HELPER: Determine Component Type ---
  const determineSessionType = (item) => {
      const topic = (item.topic || "").toLowerCase();
      if (topic.includes("resume") || topic.includes("cv") || item.type === "Resume") {
          return "Resume Assessment";
      }
      return "Mock Interview";
  };

  // --- HELPER: Get Precise Formatted Score ---
  const getScoreColor = (score, disqualified) => {
      if (disqualified) return 'border-red-500 text-red-600 bg-red-50';
      if (score >= 80) return 'border-green-500 text-green-600 bg-green-50';
      if (score >= 50) return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      return 'border-gray-300 text-gray-500 bg-gray-50';
  };

  // --- HELPER: Get Formatted Topic Name ---
  const getTopicDisplay = (item) => {
      const topic = item.topic;
      const deepTopic = item.full_data?.topic;

      if (topic && topic.trim() !== "" && topic !== "Unknown") return topic;
      if (deepTopic && deepTopic.trim() !== "") return deepTopic;
      return "General Interview"; 
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 relative overflow-hidden">
      
      {/* BACKGROUND WATERMARK */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
          <h1 className="text-[12vw] font-black text-slate-900 opacity-[0.03] transform -rotate-12 whitespace-nowrap">
              MOCKSHIELD
          </h1>
      </div>

      {/* Main Content Wrapper */}
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* FORMAL STABILITY DISCLAIMER */}
        <div className="bg-white border-l-4 border-blue-500 p-4 mb-6 shadow-sm rounded-r-lg flex items-center gap-3">
            <i className="fa-solid fa-circle-info text-blue-500"></i>
            <p className="text-sm text-slate-700 font-medium">
                <span className="font-bold text-slate-900">System Status:</span> {isServerAwake ? "Connected to Cloud Database." : "Waiting for Cloud Database to wake up..."}
            </p>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 mb-1">
              Candidate <span className="text-red-600">Dashboard</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
              {history.length > 0 && (
                  <button 
                      onClick={handleClearAll}
                      disabled={isClearing}
                      className="bg-white text-red-600 border border-red-200 px-6 py-4 rounded-xl font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isClearing ? (
                          <><i className="fa-solid fa-spinner fa-spin"></i> Clearing...</>
                      ) : (
                          <><i className="fa-solid fa-trash-can"></i> Clear History</>
                      )}
                  </button>
              )}
              <Link to="/setup" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2">
                 <i className="fa-solid fa-play"></i> Initiate New Session
              </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-xs font-bold text-gray-400 uppercase mb-2">Total Sessions</span>
                <p className="text-5xl font-black text-slate-800">{isServerAwake ? history.length : "--"}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-xs font-bold text-gray-400 uppercase mb-2">Avg Performance</span>
                <p className="text-5xl font-black text-slate-800">
                    {!isServerAwake ? "--" : (history.length > 0 
                        ? (history.reduce((acc, curr) => acc + extractSafeScore(curr), 0) / history.length).toFixed(0) 
                        : "0")}
                </p>
            </div>
        </div>

        {/* Logs List Header */}
        <div className="flex justify-between items-end mb-4 ml-2">
            <h3 className="font-mono text-sm font-bold text-gray-500 uppercase">Recent Activity Logs</h3>
        </div>
        
        {/* Logs List Body */}
        {loading ? (
            <div className="text-center py-20 font-mono text-gray-400 animate-pulse">
                [WAITING FOR CLOUD DATA STREAMS...]
            </div>
        ) : (
            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="bg-white p-16 text-center border-dashed border-2 border-gray-300 rounded-xl">
                        <div className="text-gray-300 text-6xl mb-4"><i className="fa-solid fa-folder-open"></i></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Database Empty</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            No interview records found. Initiate your first technical assessment to generate data points.
                        </p>
                    </div>
                ) : (
                    history.map((item) => {
                      const disqualified = isSessionDisqualified(item);
                      const sessionType = determineSessionType(item); 
                      const score = extractSafeScore(item);
                      const rawData = item.full_data || {};
                      const flagCount = rawData.integrity?.count || rawData.feedback?.integrity?.count || 0;

                      return (
                        <div 
                          key={item.id} 
                          onClick={() => handleViewReport(item)} 
                          className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                              disqualified ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'
                          }`}
                        >
                          <div className="md:w-1/4 z-10 flex flex-col items-start">
                              <span className="font-mono text-xs text-gray-400 block mb-1">
                                  {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <h4 className="font-black text-lg leading-tight text-slate-800 group-hover:text-blue-600 transition-colors uppercase break-words">
                                  {getTopicDisplay(item)}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  <span className={`text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 border ${
                                      sessionType === "Resume Assessment" 
                                      ? "bg-purple-50 text-purple-700 border-purple-100" 
                                      : "bg-blue-50 text-blue-700 border-blue-100"
                                  }`}>
                                      {sessionType === "Resume Assessment" ? (
                                          <><i className="fa-solid fa-file-arrow-up"></i> Resume Audit</>
                                      ) : (
                                          <><i className="fa-solid fa-microphone-lines"></i> Mock Interview</>
                                      )}
                                  </span>
                                  {flagCount > 0 ? (
                                      <span className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 border bg-red-50 text-red-700 border-red-200">
                                          <i className="fa-solid fa-flag"></i> {flagCount} Flags
                                      </span>
                                  ) : (
                                      <span className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 border bg-green-50 text-green-700 border-green-200">
                                          <i className="fa-solid fa-shield-check"></i> Clean
                                      </span>
                                  )}
                              </div>
                          </div>
                          <div className="md:w-2/4 z-10">
                               <div className={`p-3 rounded border transition-colors ${
                                   disqualified ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100 group-hover:bg-blue-50/50"
                               }`}>
                                  {disqualified ? (
                                      <div className="flex flex-col gap-1">
                                          <div className="text-red-600 font-bold flex items-center gap-2">
                                              <i className="fa-solid fa-triangle-exclamation"></i> SESSION TERMINATED
                                          </div>
                                          <p className="text-xs text-red-800 font-mono">
                                              Reason: {item.summary || item.overallFeedback || "Policy Violation"}
                                          </p>
                                      </div>
                                  ) : (
                                      <p className="text-xs text-gray-600 font-mono line-clamp-2">
                                          "{item.summary || item.overallFeedback || "Processing feedback..."}"
                                      </p>
                                  )}
                               </div>
                          </div>
                          <div className="md:w-1/4 flex items-center justify-end gap-4 z-10">
                              <div className={`px-4 py-2 font-black text-xl border-2 rounded ${getScoreColor(score, disqualified)}`}>
                                  {score.toFixed(0)}
                              </div>
                              <button 
                                  onClick={(e) => handleDelete(e, item.id)}
                                  className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                                  title="Delete Record"
                              >
                                  <i className="fa-solid fa-trash"></i>
                              </button>
                          </div>
                        </div>
                      );
                    })
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;