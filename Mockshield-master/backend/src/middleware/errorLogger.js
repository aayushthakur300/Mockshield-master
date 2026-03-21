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
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // 1. The "Silent Killer" Console Trace
  console.error('\n🛑 SILENT KILLER DETECTED 🛑');
  console.error(`⏰ Time: ${timestamp}`);
  console.error(`📍 Path: ${req.method} ${req.url}`);
  console.error(`⚠️ Error: ${err.message}`);
  console.error(`🔍 Stack Trace:\n${err.stack}\n`);
  console.error('--------------------------------------------------\n');

  // 2. Respond to Frontend so it doesn't hang
  res.status(500).json({ 
    success: false, 
    message: "Internal Server Error (Check Server Console)", 
    error: err.message 
  });
};

module.exports = errorLogger;