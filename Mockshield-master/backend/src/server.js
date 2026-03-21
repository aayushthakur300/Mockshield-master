// // const express = require('express');
// // const { connectDB } = require('./config/db');
// // const cors = require('cors');
// // const errorLogger = require('./middleware/errorLogger'); // Import
// // require('dotenv').config();

// // const app = express();

// // connectDB();

// // app.use(express.json());
// // app.use(cors());

// // // Routes
// // app.use('/api/auth', require('./routes/auth.routes'));
// // app.use('/api/interview', require('./routes/interview.routes'));

// // // REGISTER SILENT KILLER (Must be last)
// // app.use(errorLogger);

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// //-----------------------------------------------------------------------------------------------
// const express = require('express');
// const { connectDB } = require('./config/db');
// const cors = require('cors');
// const errorLogger = require('./middleware/errorLogger');
// require('dotenv').config();

// const app = express();

// // 1. Connect to Database
// connectDB();

// // 2. Body Parser Middleware
// app.use(express.json());

// // 3. Strict CORS Configuration (Vercel <-> Render)
// app.use(cors({
//   origin: [
//     'https://mockshield-20.vercel.app', // <-- YOUR EXACT VERCEL URL
//     'http://localhost:5173',         // Local Vite dev
//     'http://localhost:3000'          // Local standard React
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true                  // Required for auth tokens/cookies
// }));

// // 4. Health Check Route (Fixes the "Cannot GET /" error)
// app.get('/', (req, res) => {
//   res.send('Mockshield Node API is running! 🚀');
// });

// // 5. Routes
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/interview', require('./routes/interview.routes'));

// // 6. REGISTER SILENT KILLER (Must be last)
// app.use(errorLogger);

// // 7. Start Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//--------------------------------------------------------------------------------------------------------
const express = require('express');
const { connectDB } = require('./config/db');
const cors = require('cors');
const errorLogger = require('./middleware/errorLogger');
require('dotenv').config();

// 1. 🔥 CRITICAL: Load the Interview model immediately
// This ensures Sequelize knows the table structure before we run connectDB()
require('./models/Interview');

const app = express();

// 2. Connect to Neon PostgreSQL
// This will run 'sequelize.sync({ alter: true })' from your config/db.js
connectDB();

// 3. Body Parser Middleware
app.use(express.json());

// 4. Strict CORS Configuration
// This allows your local Vite (5173) and your production Vercel to talk to this server
app.use(cors({
  origin: [
    'https://mockshield-20.vercel.app', 
    'http://localhost:5173',         
    'http://localhost:3000'          
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true                  
}));

// 5. Health Check Route
// If you see this in your browser, your server is officially awake
app.get('/', (req, res) => {
  res.send('🚀 Mockshield Node API is Live and Connected to Neon!');
});

// 6. Register Interview Routes
// All database calls will start with /api/interview
app.use('/api/interview', require('./routes/interview.routes'));

// 7. Error Logger (The Silent Killer Detector)
// This MUST be the last middleware to catch any server crashes
app.use(errorLogger);

// 8. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`📡 API ENDPOINT: http://localhost:${PORT}/api/interview`);
    console.log(`--------------------------------------------------`);
});