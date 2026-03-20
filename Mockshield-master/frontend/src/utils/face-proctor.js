import * as faceapi from 'face-api.js';

let isModelLoaded = false;

/**
 * 1. Load the necessary FaceAPI models.
 * Ensure you have the 'weights' files inside your public/models folder.
 */
export async function loadProctoringModels() {
  try {
    const MODEL_URL = '/models'; // This path must exist in your public folder
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    ]);

    isModelLoaded = true;
    console.log("✅ FaceAPI Proctoring Models Loaded Successfully");
  } catch (err) {
    console.error("❌ Failed to load FaceAPI models. Check /public/models folder.", err);
  }
}

/**
 * 2. The Main Detection Function.
 * Call this inside a loop (e.g., setInterval) from your React component.
 * * @param {HTMLVideoElement} videoElement - The webcam video tag
 * @param {Function} onViolation - Callback function to trigger flags (e.g., handleViolation)
 */
export async function detectProctoring(videoElement, onViolation) {
  // Safety checks: If model isn't ready or video is paused, stop.
  if (!isModelLoaded || !videoElement || videoElement.paused || videoElement.ended) return;

  // Use TinyFaceDetector for better performance on laptops
  const options = new faceapi.TinyFaceDetectorOptions();
  
  // Detect a single face and get the 68 distinct landmarks
  const detection = await faceapi.detectSingleFace(videoElement, options).withFaceLandmarks();

  if (detection) {
    const landmarks = detection.landmarks;
    
    // Key landmarks for Head Pose Estimation
    const nose = landmarks.getNose()[3];     // Tip of nose (Point 30)
    const jaw = landmarks.getJawOutline();   // Jaw line array (0-16)
    
    const leftJaw = jaw[0];   // Left Ear area (Point 0)
    const rightJaw = jaw[16]; // Right Ear area (Point 16)
    const chin = jaw[8];      // Bottom of chin (Point 8)

    // --- MATH SECTION: CALCULATE HEAD TURNS ---
    
    // 1. HORIZONTAL CHECK (Yaw - Looking Left/Right)
    // We measure the distance from the nose to the left ear vs. the right ear.
    const distToLeft = nose.x - leftJaw.x;
    const distToRight = rightJaw.x - nose.x;
    
    // Logic: If the nose is significantly closer to one ear, the head is turned.
    // The multiplier '0.4' is the sensitivity. Higher = harder to trigger.
    if (distToRight < distToLeft * 0.4) {
      onViolation("Looking RIGHT");
      return;
    }
    if (distToLeft < distToRight * 0.4) {
      onViolation("Looking LEFT");
      return;
    }

    // 2. VERTICAL CHECK (Pitch - Looking Up/Down)
    // We compare the nose height relative to the total face height (ear to chin).
    
    // Height from ear-line to chin
    const faceHeight = chin.y - leftJaw.y; 
    // Height from ear-line to nose
    const noseHeight = nose.y - leftJaw.y;
    
    // Calculate ratio: Where is the nose vertically?
    const ratio = noseHeight / faceHeight;

    // Thresholds determined by testing:
    // < 0.25 means the nose is very high up (Looking UP)
    // > 0.65 means the nose is very low down (Looking DOWN)
    if (ratio < 0.25) { 
        onViolation("Looking UP"); 
        return;
    } 
    if (ratio > 0.65) { 
        onViolation("Looking DOWN"); 
        return;
    }

  } else {
    // Optional: Uncomment this if you want to flag when they leave the camera view entirely.
    // onViolation("Face Not Visible"); 
  }
}