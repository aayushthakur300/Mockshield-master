
// //-------------------------------------------------------------------------------------------------------------------
// //-------------------------------------------------------------------------------------------------------------------
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// // Import Pages
// import Landing from './pages/Landing';         // 1. Entry Point (New)
// import Dashboard from './pages/Dashboard';     // 2. Hub (Moved to /dashboard)
// import Setup from './pages/Setup';             // 3. Configuration
// import Interview from './pages/Interview';     // 4. Standard Mock Interview
// import ResumeInterview from './pages/ResumeInterview'; // 5. Resume Audit Interview
// import ResumeReport from './pages/ResumeReport';       // 6. Unified Analysis Report

// // Global Components
// import ChatAssistant from './components/ChatAssistant'; 

// function App() {
//   return (
//     <Router>
//       <div className="antialiased text-slate-900 relative">
        
//         {/* Chat Assistant (Global Overlay) */}
//         <ChatAssistant />
        
//         <Routes>
//           {/* --- 1. ENTRY POINT --- */}
//           <Route path="/" element={<Landing />} />

//           {/* --- 2. MAIN HUB --- */}
//           <Route path="/dashboard" element={<Dashboard />} />

//           {/* --- 3. CONFIGURATION --- */}
//           <Route path="/setup" element={<Setup />} />

//           {/* --- 4. EXECUTION MODES --- */}
//           <Route path="/interview" element={<Interview />} />
//           <Route path="/resume-interview" element={<ResumeInterview />} />

//           {/* --- 5. RESULTS --- */}
//           {/* Note: We use ResumeReport for /report to ensure Dashboard links work with the new UI */}
//           <Route path="/report" element={<ResumeReport />} />
//           <Route path="/resume-report" element={<ResumeReport />} />

//           {/* Catch-all redirect to Landing */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>

//       </div>
//     </Router>
//   );
// }

// export default App;
//--------------------------------------------------------------------------------
// ChatAssistant removed to prevent that duplicate UI bug.
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

function App() {
  return (
    <Router>
      <div className="antialiased text-slate-900 relative">
        
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