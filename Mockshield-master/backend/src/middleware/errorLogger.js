// const errorLogger = (err, req, res, next) => {
//   const timestamp = new Date().toISOString();
  
//   // 1. The "Silent Killer" Console Trace
//   console.error('\n🛑 SILENT KILLER DETECTED 🛑');
//   console.error(`⏰ Time: ${timestamp}`);
//   console.error(`📍 Path: ${req.method} ${req.url}`);
//   console.error(`⚠️ Error: ${err.message}`);
//   console.error(`🔍 Stack Trace:\n${err.stack}\n`);
//   console.error('--------------------------------------------------\n');

//   // 2. Respond to Frontend so it doesn't hang
//   res.status(500).json({ 
//     success: false, 
//     message: "Internal Server Error (Check Server Console)", 
//     error: err.message 
//   });
// };

// module.exports = errorLogger;
//----------------------------------------------------------------------------------
/**
 * 🛡️ THE SILENT KILLER DETECTOR
 * This middleware catches any errors that happen during API calls
 * and prevents the server from crashing.
 */
const errorLogger = (err, req, res, next) => {
    // 1. Log the high-level details to the terminal
    console.error(`--------------------------------------------------`);
    console.error(`🚨 [SERVER ERROR] ${req.method} ${req.originalUrl}`);
    console.error(`📝 MESSAGE: ${err.message}`);
    
    // 2. Log the stack trace (Shows exactly which file and line broke)
    if (err.stack) {
        console.error(`🥞 STACK TRACE:`);
        console.error(err.stack);
    }
    console.error(`--------------------------------------------------`);

    // 3. Send a clean error response to the frontend
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        success: false,
        message: "Internal Server Error",
        // Only show the full error details if we are in development mode
        error: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong on the server."
    });
};

module.exports = errorLogger;