// module.exports = function(req, res, next) {
//   // --- BYPASS MODE ---
  
//   // We manually assign a Fake User ID so the database knows who to save the interview for.
//   // This assumes you have at least one user in your database (User ID 1).
//   // If your DB is empty, run a manual INSERT in pgAdmin first.
//   req.user = { id: 1 }; 
  
//   // Skip the token check and proceed immediately to the next function
//   next();
// };
//-----------------------------------------------------------------------------------------------------------
module.exports = function(req, res, next) {
  // --- BYPASS MODE ---
  
  // Mongoose requires a valid 24-character hex string for ObjectIds.
  // This fake ID prevents Mongoose 'CastError' crashes.
  req.user = { id: '000000000000000000000001' }; 
  
  // Skip the token check and proceed immediately to the next function
  next();
};