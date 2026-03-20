// 1 march
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebcamFeed from '../components/WebcamFeed';
import { evaluateResumeSession, saveInterview } from '../services/api';
import { loadProctoringModels } from '../utils/face-proctor';

// --- EMBEDDED BEEP SOUND (Base64) ---
const BEEP_URL = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMQAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGlhZy4wAAD/7kmRAAAAAA0gAAAAANIAAAAADSCAAAA0ggAAAAAAAAAAAAAAA//uSZIYAAAANIOAAAADSAAAAAA0g4AAAANIAAAAAAAAAAAAAAAP/7kmRmAAAADSDgAAAA0gAAAAANIAAAADSAAAAAAAAAAAAAAAD/+5JkpgAAAA0g4AAAANIAAAAADSDgAAAA0gAAAAAAAAAAAAAAA//uSZKYAAAANIOAAAADSAAAAAA0g4AAAANIAAAAAAAAAAAAAAAP/7kmSmAAAADSDgAAAA0gAAAAANIAAAADSAAAAAAAAAAAAAAAD/+5JkpgAAAA0g4AAAANIAAAAADSDgAAAA0gAAAAAAAAAAAAAAA//uSZKYAAAANIOAAAADSAAAAAA0g4AAAANIAAAAAAAAAAAAAAAP/7kmSmAAAADSDgAAAA0gAAAAANIAAAADSAAAAAAAAAAAAAAAD/+5JkpgAAAA0g4AAAANIAAAAADSDgAAAA0gAAAAAAAAAAAAAAA//uSZKYAAAANIOAAAADSAAAAAA0g4AAAANIAAAAAAAAAAAAAAA";

const ResumeInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- 1. PERSISTENCE LAYER ---
  const SESSION_KEY = "resume_session_backup";
  
  const getInitialState = () => {
    const saved = localStorage.getItem(SESSION_KEY);
    const propsData = location.state || {};
    
    // CASE 1: Page Refresh (No Props, but LocalStorage exists)
    if (saved && !propsData.questions) {
      return JSON.parse(saved);
    }

    // CASE 2: New Interview Start (Props exist)
    if (propsData.questions) {
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if it's the same session based on field
        if (parsed.config?.field === propsData.config?.field) {
          return parsed;
        }
      }
      return {
        questions: propsData.questions || ["Error: No Questions Loaded"],
        config: propsData.config || { field: "General", experience: "Junior" },
        currIndex: 0,
        answers: [],
        currentAnswer: "",
        violations: 0,
        hasStarted: false,
        isDisqualified: false,
        isSubmitted: false, // Track if user clicked Finalize
        startTime: null // NEW: Track interview start time
      };
    }

    // Fallback default
    return {
      questions: ["Error: No Questions Loaded"],
      config: { field: "General", experience: "Junior" },
      currIndex: 0,
      answers: [],
      currentAnswer: "",
      violations: 0,
      hasStarted: false,
      isDisqualified: false,
      isSubmitted: false,
      startTime: null
    };
  };

  // Initialize State
  const initialState = getInitialState();
  const [questions] = useState(initialState.questions);
  const [config] = useState(initialState.config);
  
  const [currIndex, setCurrIndex] = useState(initialState.currIndex);
  const [answers, setAnswers] = useState(initialState.answers);
  const [currentAnswer, setCurrentAnswer] = useState(initialState.currentAnswer);
  
  // --- FLAG & TIME STATE (PERSISTED) ---
  const [violations, setViolations] = useState(initialState.violations);
  const [startTime, setStartTime] = useState(initialState.startTime);
  const [timeLeft, setTimeLeft] = useState(30 * 60 * 1000); // 30 minutes in ms
  
  // Runtime State
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // --- INTEGRITY & PROCTORING STATE ---
  const [cameraStatus, setCameraStatus] = useState('checking'); 
  const [hasStarted, setHasStarted] = useState(initialState.hasStarted || false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(initialState.isDisqualified || false); 

  // --- SUBMISSION LOCK STATE ---
  // If true, proctoring is OFF, UI is locked, and we are processing (even after refresh)
  const [isSubmitted, setIsSubmitted] = useState(initialState.isSubmitted || false);

  const [showViolationModal, setShowViolationModal] = useState(false); 
  const [showFullScreenExitModal, setShowFullScreenExitModal] = useState(false); 
  const [showPrivacyShutterModal, setShowPrivacyShutterModal] = useState(false);

  // Refs
  const lastViolationTime = useRef(0);
  const faceMissingCycleRef = useRef(0); 
  const privacyShutterTimerRef = useRef(0); 

  const MAX_VIOLATIONS = 10;
  const INTERVIEW_TIME_LIMIT_MS = 30 * 60 * 1000; // 30 Minutes

  // --- HELPER: CALCULATE EXACT TIME TAKEN ---
  const getFormattedTimeTaken = useCallback(() => {
      if (!startTime) return "N/A";
      const elapsedMs = Date.now() - startTime;
      
      if (elapsedMs < 60000) {
          // If under 1 minute, show precise seconds (e.g. 5.9 seconds)
          return (elapsedMs / 1000).toFixed(1) + " seconds";
      } else {
          // If over 1 minute, show minutes and seconds
          const mins = Math.floor(elapsedMs / 60000);
          const secs = ((elapsedMs % 60000) / 1000).toFixed(1);
          return `${mins} minutes ${secs} seconds`;
      }
  }, [startTime]);

  // --- STRICT 30-MINUTE TIMER MONITOR ---
  useEffect(() => {
      if (!hasStarted || isDisqualified || isSubmitted || !startTime) return;

      const timerInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = INTERVIEW_TIME_LIMIT_MS - elapsed;

          if (remaining <= 0) {
              clearInterval(timerInterval);
              setTimeLeft(0);
              // Trigger mandatory immediate termination. No flag increment.
              terminateSession("Time Limit Exceeded (30 Minutes)");
          } else {
              setTimeLeft(remaining);
          }
      }, 1000);

      return () => clearInterval(timerInterval);
  }, [hasStarted, isDisqualified, isSubmitted, startTime]);

  // --- REFRESH / HARD RELOAD DETECTION ---
  useEffect(() => {
    // If submitted, we DO NOT check for fullscreen or refresh penalties.
    // We just want to recover the session.
    if (isSubmitted) {
        setProcessing(true); // Restore processing overlay
        return;
    }

    if (hasStarted && !isDisqualified) {
        const isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        
        if (!isFullScreen) {
            console.warn("Hard Refresh or Full Screen Exit Detected on Load.");
            
            setViolations(prev => prev + 1);
            setShowFullScreenExitModal(true);
            new Audio(BEEP_URL).play().catch(()=>{});
        }
    }
  }, []);

  // --- SAVE STATE ON CHANGE (PERSISTENCE) ---
  useEffect(() => {
    const stateToSave = {
      questions,
      config,
      currIndex,
      answers,
      currentAnswer,
      violations,
      isDisqualified,
      hasStarted,
      isSubmitted, // PERSIST: Save submission state
      startTime // PERSIST: Save timer start time
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
  }, [currIndex, answers, currentAnswer, violations, questions, config, isDisqualified, hasStarted, isSubmitted, startTime]);

  // --- 0. INITIAL CAMERA CHECK ---
  useEffect(() => {
    async function checkCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraStatus('granted');
      } catch (err) {
        console.error("Camera permission denied:", err);
        setCameraStatus('denied');
      }
    }
    checkCamera();
    loadProctoringModels();
  }, []);

  // --- TERMINATION HELPER (SAVES TO DB WITH FLAGS & TIME) ---
  const terminateSession = useCallback(async (reason) => {
    // If submitted, user cannot be terminated anymore (answer is locked)
    if (isSubmitted) return;

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }

    setIsDisqualified(true);
    const finalTimeTaken = getFormattedTimeTaken();

    try {
        const failurePayload = {
            questions: answers, 
            topic: config.field || "Resume Audit (Terminated)", 
            totalScore: 0, 
            overallFeedback: `DISQUALIFIED: ${reason}. Session terminated due to protocol or time violation.`,
            roadmap: "N/A",
            question_reviews: [],
            silent_killers: ["Procedural Integrity Violation", reason],
            // 🔥 CRITICAL: Embed integrity and time for Dashboard History 🔥
            integrity: {
                count: violations,
                score: 0
            },
            timeTaken: finalTimeTaken
        };
        console.log("💾 Saving Terminated Resume Session...", failurePayload);
        await saveInterview(failurePayload);
    } catch (e) {
        console.error("Failed to save termination log:", e);
    }

    localStorage.removeItem(SESSION_KEY);
    const video = document.querySelector('video');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    navigate('/'); 
  }, [navigate, SESSION_KEY, answers, config.field, violations, isSubmitted, getFormattedTimeTaken]);

  // --- FULL SCREEN ENFORCEMENT ---
  const enterFullScreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { 
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { 
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.log("Full screen request denied:", err);
    }
  };

  const handleStartInterview = () => {
    if (!disclaimerAccepted) return alert("You must agree to the guidelines.");
    enterFullScreen().then(() => {
        if (!startTime) setStartTime(Date.now());
        setHasStarted(true);
    }).catch(() => {
        if (!startTime) setStartTime(Date.now());
        setHasStarted(true);
    });
  };

  // --- VIOLATION HANDLER ---
  const handleViolation = useCallback((reason, isMajor = false) => {
    // CRITICAL: DISABLE ALL PROCTORING IF SUBMITTED
    if (isSubmitted) return;
    
    if (!hasStarted || isDisqualified) return;

    if (reason === "Privacy Shutter Detected") {
        setShowPrivacyShutterModal(true);
        return;
    }

    if (reason === "FACE_MISSING_20S") {
        faceMissingCycleRef.current += 1;
        const strikes = faceMissingCycleRef.current;
        console.warn(`Face Missing Strike: ${strikes}/3`);

        if (strikes >= 3) {
            setIsDisqualified(true); 
            if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
            alert("You attempted cheating (Face Missing 3x).");
            terminateSession("Face Missing 3x");
        } else {
            setViolations(prev => prev + 1);
            alert(`WARNING: Face not visible for 20s. Strike ${strikes}/3.`);
        }
        return;
    }

    const now = Date.now();
    if (now - lastViolationTime.current < 1000) return;
    lastViolationTime.current = now;
    
    new Audio(BEEP_URL).play().catch(()=>{});
    
    console.warn(`VIOLATION: ${reason}`);
    setViolations(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_VIOLATIONS) {
            setIsDisqualified(true);
        }
        return newCount;
    });
    
    if (reason.includes("Tab") || reason.includes("Focus")) {
      setShowViolationModal(true);
    }
  }, [hasStarted, isDisqualified, terminateSession, isSubmitted]);

  // --- PRIVACY SHUTTER MONITOR ---
  useEffect(() => {
    if (isSubmitted) return; // Disable check if submitted
    if (!hasStarted || isDisqualified) return;
    
    const interval = setInterval(() => {
        const video = document.querySelector('video');
        if (!video) return;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 50; canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 50, 50);
            const data = ctx.getImageData(0, 0, 50, 50).data;
            let brightness = 0;
            for(let i=0; i<data.length; i+=4) brightness += (data[i]+data[i+1]+data[i+2])/3;
            brightness = brightness / (data.length/4);

            if (brightness < 10) {
                if (!showPrivacyShutterModal) {
                    setShowPrivacyShutterModal(true);
                    handleViolation("Privacy Shutter Detected");
                }
                privacyShutterTimerRef.current += 1;
                if (privacyShutterTimerRef.current >= 120) {
                    terminateSession("Camera covered for > 2 minutes.");
                }
            } else {
                if (showPrivacyShutterModal) {
                    setShowPrivacyShutterModal(false);
                    privacyShutterTimerRef.current = 0;
                }
            }
        } catch(e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isDisqualified, showPrivacyShutterModal, handleViolation, terminateSession, isSubmitted]);

  // --- LISTENERS ---
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (isSubmitted) return; // Disable check if submitted
      if (!hasStarted || isDisqualified) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setShowFullScreenExitModal(true);
        handleViolation("Exited Full Screen Mode");
      } else {
        setShowFullScreenExitModal(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, [hasStarted, isDisqualified, handleViolation, isSubmitted]);

  useEffect(() => {
    if (isSubmitted) return; // Disable check if submitted
    if (!hasStarted || isDisqualified) return;
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("User Left Tab / Minimized");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleViolation, hasStarted, isDisqualified, isSubmitted]);

  // --- STT & INTERVIEW LOGIC ---
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition 
    ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() 
    : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.lang = 'en-US';
  }

  const toggleMic = () => {
    if (isSubmitted) return; // Disable mic if submitted
    if (!recognition) return alert("Speech API not supported.");
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setCurrentAnswer(prev => prev + " " + transcript);
      };
    }
  };

  // --- NAVIGATION HANDLERS ---
  const handlePrevious = () => {
    if (isSubmitted) return; // Disable nav if submitted
    if (currIndex > 0) {
        if (isListening) {
            recognition.stop();
            setIsListening(false);
        }

        const updatedAnswers = [...answers];
        updatedAnswers[currIndex] = {
            question: questions[currIndex],
            answer: currentAnswer
        };
        setAnswers(updatedAnswers);

        const prevIndex = currIndex - 1;
        setCurrIndex(prevIndex);

        const prevData = updatedAnswers[prevIndex];
        setCurrentAnswer(prevData ? prevData.answer : "");
    }
  };

  const handleNext = async () => {
    if (isSubmitted) return; // Disable nav if submitted

    const updatedAnswers = [...answers];
    updatedAnswers[currIndex] = { 
      question: questions[currIndex], 
      answer: currentAnswer || "[No Answer Provided]" 
    };
    setAnswers(updatedAnswers);
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    }

    if (currIndex + 1 < questions.length) {
      const nextIndex = currIndex + 1;
      setCurrIndex(nextIndex);
      
      const nextData = updatedAnswers[nextIndex];
      setCurrentAnswer(nextData ? nextData.answer : "");

    } else {
      // FINALIZE
      finishInterview(updatedAnswers);
    }
  };

  // --- FINISH LOGIC (SAVES REAL TIME AND FLAGS) ---
  const finishInterview = async (finalAnswers) => {
    // 1. LOCK THE STATE IMMEDIATELY
    setIsSubmitted(true);
    setProcessing(true);
    
    const finalTimeTaken = getFormattedTimeTaken();

    // 1a. Force immediate persistence of the 'isSubmitted' flag and 'answers'
    // in case the browser crashes/refreshes during the API call.
    const lockingState = {
      questions,
      config,
      currIndex,
      answers: finalAnswers,
      currentAnswer,
      violations,
      isDisqualified,
      hasStarted,
      isSubmitted: true, // Lock
      startTime // Lock timer
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(lockingState));

    // 2. EVALUATE WITH RESUME API
    let evaluationResult = null;
    try {
        console.log("🧠 Sending for Evaluation...", finalAnswers);
        const response = await evaluateResumeSession(
            finalAnswers, 
            config.field, 
            config.experience
        );
        evaluationResult = response.data || response;
    } catch (error) {
        console.error("Evaluation Error:", error);
        // Do not unlock isSubmitted. User must wait or refresh (which will retry).
        evaluationResult = {
            score: 0,
            summary: "AI Analysis Failed. Retrying...",
            silent_killers: [],
            roadmap: "",
            question_reviews: []
        };
    }

    const cleanReport = {
        score: Number(evaluationResult.score) || 0,
        summary: String(evaluationResult.summary || "No summary available."),
        roadmap: String(evaluationResult.roadmap || "No roadmap available."),
        silent_killers: Array.isArray(evaluationResult.silent_killers) ? evaluationResult.silent_killers : [],
        question_reviews: Array.isArray(evaluationResult.question_reviews) ? evaluationResult.question_reviews : []
    };

    const integrityScore = Math.max(0, 100 - (violations * 10));

    // 4. SAVE WITH FLAGS AND EXACT TIME
    try {
      const fullPayload = {
        questions: finalAnswers,
        topic: config.field || "Resume Audit", 
        totalScore: cleanReport.score,
        overallFeedback: cleanReport.summary,
        roadmap: cleanReport.roadmap,
        question_reviews: cleanReport.question_reviews, 
        silent_killers: cleanReport.silent_killers,
        // 🔥 CRITICAL: Embed integrity and time for Dashboard History 🔥
        integrity: {
            count: violations,
            score: integrityScore
        },
        timeTaken: finalTimeTaken
      };

      console.log("💾 Saving Session to History:", fullPayload);
      await saveInterview(fullPayload);
      localStorage.removeItem(SESSION_KEY); 
      
      navigate('/resume-report', { state: { 
        report: JSON.parse(JSON.stringify(cleanReport)), 
        feedback: JSON.parse(JSON.stringify(cleanReport)), 
        answers: finalAnswers,
        integrity: { score: integrityScore, count: violations },
        timeTaken: finalTimeTaken
      }});

    } catch (err) {
      console.error("Critical Save/Nav Error:", err);
      // We do NOT turn off setProcessing here. We want to keep the user blocked.
      alert("Error saving session. Please check your connection.");
    }
  };

  // --- AUTO-RETRY ON RELOAD ---
  // If the user refreshed the page while "isSubmitted" was true,
  // this effect will automatically trigger the finish logic again.
  useEffect(() => {
    if (initialState.isSubmitted && !initialState.isDisqualified) {
        console.log("🔄 Detected interrupted submission. Retrying...");
        finishInterview(initialState.answers);
    }
  }, []);

  // --- RENDER HELPERS ---

  const renderCameraDeniedModal = () => (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl text-red-500 mb-6 animate-pulse"><i className="fa-solid fa-video-slash"></i></div>
      <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Camera Access Required</h2>
      <button onClick={() => window.location.reload()} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider">Reload Page</button>
    </div>
  );

  const renderDisclaimerModal = () => (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white max-w-2xl w-full max-h-[95vh] flex flex-col rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 relative">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-3 sm:mb-4 border-b-4 border-blue-600 pb-2 shrink-0">Resume Audit Guidelines</h2>
        <div className="space-y-3 mb-4 sm:mb-6 text-slate-700 text-sm sm:text-base leading-snug sm:leading-relaxed overflow-y-auto flex-1 pr-1 sm:pr-2">
           <ul className="list-none space-y-2 sm:space-y-3 bg-slate-50 p-3 sm:p-4 md:p-6 rounded-lg border border-slate-200">
             
             {/* NEW 30 MINUTE MANDATORY LIMIT RULE */}
             <li className="flex items-start gap-2 sm:gap-3 border-l-4 border-yellow-500 pl-2 sm:pl-3 bg-yellow-50 py-1 sm:py-2">
               <i className="fa-solid fa-stopwatch text-yellow-600 mt-1"></i>
               <span><strong>Strict 30-Minute Limit</strong>: The audit duration is exactly 30 minutes. If time elapses, the session will immediately terminate without extra chances.</span>
             </li>

             <li className="flex items-start gap-2 sm:gap-3"><i className="fa-solid fa-expand text-blue-600 mt-1"></i><span><strong>Full Screen Mode</strong> is mandatory. Exiting will trigger a violation flag.</span></li>
             <li className="flex items-start gap-2 sm:gap-3"><i className="fa-solid fa-eye text-blue-600 mt-1"></i><span><strong>Face Visibility</strong>: If your face is not in the frame for <strong>20 seconds</strong>, a flag will be triggered.<span className="block text-red-600 text-xs sm:text-sm mt-1 font-bold">⚠️ If this cycle repeats 3 times, you will be DISQUALIFIED immediately.</span></span></li>
             <li className="flex items-start gap-2 sm:gap-3"><i className="fa-solid fa-arrows-to-eye text-blue-600 mt-1"></i><span><strong>Head Movement</strong>: Looking Left, Right, Up, or Down away from the camera will <strong>trigger a flag immediately</strong>.</span></li>
             <li className="flex items-start gap-2 sm:gap-3"><i className="fa-solid fa-window-restore text-blue-600 mt-1"></i><span><strong>No Tab Switching</strong>. Moving to other tabs/windows is strictly prohibited.</span></li>
             <li className="flex items-start gap-2 sm:gap-3 text-red-600 font-bold border-l-4 border-red-500 pl-2 sm:pl-3 bg-red-50 py-1 sm:py-2"><i className="fa-solid fa-triangle-exclamation mt-1"></i><span>CRITICAL: If your Flag Count reaches {MAX_VIOLATIONS}, you will be IMMEDIATELY DISQUALIFIED.</span></li>
           </ul>
        </div>
        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer p-2 sm:p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200 shrink-0">
          <input type="checkbox" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 rounded focus:ring-blue-500" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)}/>
          <span className="font-bold text-sm sm:text-base text-slate-800">I have read the rules and agree to be proctored.</span>
        </label>
        <button onClick={handleStartInterview} disabled={!disclaimerAccepted} className={`w-full mt-3 sm:mt-4 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-xl uppercase tracking-wider transition-all shadow-xl shrink-0 ${disclaimerAccepted ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Start Assessment</button>
      </div>
    </div>
  );

  const renderDisqualifiedModal = () => (
    <div className="fixed inset-0 bg-red-900 z-[200] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-8xl text-white mb-6 animate-pulse"><i className="fa-solid fa-ban"></i></div>
      <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Disqualified</h1>
      <p className="text-red-200 text-2xl font-bold max-w-2xl leading-normal mb-8">
        Your session has been terminated due to suspicious activity, protocol violation, or time expiration.
      </p>
      <button onClick={() => terminateSession("Disqualified")} className="bg-white text-red-900 px-10 py-5 rounded-lg font-black text-xl uppercase tracking-wider hover:bg-gray-100 transition-transform hover:scale-105">Return to Home</button>
    </div>
  );

  const renderFullScreenModal = () => (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-100 z-[80] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl text-yellow-500 mb-6 animate-pulse"><i className="fa-solid fa-expand"></i></div>
      <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Full Screen Required</h2>
      <p className="text-gray-300 max-w-lg mb-8 text-lg">You have exited full screen. <span className="text-red-400 font-bold">Resume immediately or you will be disqualified.</span></p>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg justify-center">
        <button onClick={() => enterFullScreen()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg">Resume</button>
        <button onClick={() => terminateSession("Exited Full Screen")} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg">Exit</button>
      </div>
    </div>
  );

  const renderViolationModal = () => (
    <div className="fixed inset-0 bg-red-900 bg-opacity-95 backdrop-blur-xl z-[70] flex flex-col items-center justify-center p-6 text-center border-8 border-red-600">
      <div className="text-7xl text-white mb-6 animate-pulse"><i className="fa-solid fa-triangle-exclamation"></i></div>
      <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-4 tracking-tight">Rules Violated</h2>
      <p className="text-red-100 text-xl font-bold mb-8 max-w-2xl leading-relaxed">You attempted to leave the interview interface.</p>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg">
        <button onClick={() => terminateSession("Tab Switch")} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white px-6 py-4 rounded-lg border-2 border-gray-600 font-bold uppercase tracking-wider transition-all">Terminate</button>
        <button onClick={() => setShowViolationModal(false)} className="flex-1 bg-white text-red-700 hover:bg-gray-100 px-6 py-4 rounded-lg font-black border-4 border-red-700 uppercase tracking-wider transition-all shadow-2xl hover:scale-105">Continue</button>
      </div>
    </div>
  );

  const renderPrivacyShutterModal = () => {
    return null;
  };

  // --- PROCESSING OVERLAY ---
  const renderProcessingOverlay = () => (
    <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <i className="fa-solid fa-circle-notch animate-spin text-7xl text-white relative z-10"></i>
        </div>
        <h2 className="text-white text-4xl font-black uppercase tracking-widest animate-pulse">
            Analysis in Progress
        </h2>
        <p className="text-blue-300 mt-4 text-lg font-mono">Generating Resume Audit Report...</p>
        <p className="text-gray-400 mt-2 text-sm font-bold">Please do not close this window.</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 bg-slate-50 relative overflow-x-hidden" onClick={() => { if(!isSubmitted) new Audio(BEEP_URL).play().catch(()=>{}) }}>
      
      {/* 0. PROCESSING OVERLAY */}
      {processing && renderProcessingOverlay()}
      
      {isDisqualified && renderDisqualifiedModal()}
      
      {!hasStarted && !isDisqualified && !isSubmitted && (
         <>
            {cameraStatus === 'checking' && <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center text-white font-bold text-xl"><i className="fa-solid fa-spinner animate-spin mr-3"></i> Checking System...</div>}
            {cameraStatus === 'denied' && renderCameraDeniedModal()}
            {cameraStatus === 'granted' && renderDisclaimerModal()}
         </>
       )}

      {/* ONLY SHOW MODALS IF NOT SUBMITTED */}
      {hasStarted && !isDisqualified && !isSubmitted && showFullScreenExitModal && renderFullScreenModal()}
      {hasStarted && !isDisqualified && !isSubmitted && showViolationModal && renderViolationModal()}
      {hasStarted && !isDisqualified && !isSubmitted && showPrivacyShutterModal && renderPrivacyShutterModal()}
      
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center mb-6 md:mb-8 gap-4 px-1 shrink-0">
        <div>
           <h2 className="font-black text-2xl md:text-3xl uppercase text-slate-800 tracking-tight">RESUME <span className="text-blue-600">//</span> AUDIT</h2>
           <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
             <p className="font-mono text-xs md:text-sm text-gray-400 font-bold uppercase">Field: {config.field}</p>
             <span className="bg-red-100 text-red-600 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded border border-red-200">⚠️ {violations} FLAGS</span>
             {/* ⏰ LIVE COUNTDOWN TIMER */}
             {hasStarted && startTime && (
               <span className="bg-slate-800 text-white text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                 <i className="fa-regular fa-clock"></i> 
                 {Math.floor(timeLeft / 60000).toString().padStart(2, '0')}:
                 {Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0')}
               </span>
             )}
           </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
           <div className="font-mono font-black text-white bg-slate-900 px-4 py-2 md:px-5 md:py-3 rounded shadow-lg text-sm md:text-lg">{currIndex + 1} <span className="text-gray-500">/</span> {questions.length}</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col lg:flex-row gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
        {/* LEFT: WEBCAM */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
          <div className="card-panel p-2 shadow-xl border-slate-200 bg-white rounded-lg relative transition-all duration-300 z-0">
              <WebcamFeed onViolation={handleViolation} />
              {!isSubmitted && <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded animate-pulse font-bold">REC</div>}
          </div>
          <div className="card-panel p-6 md:p-8 border-l-4 border-blue-600 bg-white shadow-lg rounded-r-lg">
            <h3 className="font-mono text-xs font-bold text-blue-500 uppercase mb-3 md:mb-4 flex items-center gap-2"><i className="fa-solid fa-terminal"></i> Interview Query</h3>
            <p className="text-xl md:text-2xl font-bold text-slate-900 leading-snug break-words">{questions[currIndex]}</p>
          </div>
        </div>

        {/* RIGHT: ANSWER TERMINAL */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="card-panel flex flex-col p-0 relative overflow-hidden shadow-2xl border-0 bg-white rounded-lg min-h-[400px] lg:min-h-[600px] h-full">
            <div className="bg-slate-100 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0">
               <span className="text-xs font-bold text-gray-500 uppercase">Response Terminal</span>
               <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
            </div>
            <div className="flex-1 relative">
               <textarea
                 className="w-full h-full min-h-[300px] lg:min-h-[450px] p-6 md:p-8 border-none outline-none resize-none text-lg md:text-xl font-mono font-bold text-slate-900 leading-relaxed bg-transparent focus:bg-slate-50 transition-colors pb-32"
                 placeholder="> Explain your approach..."
                 value={currentAnswer}
                 onChange={(e) => !isSubmitted && setCurrentAnswer(e.target.value)}
                 spellCheck="false"
                 disabled={isSubmitted}
               />
               <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
                 
                 {/* MIC BUTTON */}
                 <button onClick={toggleMic} disabled={isSubmitted} className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border-2 ${isListening ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-slate-200 text-slate-500 hover:border-slate-400'} ${isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}>
                   <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i> {isListening ? "Listening..." : "Dictate Answer"}
                 </button>
                 
                 {/* NAVIGATION BUTTONS */}
                 <div className="flex gap-3 w-full sm:w-auto">
                   {/* PREVIOUS BUTTON */}
                   <button 
                       onClick={handlePrevious}
                       disabled={currIndex === 0 || processing || isSubmitted}
                       className="flex-1 sm:flex-none btn px-6 py-3 shadow-sm hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-300 text-slate-700 rounded-lg font-bold flex justify-center items-center"
                   >
                        <i className="fa-solid fa-arrow-left mr-2"></i> PREV
                   </button>

                   {/* NEXT / FINALIZE BUTTON */}
                   <button 
                       onClick={handleNext} 
                       disabled={processing || isSubmitted} 
                       className="flex-1 sm:flex-none btn btn-primary px-8 md:px-10 py-3 md:py-4 shadow-blue hover:shadow-xl transition-all disabled:opacity-50 bg-slate-900 text-white rounded-lg font-bold flex justify-center items-center"
                   >
                       {processing ? (
                           <span><i className="fa-solid fa-cog animate-spin"></i> PROCESSING</span>
                       ) : (
                           <span>{currIndex === questions.length - 1 ? "FINALIZE" : "NEXT"} <i className="fa-solid fa-arrow-right"></i></span>
                       )}
                   </button>
                 </div>

               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeInterview;