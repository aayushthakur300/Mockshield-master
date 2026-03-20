// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';

// const Landing = () => {
//   // COMPULSORY DEFAULT: Start in light mode
//   const [isLight, setIsLight] = useState(true);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   // --- THEME INITIALIZATION ---
//   useEffect(() => {
//     const stored = localStorage.getItem('ms_theme');
    
//     // COMPULSORY LIGHT MODE: Force light mode unless they explicitly saved 'dark'
//     if (stored === 'dark') {
//       setIsLight(false);
//       document.body.classList.remove('light');
//     } else {
//       setIsLight(true);
//       document.body.classList.add('light');
//       // Save the default to local storage just in case
//       if (!stored) localStorage.setItem('ms_theme', 'light');
//     }
//   }, []);

//   // --- THEME TOGGLE HANDLER ---
//   const toggleTheme = () => {
//     const newTheme = !isLight;
//     setIsLight(newTheme);
//     localStorage.setItem('ms_theme', newTheme ? 'light' : 'dark');
    
//     if (newTheme) {
//       document.body.classList.add('light');
//     } else {
//       document.body.classList.remove('light');
//     }
//   };

//   // --- MOBILE MENU TOGGLE HANDLER ---
//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   // --- MOCKSHIELD FEATURES DATA (Refined to Exactly Match Project Capabilities) ---
//   const features = [
//     { icon: "fa-code-branch", title: "Dual-Engine Evaluation", desc: "Seamlessly toggle between standard Technical Mock Interviews and specialized Resume-based Audits using dynamic AI prompts." },
//     { icon: "fa-user-secret", title: "Forensic Transcript Analysis", desc: "Deep-scan analysis evaluates every candidate response, generating composite scores, feedback, and ideal technical answers." },
//     { icon: "fa-database", title: "Session History Database", desc: "Persistent JSON-based tracking to automatically save, reload, and manage your past interview session performance logs." },
//     { icon: "fa-file-pdf", title: "Professional PDF Dossiers", desc: "Instantly export standardized, multi-page PDF reports containing transcript forensics, competency scoring, and optimization roadmaps." },
//     { icon: "fa-triangle-exclamation", title: "Silent Killer Detection", desc: "Pinpoints critical behavioral red flags and technical gaps that would automatically disqualify a candidate in a real interview." },
//     { icon: "fa-headset", title: "Context-Aware AI Coach", desc: "Floating chat assistant that understands your current report score and domain, providing instant, under-4-sentence strategic advice." },
//     { icon: "fa-map", title: "Optimization Roadmaps", desc: "Generates customized, actionable improvement plans post-interview based on your specific technical and HR weaknesses." },
//     { 
//       icon: "fa-layer-group", 
//       title: "20+ Mock Interview Modules", 
//       desc: "Simulates over 20 distinct interview environments, ranging from rigorous System Design and Advanced DSA to behavioral HR screenings and live debugging." 
//     },
//     { 
//       icon: "fa-cubes", 
//       title: "25+ Supported Tech Domains", 
//       desc: "Deep-scan technical evaluations configured for over 25 unique engineering domains, including Full-Stack Web, Cloud Architecture, Data Science, and DevOps." 
//     },
//     { icon: "fa-fingerprint", title: "Resume Gap Analysis", desc: "Cross-references your provided resume against technical questions to flag padding, high-risk discrepancies, and skill gaps." },
//     { icon: "fa-star-half-stroke", title: "Competency Scoring", desc: "Assigns strict, composite quality scores (0-100) based on Technical Depth, HR fitness, and logic aptitude." },
//     { icon: "fa-wand-magic-sparkles", title: "Ideal Answer Generation", desc: "Rewrites vague or incorrect responses into 'Gold Standard' technical answers formatted for Principal Engineer level communication." },
//     { icon: "fa-file-code", title: "JSON-Enforced AI Parsing", desc: "Strict backend regex extractors guarantee the AI consistently returns valid data arrays for the dashboard without crashing." },
//     { icon: "fa-shield-halved", title: "Live Proctoring Status", desc: "Monitors session integrity and visually flags users if browser focus is lost during the assessment, calculating an overall trust score." },
//     { icon: "fa-object-group", title: "Maximum Merge Protocol", desc: "Guarantees 1:1 data integrity between user answers and AI feedback so no generated questions are ever skipped or lost in the UI." },
//     { icon: "fa-network-wired", title: "Cross-Origin Secure Architecture", desc: "Robust FastAPI backend with strict CORS whitelisting, safely communicating user payloads with the React Vite frontend." },
//     { icon: "fa-server", title: "Multi-Model Failover", desc: "Python backend engine designed to cycle and retry automatically if the primary AI generator encounters a timeout or syntax error." },
//     { icon: "fa-border-all", title: "Sterile Danger Mode UI", desc: "Clinical, neo-brutalist dashboard design utilizing strict white-mode enforcing for maximum readability, focus, and visual impact." },
//     { icon: "fa-bolt", title: "Real-Time Interaction", desc: "Live active listening indicators, auto-scrolling chat states, and instant modal interactions for an immersive coaching experience." },
//   ];

//   return (
//     <div className="landing-wrapper font-sans min-h-screen relative overflow-x-hidden">
//       {/* --- INJECTED CSS FOR EXACT FIDELITY --- */}
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Montserrat:wght@400;600;700;800;900&display=swap');

//         :root {
//             --bg-dark: #050505;
//             --accent: #ef4444;
//             --accent-glow: rgba(239, 68, 68, 0.6);
//             --text-main: #ffffff;
//             --text-muted: #e2e8f0;
//             --panel-bg: rgba(15, 15, 20, 0.6);
//             --border-color: rgba(239, 68, 68, 0.1);
//             --footer-bg: rgba(0, 0, 0, 0.9);
//         }

//         body.light {
//             --bg-dark: #f0f4f8;
//             --accent: #dc2626;
//             --accent-glow: rgba(220, 38, 38, 0.3);
//             --text-main: #111827;
//             --text-muted: #374151;
//             --panel-bg: #ffffff;
//             --border-color: rgba(220, 38, 38, 0.2);
//             --footer-bg: rgba(255, 255, 255, 0.95);
//         }

//         .landing-wrapper {
//             background-color: var(--bg-dark);
//             color: var(--text-main);
//             transition: background-color 0.4s ease, color 0.4s ease;
//             padding-bottom: 50px;
//         }

//         .danger-grid {
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100%;
//             height: 100%;
//             background-image:
//                 linear-gradient(var(--border-color) 1px, transparent 1px),
//                 linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
//             background-size: 40px 40px;
//             z-index: 0;
//             mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
//             pointer-events: none;
//         }

//         .navbar-bg {
//             background: rgba(5, 5, 5, 0.85);
//             border-bottom: 1px solid var(--border-color);
//             backdrop-filter: blur(12px);
//             transition: all 0.4s ease;
//         }

//         body.light .navbar-bg {
//             background: rgba(255, 255, 255, 0.9);
//         }

//         .danger-text {
//             color: var(--accent);
//             animation: dangerPulse 3s infinite alternate;
//         }

//         @keyframes dangerPulse {
//             0% { text-shadow: 0 0 10px var(--accent-glow); }
//             50% { text-shadow: 0 0 25px var(--accent), 0 0 10px rgba(255, 255, 255, 0.5); }
//             100% { text-shadow: 0 0 10px var(--accent-glow); }
//         }

//         .btn-danger-glow {
//             background: linear-gradient(135deg, #991b1b 0%, var(--accent) 100%);
//             color: white;
//             font-weight: 800;
//             text-transform: uppercase;
//             letter-spacing: 1px;
//             box-shadow: 0 0 20px var(--accent-glow);
//             transition: all 0.3s ease;
//         }

//         .btn-danger-glow:hover {
//             transform: translateY(-3px) scale(1.05);
//             box-shadow: 0 0 40px var(--accent);
//         }

//         .feature-card {
//             background: var(--panel-bg);
//             border: 1px solid var(--border-color);
//             border-radius: 12px;
//             padding: 2rem;
//             transition: all 0.3s ease;
//             height: 100%;
//         }

//         .feature-card:hover {
//             border-color: var(--accent);
//             box-shadow: 0 0 25px var(--accent-glow);
//             transform: translateY(-5px);
//         }

//         .feature-icon-lg {
//             font-size: 2rem;
//             color: var(--accent);
//             margin-bottom: 1rem;
//         }

//         .code-preview {
//             font-family: 'JetBrains Mono', monospace;
//             background: var(--bg-dark);
//             border: 1px solid var(--border-color);
//             border-left: 3px solid var(--accent);
//             padding: 1.5rem;
//             border-radius: 8px;
//             color: var(--text-main);
//             transition: background-color 0.4s ease, color 0.4s ease;
//         }

