// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// // Import Pages
// import Dashboard from './pages/Dashboard'; // 1. Landing
// import Setup from './pages/Setup';         // 2. Configuration
// import Interview from './pages/Interview'; // 3. The Interview
// import ResumeInterview from './pages/ResumeInterview'; // <--- NEW IMPORT
// import Report from './pages/Report';       // 4. Result PDF
// import ResumeReport from './pages/ResumeReport';       // <--- ADD THIS IMPORT
// // Global Components
// import ChatAssistant from './components/ChatAssistant'; 
// function App() {
//   return (
//     <Router>
//       <div className="antialiased text-slate-900 relative">
        
//         {/* Chat Assistant (Always active) */}
//         <ChatAssistant />
        
//         <Routes>
//           {/* FLOW: Dashboard -> Setup -> Interview -> Report */}
//           <Route path="/" element={<Dashboard />} />
//           <Route path="/setup" element={<Setup />} />
//           <Route path="/interview" element={<Interview />} />
//           <Route path="/resume-interview" element={<ResumeInterview />} /> {/* <--- NEW ROUTE */}
//           <Route path="/report" element={<Report />} />
//           <Route path="/resume-report" element={<ResumeReport />} />
//           {/* Catch-all redirect to Dashboard */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>

//       </div>
//     </Router>
//   );
// }

// export default App;
//-------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import Landing from './pages/Landing';         // 1. Entry Point (New)
import Dashboard from './pages/Dashboard';     // 2. Hub (Moved to /dashboard)
import Setup from './pages/Setup';             // 3. Configuration
import Interview from './pages/Interview';     // 4. Standard Mock Interview
import ResumeInterview from './pages/ResumeInterview'; // 5. Resume Audit Interview
import ResumeReport from './pages/ResumeReport';       // 6. Unified Analysis Report

// Global Components
import ChatAssistant from './components/ChatAssistant'; 

function App() {
  return (
    <Router>
      <div className="antialiased text-slate-900 relative">
        
        {/* Chat Assistant (Global Overlay) */}
        <ChatAssistant />
        
        <Routes>
          {/* --- 1. ENTRY POINT --- */}
          <Route path="/" element={<Landing />} />

          {/* --- 2. MAIN HUB --- */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* --- 3. CONFIGURATION --- */}
          <Route path="/setup" element={<Setup />} />

          {/* --- 4. EXECUTION MODES --- */}
          <Route path="/interview" element={<Interview />} />
          <Route path="/resume-interview" element={<ResumeInterview />} />

          {/* --- 5. RESULTS --- */}
          {/* Note: We use ResumeReport for /report to ensure Dashboard links work with the new UI */}
          <Route path="/report" element={<ResumeReport />} />
          <Route path="/resume-report" element={<ResumeReport />} />

          {/* Catch-all redirect to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;