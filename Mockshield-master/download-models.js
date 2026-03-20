const fs = require('fs');
const https = require('https');
const path = require('path');

// Configuration
const BASE_URL = "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/";
const TARGET_DIR = path.join(__dirname, 'frontend', 'public', 'models');

const FILES = [
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)){
    console.log(`Creating directory: ${TARGET_DIR}`);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Download Function
const downloadFile = (filename) => {
    const fileUrl = BASE_URL + filename;
    const filePath = path.join(TARGET_DIR, filename);
    const file = fs.createWriteStream(filePath);

    console.log(`⬇️  Downloading: ${filename}...`);

    https.get(fileUrl, (response) => {
        // Handle Redirects (GitHub often redirects raw content)
        if (response.statusCode === 302 || response.statusCode === 301) {
            https.get(response.headers.location, (redirectResponse) => {
                redirectResponse.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Saved: ${filename}`);
                });
            });
        } else {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Saved: ${filename}`);
            });
        }
    }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        console.error(`❌ Error downloading ${filename}: ${err.message}`);
    });
};

// Execute
console.log("🚀 Starting Model Download...");
FILES.forEach(file => downloadFile(file));