//         .social-icon {
//             display: inline-flex;
//             width: 48px;
//             height: 48px;
//             align-items: center;
//             justify-content: center;
//             border-radius: 50%;
//             background: var(--panel-bg);
//             border: 1px solid var(--border-color);
//             color: var(--text-muted);
//             transition: all 0.3s ease;
//         }

//         .social-icon:hover {
//             color: var(--accent);
//             transform: scale(1.1);
//             box-shadow: 0 0 10px var(--accent-glow);
//         }

//         body.light .social-icon {
//             background: #ffffff;
//             border-color: #e5e7eb;
//             color: #4b5563;
//             box-shadow: 0 4px 10px rgba(0,0,0,0.1);
//         }

//         body.light .social-icon:hover {
//             background: var(--accent);
//             color: white;
//             border-color: var(--accent);
//         }

//         /* MOBILE MENU STYLES */
//         .mobile-menu-overlay {
//             position: fixed;
//             top: 70px;
//             left: 0;
//             width: 100%;
//             background: var(--panel-bg);
//             backdrop-filter: blur(15px);
//             border-bottom: 1px solid var(--border-color);
//             padding: 2rem;
//             display: flex;
//             flex-direction: column;
//             gap: 1.5rem;
//             z-index: 49;
//             transform: translateY(-20px);
//             opacity: 0;
//             pointer-events: none;
//             transition: all 0.3s ease;
//         }

//         .mobile-menu-overlay.active {
//             transform: translateY(0);
//             opacity: 1;
//             pointer-events: auto;
//         }
//       `}</style>

//       {/* --- BACKGROUND GRID --- */}
//       <div className="danger-grid"></div>

//       {/* --- NAVIGATION --- */}
//       <nav className="navbar-bg fixed top-0 w-full z-50 px-6 py-4">
//         <div className="max-w-7xl mx-auto flex items-center justify-between">
//           <Link to="/" className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
//             <span className="text-[var(--text-main)]">Mock<span className="danger-text">Shield</span></span>
//           </Link>

//           {/* DESKTOP MENU */}
//           <div className="hidden md:flex items-center gap-8 font-bold text-sm uppercase tracking-widest text-[var(--text-main)]">
//             <a href="#features" className="hover:text-red-500 transition duration-300">Features</a>
//             <a href="#demo" className="hover:text-red-500 transition duration-300">Analysis</a>
            
//             {/* CTA: Dashboard */}
//             <Link to="/dashboard" className="text-red-500 hover:text-[var(--text-main)] transition duration-300 border border-red-500/30 px-3 py-1 rounded">
//               <i className="fa-solid fa-bolt mr-1"></i> Dashboard
//             </Link>
//           </div>

//           <div className="flex items-center gap-4">
//              {/* THE THEME TOGGLE BUTTON */}
//              <button 
//                 onClick={toggleTheme} 
//                 aria-label="Toggle theme" 
//                 className="p-2 rounded-md text-xl text-[var(--text-main)] hover:text-red-500 transition-colors"
//             >
//               <i className={`fa-solid ${isLight ? 'fa-moon' : 'fa-sun'}`}></i>
//             </button> 
            
//             {/* MOBILE MENU TOGGLE BUTTON */}
//             <button 
//                 className="md:hidden text-2xl text-red-500 hover:text-[var(--text-main)] transition-colors"
//                 onClick={toggleMenu}
//             >
//               <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
//             </button>
//           </div>
//         </div>
//       </nav>

//       {/* --- MOBILE MENU DROPDOWN --- */}
//       <div className={`mobile-menu-overlay md:hidden ${isMenuOpen ? 'active' : ''}`}>
//         <a 
//             href="#features" 
//             className="text-[var(--text-main)] text-xl font-bold uppercase tracking-widest hover:text-red-500 transition border-b border-[var(--border-color)] pb-2"
//             onClick={() => setIsMenuOpen(false)}
//         >
//             Features
//         </a>
//         <a 
//             href="#demo" 
//             className="text-[var(--text-main)] text-xl font-bold uppercase tracking-widest hover:text-red-500 transition border-b border-[var(--border-color)] pb-2"
//             onClick={() => setIsMenuOpen(false)}
//         >
//             Analysis
//         </a>
//         <Link 
//             to="/dashboard" 
//             className="text-red-500 text-xl font-bold uppercase tracking-widest hover:text-[var(--text-main)] transition flex items-center gap-2"
//             onClick={() => setIsMenuOpen(false)}
//         >
//             <i className="fa-solid fa-bolt"></i> Dashboard
//         </Link>
//       </div>

