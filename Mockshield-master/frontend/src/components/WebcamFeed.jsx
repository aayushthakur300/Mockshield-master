

//---------------------------------------------------------------------------------------------
// 13 feb  WebcamFeed.jsx:437

// Detection Loop Error TypeError: Cannot read properties of null (reading 'videoWidth') at WebcamFeed.jsx:358:59

// (anonymous)@WebcamFeed.jsx:437 import React, { useRef, useEffect, useState } from 'react';

// import * as faceapi from 'face-api.js';
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const WebcamFeed = ({ onViolation }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [status, setStatus] = useState("Initializing Security...");
  
  // --- BRUTE FORCE TIMERS (Refs avoid re-render lag) ---
  const lastFaceSeenTime = useRef(Date.now()); 
  const isProcessingRef = useRef(false);

  // --- AUDIO BEEP SYSTEM ---
  const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sawtooth'; 
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        setTimeout(() => { oscillator.stop(); audioCtx.close(); }, 300);
    } catch (e) {
        console.warn("Audio blocked.");
    }
  };

  // 1. Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; 
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        setModelLoaded(true);
      } catch (err) {
        console.error("AI Model Error:", err);
        setStatus("System Failed");
      }
    };
    loadModels();
  }, []);

  // 2. Camera Stream
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("✅ Active");
      } catch (err) {
        setStatus("Camera Access Denied");
      }
    };
    startVideo();
  }, []);

  // 3. The Detection Loop
  useEffect(() => {
    if (!modelLoaded) return;

    const intervalId = setInterval(async () => {
        // Initial check before async operation
        if (!videoRef.current || !canvasRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) return;
        
        // Prevent overlapping async calls
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            const detections = await faceapi.detectAllFaces(
                videoRef.current, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks();

            // --- MANDATORY FIX START: Re-check refs after await ---
            // The component might have unmounted during the await, making refs null.
            if (!videoRef.current || !canvasRef.current) {
                isProcessingRef.current = false;
                return;
            }
            // --- MANDATORY FIX END ---

            // Prepare Canvas
            const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
            
            // Ensure video has dimensions before matching
            if (displaySize.width === 0 || displaySize.height === 0) {
                isProcessingRef.current = false;
                return;
            }

            faceapi.matchDimensions(canvasRef.current, displaySize);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (detections.length > 0) {
                // --- CASE: FACE DETECTED ---
                lastFaceSeenTime.current = Date.now(); // RESET TIMER CONSTANTLY
                
                const landmarks = detections[0].landmarks;
                const nose = landmarks.getNose()[3];
                
                // --- A. Horizontal (Yaw) Logic ---
                const leftJaw = landmarks.getJawOutline()[0];
                const rightJaw = landmarks.getJawOutline()[16];
                const distToLeft = Math.abs(nose.x - leftJaw.x);
                const distToRight = Math.abs(rightJaw.x - nose.x);
                const horizontalRatio = distToLeft / distToRight;

                // --- B. Vertical (Pitch) Logic ---
                const leftEye = landmarks.getLeftEye()[0];
                const rightEye = landmarks.getRightEye()[3];
                const chin = landmarks.getJawOutline()[8];
                const eyesY = (leftEye.y + rightEye.y) / 2;
                const verticalRatio = Math.abs(nose.y - eyesY) / Math.abs(chin.y - nose.y);

                let poseMsg = "";
                
                // Check Horizontal
                if (horizontalRatio < 0.5) poseMsg = "Looking RIGHT ➡️";
                else if (horizontalRatio > 2.0) poseMsg = "Looking LEFT ⬅️";
                
                // Check Vertical (Prioritize if horizontal is okay)
                if (!poseMsg) {
                    if (verticalRatio < 0.35) poseMsg = "Looking UP ⬆️";
                    else if (verticalRatio > 0.75) poseMsg = "Looking DOWN ⬇️";
                }
                
                if (poseMsg) {
                    setStatus(`⚠️ ${poseMsg}`);
                    playBeep();
                    if(onViolation) onViolation(poseMsg);
                    
                    // Visual Red Border
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 5;
                    ctx.strokeRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                } else {
                    setStatus("✅ Focus Good");
                }

            } else {
                // --- CASE: NO FACE ---
                const now = Date.now();
                const timeMissing = now - lastFaceSeenTime.current;

                if (timeMissing < 20000) {
                    // Counting down...
                    const secondsLeft = Math.ceil((20000 - timeMissing) / 1000);
                    setStatus(`⚠️ RETURN TO FRAME (${secondsLeft}s)`);
                    
                    // Visual Warning on Canvas
                    ctx.fillStyle = "red";
                    ctx.font = "bold 30px Arial";
                    ctx.fillText(`WARNING: ${secondsLeft}s`, 50, 50);
                } else {
                    // --- TRIGGER VIOLATION (20s reached) ---
                    // 1. Report to parent
                    if(onViolation) onViolation("FACE_MISSING_20S");
                    
                    // 2. Play Sound
                    playBeep();
                    
                    // 3. FORCE RESET TIMER (To start next cycle immediately)
                    lastFaceSeenTime.current = Date.now(); 
                    console.log("Cycle Complete. Timer Reset.");
                }
            }
        } catch (e) {
            console.error("Detection Loop Error", e);
        }

        isProcessingRef.current = false;
    }, 500); // Check every 500ms

    return () => clearInterval(intervalId);
  }, [modelLoaded, onViolation]);

  return (
    <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border-4 border-slate-700">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className="w-full h-full object-cover transform scale-x-[-1]" 
      />
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" 
      />
      <div className="absolute top-2 left-2 px-3 py-1 bg-black/80 text-white text-xs font-mono rounded z-50">
         {status}
      </div>
    </div>
  );
};

export default WebcamFeed; 