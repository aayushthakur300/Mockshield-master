// const express = require('express');
// const { connectDB } = require('./config/db');
// const cors = require('cors');
// const errorLogger = require('./middleware/errorLogger'); // Import
// require('dotenv').config();

// const app = express();

// connectDB();

// app.use(express.json());
// app.use(cors());

// // Routes
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/interview', require('./routes/interview.routes'));

// // REGISTER SILENT KILLER (Must be last)
// app.use(errorLogger);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//-----------------------------------------------------------------------------------------------
const express = require('express');
const { connectDB } = require('./config/db');
const cors = require('cors');
const errorLogger = require('./middleware/errorLogger');
require('dotenv').config();

const app = express();

// 1. Connect to Database
connectDB();

// 2. Body Parser Middleware
app.use(express.json());

// 3. Strict CORS Configuration (Vercel <-> Render)
app.use(cors({
  origin: [
    'https://mockshield.vercel.app', // <-- YOUR EXACT VERCEL URL
    'http://localhost:5173',         // Local Vite dev
    'http://localhost:3000'          // Local standard React
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true                  // Required for auth tokens/cookies
}));

// 4. Health Check Route (Fixes the "Cannot GET /" error)
app.get('/', (req, res) => {
  res.send('Mockshield Node API is running! 🚀');
});

// 5. Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/interview', require('./routes/interview.routes'));

// 6. REGISTER SILENT KILLER (Must be last)
app.use(errorLogger);

// 7. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));