//       {/* --- HERO SECTION --- */}
//       <section className="relative pt-40 pb-20 min-h-screen flex items-center justify-center text-center px-6">
//         <div className="max-w-5xl mx-auto z-10">
//           <div className="inline-block px-4 py-1 mb-6 border border-red-500/30 rounded-full bg-red-900/10 text-red-400 text-xs font-bold tracking-widest uppercase animate-pulse">
//             v2.0 Architecture Online
//           </div>

//           <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-[var(--text-main)]">
//             SUPREME AI <br />
//             <span className="danger-text">INTERVIEW ARCHITECT</span>
//           </h1>

//           <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-semibold">
//             Dual-engine mock interview simulation, resume gap analysis, and context-aware automated coaching. 
//             Persistent JSON tracking, forensic transcript evaluations, and professional PDF dossiers.
//           </p>

//           <div className="flex flex-col md:flex-row gap-6 justify-center">
//             {/* CTA: Launch Dashboard */}
//             <Link to="/dashboard" className="btn-danger-glow px-8 py-4 rounded-lg text-lg flex items-center justify-center gap-3">
//               <i className="fa-solid fa-microchip"></i> Launch MockShield
//             </Link>
            
//             <a href="#features" className="px-8 py-4 rounded-lg text-lg font-bold border border-[var(--text-muted)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition flex items-center justify-center gap-2">
//               Explore Architecture <i className="fa-solid fa-arrow-down"></i>
//             </a>
//           </div>
//         </div>
//       </section>

//       {/* --- FEATURES GRID (18 Cards) --- */}
//       <section id="features" className="py-24 bg-black/5 dark:bg-black/30">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wide text-[var(--text-main)]">
//               System <span className="text-red-500">Capabilities</span>
//             </h2>
//             <div className="h-1 w-24 bg-red-600 mx-auto mt-4 rounded"></div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="feature-card flex flex-col items-start">
//                 <i className={`fa-solid ${feature.icon} feature-icon-lg`}></i>
//                 <h3 className="text-xl font-bold text-[var(--text-main)] mb-3">{feature.title}</h3>
//                 <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
//                   {feature.desc}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* --- DEMO / ANALYSIS SECTION --- */}
//       <section id="demo" className="py-24 relative overflow-hidden">
//         <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          
//           <div>
//             <h2 className="text-3xl font-bold mb-6 text-[var(--text-main)]">
//               Supreme AI <span className="text-red-500">LogicProbe</span>
//             </h2>
//             <p className="text-[var(--text-muted)] text-lg mb-6 leading-relaxed font-bold">
//               The MockShield AI engine performs strict evaluation across technical, HR, and aptitude metrics, utilizing multi-model failovers and JSON-enforced parsing to deliver granular feedback without crashing.
//             </p>
//             <ul className="space-y-4 text-[var(--text-muted)] font-semibold">
//               <li className="flex items-center gap-3">
//                 <i className="fa-solid fa-check-circle text-green-500"></i>
//                 <span>Resume Integrity & Skill Audits</span>
//               </li>
//               <li className="flex items-center gap-3">
//                 <i className="fa-solid fa-check-circle text-green-500"></i>
//                 <span>Detailed Silent Killer Detection</span>
//               </li>
//               <li className="flex items-center gap-3">
//                 <i className="fa-solid fa-check-circle text-green-500"></i>
//                 <span>Automated Optimization Roadmaps</span>
//               </li>
//             </ul>
            
//             <Link to="/dashboard" className="mt-8 inline-block text-red-400 font-bold hover:text-red-500 transition">
//               Initialize Forensic Simulation -&gt;
//             </Link>
//           </div>

//           {/* --- CODE PREVIEW (Mock Analysis JSON matching Python Backend) --- */}
//           <div className="code-preview shadow-2xl shadow-red-900/20">
//             <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
//               <div className="w-3 h-3 rounded-full bg-red-500"></div>
//               <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//               <div className="w-3 h-3 rounded-full bg-green-500"></div>
//               <span className="text-xs text-gray-500 ml-auto font-bold tracking-widest uppercase">eval_response.json</span>
//             </div>
//             <code className="text-sm block">
//               <span className="block"><span className="text-purple-400">"interview_results"</span>: <span className="text-yellow-400">{"{"}</span></span>
//               <span className="block pl-4"><span className="text-blue-400">"score"</span>: <span className="text-green-400">92</span>,</span>
//               <span className="block pl-4"><span className="text-blue-400">"summary"</span>: <span className="text-green-400">"Principal-level communication verified."</span>,</span>
//               <span className="block pl-4"><span className="text-blue-400">"roadmap"</span>: <span className="text-green-400">"Focus on advanced system design scaling."</span>,</span>
//               <span className="block pl-4"><span className="text-blue-400">"silent_killers"</span>: [</span>
//               <span className="block pl-8 text-gray-500">// Extracted Behavioral Flags</span>
//               <span className="block pl-8"><span className="text-orange-400">"High latency before architectural answers"</span>,</span>
//               <span className="block pl-8"><span className="text-orange-400">"Resume discrepancy detected in React hooks"</span></span>
//               <span className="block pl-4">]</span>
//               <span className="block"><span className="text-yellow-400">{"}"}</span></span>
//             </code>
//           </div>

