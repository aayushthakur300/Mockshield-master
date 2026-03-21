// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth');
// const Interview = require('../models/Interview');

// router.post('/', auth, async (req, res) => {
//   try {
//     const { questions, totalScore, overallFeedback } = req.body;
    
//     const interview = await Interview.create({
//       userId: req.user.id,
//       questions_data: questions, // Stores the full Q&A array as JSON
//       total_score: totalScore,
//       overall_feedback: overallFeedback
//     });

//     res.json(interview);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server Error');
//   }
// });

// router.get('/', auth, async (req, res) => {
//   try {
//     const interviews = await Interview.findAll({ 
//         where: { userId: req.user.id },
//         order: [['createdAt', 'DESC']]
//     });
//     res.json(interviews);
//   } catch (err) {
//     res.status(500).send('Server Error');
//   }
// });

// module.exports = router;
//-----------------------------------------------------------
const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// @route   POST /api/interview
// @desc    Save a completed interview session
router.post('/', async (req, res) => {
  try {
    console.log("📥 RECEIVED DATA FROM FRONTEND:", req.body);

    const { topic, questions, totalScore, overallFeedback } = req.body;

    // Create a new record in Neon
    const interview = await Interview.create({
      topic: topic || 'General',
      questions_data: questions, // Mapping the 'questions' array to our DB column
      total_score: totalScore || 0,
      overall_feedback: overallFeedback || ''
    });

    console.log("✅ INTERVIEW SAVED TO NEON. ID:", interview.id);
    res.json(interview);
  } catch (err) {
    console.error("❌ SAVE ERROR:", err.message);
    res.status(500).json({ error: "Server Error: Could not save interview" });
  }
});

// @route   GET /api/interview
// @desc    Get all interviews for the Dashboard
router.get('/', async (req, res) => {
  try {
    const interviews = await Interview.findAll({ 
        order: [['createdAt', 'DESC']] // Newest first
    });

    // Format the data for the frontend Dashboard
    const formattedData = interviews.map(item => ({
        id: item.id,
        topic: item.topic,
        totalScore: item.total_score,
        overallFeedback: item.overall_feedback,
        questions: item.questions_data,
        createdAt: item.createdAt
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("❌ FETCH ERROR:", err.message);
    res.status(500).json({ error: "Server Error: Could not fetch dashboard data" });
  }
});

// @route   DELETE /api/interview/:id
// @desc    Delete a single interview session
router.delete('/:id', async (req, res) => {
  try {
    const result = await Interview.destroy({ where: { id: req.params.id } });
    if (result) {
        res.json({ msg: 'Session deleted successfully' });
    } else {
        res.status(404).json({ msg: 'Session not found' });
    }
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// @route   DELETE /api/interview/clear
// @desc    Wipe all history (Use with caution!)
router.delete('/clear', async (req, res) => {
  try {
    await Interview.destroy({ where: {}, truncate: true });
    res.json({ msg: 'All sessions cleared' });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;