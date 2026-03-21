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
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied. Please log in.' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};