//         </div>
//       </section>

//       {/* --- CONTACT SECTION --- */}
//       <section id="contact" className="py-16 border-t border-[var(--border-color)] bg-[var(--footer-bg)]">
//         <div className="max-w-7xl mx-auto px-6 text-center">
//           <h3 className="text-3xl font-black mb-8 text-[var(--text-main)]">
//             Connect with <span className="text-red-500">Us</span>
//           </h3>

//           <div className="flex items-center justify-center gap-6 mb-8">
//             {['github', 'linkedin-in', 'facebook-f', 'instagram'].map((icon) => (
//                 <a key={icon} href="#" className="social-icon">
//                     <i className={`fab fa-${icon}`}></i>
//                 </a>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* --- FIXED FOOTER --- */}
//       <footer className="fixed bottom-0 w-full z-50 bg-[var(--footer-bg)] border-t border-[var(--border-color)] py-2 text-center">
//         <div className="max-w-7xl mx-auto px-6">
//           <p className="text-[var(--text-muted)] text-sm font-bold">
//             © 2026 MockShield • All Rights Reserved • Developed by Aayush Thakur
//           </p>
//         </div>
//       </footer>

//     </div>
//   );
// };

// export default Landing;
//--------------------------------------------------------------------------------------------------------
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const Landing = () => {
  // COMPULSORY DEFAULT: Start in light mode
  const [isLight, setIsLight] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  // --- THEME INITIALIZATION ---
  useEffect(() => {
    const stored = localStorage.getItem('ms_theme');
    
    // COMPULSORY LIGHT MODE: Force light mode unless they explicitly saved 'dark'
    if (stored === 'dark') {
      setIsLight(false);
      document.body.classList.remove('light');
    } else {
      setIsLight(true);
      document.body.classList.add('light');
      // Save the default to local storage just in case
      if (!stored) localStorage.setItem('ms_theme', 'light');
    }
  }, []);

  // --- THEME TOGGLE HANDLER ---
  const toggleTheme = () => {
    const newTheme = !isLight;
    setIsLight(newTheme);
    localStorage.setItem('ms_theme', newTheme ? 'light' : 'dark');
    
    if (newTheme) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  
  // --- MOCKSHIELD FEATURES DATA ---
  const features = [
    { icon: "fa-code-branch", title: "Dual-Engine Evaluation", desc: "Seamlessly toggle between standard Technical Mock Interviews and specialized Resume-based Audits using dynamic AI prompts." },
    { icon: "fa-user-secret", title: "Forensic Transcript Analysis", desc: "Deep-scan analysis evaluates every candidate response, generating composite scores, feedback, and ideal technical answers." },
    { icon: "fa-database", title: "Session History Database", desc: "Persistent JSON-based tracking to automatically save, reload, and manage your past interview session performance logs." },
    { icon: "fa-file-pdf", title: "Professional PDF Dossiers", desc: "Instantly export standardized, multi-page PDF reports containing transcript forensics, competency scoring, and optimization roadmaps." },
    { icon: "fa-triangle-exclamation", title: "Silent Killer Detection", desc: "Pinpoints critical behavioral red flags and technical gaps that would automatically disqualify a candidate in a real interview." },
    { icon: "fa-headset", title: "Context-Aware AI Coach", desc: "Floating chat assistant that understands your current report score and domain, providing instant, under-4-sentence strategic advice." },
    { icon: "fa-map", title: "Optimization Roadmaps", desc: "Generates customized, actionable improvement plans post-interview based on your specific technical and HR weaknesses." },
    { icon: "fa-bullseye", title: "Dynamic Target Domains", desc: "Input your specific tech stack, job role, and years of experience to dynamically generate hyper-targeted interview questions." },
    { icon: "fa-fingerprint", title: "Resume Gap Analysis", desc: "Cross-references your provided resume against technical questions to flag padding, high-risk discrepancies, and skill gaps." },
    { icon: "fa-star-half-stroke", title: "Competency Scoring", desc: "Assigns strict, composite quality scores (0-100) based on Technical Depth, HR fitness, and logic aptitude." },
    { icon: "fa-wand-magic-sparkles", title: "Ideal Answer Generation", desc: "Rewrites vague or incorrect responses into 'Gold Standard' technical answers formatted for Principal Engineer level communication." },
    { icon: "fa-shield-halved", title: "Live Proctoring Status", desc: "Monitors session integrity and visually flags users if browser focus is lost during the assessment, calculating an overall trust score." },
    { icon: "fa-object-group", title: "Maximum Merge Protocol", desc: "Guarantees 1:1 data integrity between user answers and AI feedback so no generated questions are ever skipped or lost in the UI." },
    { icon: "fa-network-wired", title: "Cross-Origin Secure Architecture", desc: "Robust FastAPI backend with strict CORS whitelisting, safely communicating user payloads with the React Vite frontend." },
    { icon: "fa-server", title: "Multi-Model Failover", desc: "Python backend engine designed to cycle and retry automatically if the primary AI generator encounters a timeout or syntax error." },
    { icon: "fa-border-all", title: "Sterile Danger Mode UI", desc: "Clinical, neo-brutalist dashboard design utilizing strict white-mode enforcing for maximum readability, focus, and visual impact." },
    { icon: "fa-bolt", title: "Real-Time Interaction", desc: "Live active listening indicators, auto-scrolling chat states, and instant modal interactions for an immersive coaching experience." },
    { icon: "fa-layer-group", title: "20 Mock Interview Modules", desc: "Simulates over 20 distinct interview environments, ranging from rigorous System Design and Advanced DSA to behavioral HR screenings and live debugging." },
    { icon: "fa-cubes", title: "25 Supported Tech Domains", desc: "Deep-scan technical evaluations configured for over 25 unique engineering domains, including Full-Stack Web, Cloud Architecture, Data Science, and DevOps." }
  ];

  return (
    <div className="landing-wrapper font-sans min-h-screen relative overflow-x-hidden">
      {/* --- INJECTED CSS FOR EXACT FIDELITY --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Montserrat:wght@400;600;700;800;900&display=swap');

        :root {
            /* DEEP, CLEAN DARK MODE */
            --bg-dark: #09090b; 
            --bg-section: #111827;
            --accent: #ef4444;
            --accent-glow: rgba(239, 68, 68, 0.3);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --panel-bg: #1e293b;
            --input-bg: #0f172a;
            --border-color: rgba(239, 68, 68, 0.2);
            --footer-bg: #020617;
        }

        body.light {
            /* PRISTINE LIGHT MODE */
            --bg-dark: #f0f4f8;
            --bg-section: #e2e8f0;
            --accent: #dc2626;
            --accent-glow: rgba(220, 38, 38, 0.2);
            --text-main: #111827;
            --text-muted: #475569;
            --panel-bg: #ffffff;
            --input-bg: #ffffff;
            --border-color: rgba(220, 38, 38, 0.15);
            --footer-bg: #ffffff;
        }

        .landing-wrapper {
            background-color: var(--bg-dark);
            color: var(--text-main);
            transition: background-color 0.4s ease, color 0.4s ease;
            padding-bottom: 50px;
        }

        .danger-grid {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                linear-gradient(var(--border-color) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
            background-size: 40px 40px;
            z-index: 0;
            mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
            pointer-events: none;
        }

        .navbar-bg {
            background: rgba(9, 9, 11, 0.85);
            border-bottom: 1px solid var(--border-color);
            backdrop-filter: blur(12px);
            transition: all 0.4s ease;
        }

        body.light .navbar-bg {
            background: rgba(255, 255, 255, 0.9);
        }

        .danger-text {
            color: var(--accent);
            animation: dangerPulse 3s infinite alternate;
        }

        @keyframes dangerPulse {
            0% { text-shadow: 0 0 10px var(--accent-glow); }
            50% { text-shadow: 0 0 20px var(--accent); } /* Removed the irritating white flash */
            100% { text-shadow: 0 0 10px var(--accent-glow); }
        }

        .btn-danger-glow {
            background: linear-gradient(135deg, #991b1b 0%, var(--accent) 100%);
            color: white;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 0 20px var(--accent-glow);
            transition: all 0.3s ease;
        }

        .btn-danger-glow:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 0 35px var(--accent);
        }

        .feature-card {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 2rem;
            transition: all 0.3s ease;
            height: 100%;
        }

        .feature-card:hover {
            border-color: var(--accent);
            box-shadow: 0 0 25px var(--accent-glow);
            transform: translateY(-5px);
        }

        .feature-icon-lg {
            font-size: 2rem;
            color: var(--accent);
            margin-bottom: 1rem;
        }

        .code-preview {
            font-family: 'JetBrains Mono', monospace;
            background: var(--bg-dark);
            border: 1px solid var(--border-color);
            border-left: 3px solid var(--accent);
            padding: 1.5rem;
            border-radius: 8px;
            color: var(--text-main);
            transition: background-color 0.4s ease, color 0.4s ease;
        }

        .social-icon {
            display: inline-flex;
            width: 48px;
            height: 48px;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            transition: all 0.3s ease;
        }

        .social-icon:hover {
            color: var(--accent);
            transform: scale(1.1);
            box-shadow: 0 0 15px var(--accent-glow);
        }

        body.light .social-icon {
            background: #ffffff;
            border-color: #e5e7eb;
            color: #4b5563;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        body.light .social-icon:hover {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        /* MOBILE MENU STYLES */
        .mobile-menu-overlay {
            position: fixed;
            top: 70px;
            left: 0;
            width: 100%;
            background: var(--panel-bg);
            backdrop-filter: blur(15px);
            border-bottom: 1px solid var(--border-color);
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            z-index: 49;
            transform: translateY(-20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
        }

        .mobile-menu-overlay.active {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
        }
      `}</style>

      {/* --- BACKGROUND GRID --- */}
      <div className="danger-grid"></div>

      {/* --- NAVIGATION --- */}
      <nav className="navbar-bg fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
            <span className="text-[var(--text-main)]">Mock<span className="danger-text">Shield</span></span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-8 font-bold text-sm uppercase tracking-widest text-[var(--text-main)]">
            <a href="#features" className="hover:text-red-500 transition duration-300">Features</a>
            <a href="#demo" className="hover:text-red-500 transition duration-300">Analysis</a>
            
            {/* CTA: Dashboard / Login */}
            <Link to="/dashboard" className="text-red-500 hover:text-[var(--text-main)] transition duration-300 border border-red-500/30 px-3 py-1 rounded">
              <i className="fa-solid fa-bolt mr-1"></i> Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4">
             {/* THE THEME TOGGLE BUTTON */}
             <button 
                onClick={toggleTheme} 
                aria-label="Toggle theme" 
                className="p-2 rounded-md text-xl text-[var(--text-main)] hover:text-red-500 transition-colors"
            >
              <i className={`fa-solid ${isLight ? 'fa-moon' : 'fa-sun'}`}></i>
            </button> 
            
            {/* MOBILE MENU TOGGLE BUTTON */}
            <button 
                className="md:hidden text-2xl text-red-500 hover:text-[var(--text-main)] transition-colors"
                onClick={toggleMenu}
            >
              <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE MENU DROPDOWN --- */}
      <div className={`mobile-menu-overlay md:hidden ${isMenuOpen ? 'active' : ''}`}>
        <a href="#features" className="text-[var(--text-main)] text-xl font-bold uppercase tracking-widest hover:text-red-500 transition border-b border-[var(--border-color)] pb-2" onClick={() => setIsMenuOpen(false)}>Features</a>
        <a href="#demo" className="text-[var(--text-main)] text-xl font-bold uppercase tracking-widest hover:text-red-500 transition border-b border-[var(--border-color)] pb-2" onClick={() => setIsMenuOpen(false)}>Analysis</a>
        <a href="#feedback" className="text-[var(--text-main)] text-xl font-bold uppercase tracking-widest hover:text-red-500 transition border-b border-[var(--border-color)] pb-2" onClick={() => setIsMenuOpen(false)}>Feedback</a>
        <Link to="/dashboard" className="text-red-500 text-xl font-bold uppercase tracking-widest hover:text-[var(--text-main)] transition flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <i className="fa-solid fa-bolt"></i> Dashboard
        </Link>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 min-h-screen flex items-center justify-center text-center px-6">
        <div className="max-w-5xl mx-auto z-10">
          <div className="inline-block px-4 py-1 mb-6 border border-red-500/30 rounded-full bg-red-900/10 text-red-400 text-xs font-bold tracking-widest uppercase animate-pulse">
            v2.0 Architecture Online
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-[var(--text-main)]">
            SUPREME AI <br />
            <span className="danger-text">INTERVIEW ARCHITECT</span>
          </h1>

          <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-semibold">
            Dual-engine mock interview simulation, resume gap analysis, and context-aware automated coaching. 
            Forensic transcript evaluations, and professional PDF dossiers.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            {/* CTA: Launch Dashboard */}
            <Link to="/dashboard" className="btn-danger-glow px-8 py-4 rounded-lg text-lg flex items-center justify-center gap-3">
              <i className="fa-solid fa-microchip"></i> Launch MockShield
            </Link>
            
            <a href="#features" className="px-8 py-4 rounded-lg text-lg font-bold border border-[var(--text-muted)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition flex items-center justify-center gap-2">
              Explore Architecture <i className="fa-solid fa-arrow-down"></i>
            </a>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID (20 Cards) --- */}
      <section id="features" className="py-24 bg-[var(--bg-section)] transition-colors duration-400">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wide text-[var(--text-main)]">
              System <span className="text-red-500">Capabilities</span>
            </h2>
            <div className="h-1 w-24 bg-red-600 mx-auto mt-4 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card flex flex-col items-start">
                <i className={`fa-solid ${feature.icon} feature-icon-lg`}></i>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-3">{feature.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DEMO / ANALYSIS SECTION --- */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-[var(--text-main)]">
              Supreme AI <span className="text-red-500">LogicProbe</span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg mb-6 leading-relaxed font-bold">
              The MockShield AI engine performs strict evaluation across technical, HR, and aptitude metrics, utilizing multi-model failovers and JSON-enforced parsing to deliver granular feedback without crashing.
            </p>
            <ul className="space-y-4 text-[var(--text-muted)] font-semibold">
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-check-circle text-green-500"></i>
                <span>Resume Integrity & Skill Audits</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-check-circle text-green-500"></i>
                <span>Detailed Silent Killer Detection</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-check-circle text-green-500"></i>
                <span>Automated Optimization Roadmaps</span>
              </li>
            </ul>
            <Link to="/dashboard" className="mt-8 inline-block text-red-400 font-bold hover:text-red-500 transition">
              Initialize Forensic Simulation -&gt;
            </Link>
          </div>

          {/* --- CODE PREVIEW --- */}
          <div className="code-preview shadow-2xl shadow-red-900/20">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-color)] pb-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-[var(--text-muted)] ml-auto font-bold tracking-widest uppercase">eval_response.json</span>
            </div>
            <code className="text-sm block">
              <span className="block"><span className="text-purple-400">"interview_results"</span>: <span className="text-yellow-400">{"{"}</span></span>
              <span className="block pl-4"><span className="text-blue-400">"score"</span>: <span className="text-green-400">92</span>,</span>
              <span className="block pl-4"><span className="text-blue-400">"summary"</span>: <span className="text-green-400">"Principal-level communication verified."</span>,</span>
              <span className="block pl-4"><span className="text-blue-400">"roadmap"</span>: <span className="text-green-400">"Focus on advanced system design scaling."</span>,</span>
              <span className="block pl-4"><span className="text-blue-400">"silent_killers"</span>: [</span>
              <span className="block pl-8 text-slate-500">// Extracted Behavioral Flags</span>
              <span className="block pl-8"><span className="text-orange-400">"High latency before architectural answers"</span>,</span>
              <span className="block pl-8"><span className="text-orange-400">"Resume discrepancy detected in React hooks"</span></span>
              <span className="block pl-4">]</span>
              <span className="block"><span className="text-yellow-400">{"}"}</span></span>
            </code>
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-16 border-t border-[var(--border-color)] bg-[var(--footer-bg)] transition-colors duration-400">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-black mb-8 text-[var(--text-main)]">
            Connect with <span className="text-red-500">Us</span>
          </h3>

          <div className="flex items-center justify-center gap-6 mb-8">
            {['github', 'linkedin-in', 'facebook-f', 'instagram'].map((icon) => (
                <a key={icon} href="#" className="social-icon">
                    <i className={`fab fa-${icon}`}></i>
                </a>
            ))}
          </div>
        </div>
      </section>

      {/* --- FIXED FOOTER --- */}
      <footer className="fixed bottom-0 w-full z-50 bg-[var(--footer-bg)] border-t border-[var(--border-color)] py-2 text-center transition-colors duration-400">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[var(--text-muted)] text-sm font-bold">
            © 2026 MockShield • All Rights Reserved • Developed by Aayush Thakur
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;