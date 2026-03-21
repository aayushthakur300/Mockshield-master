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

// POST: Save a new interview (NO AUTH REQUIRED)
router.post('/', async (req, res) => {
  try {
    const { topic, questions, totalScore, overallFeedback } = req.body;
    
    const interview = await Interview.create({
      topic: topic || 'General',
      questions_data: questions, 
      total_score: totalScore,
      overall_feedback: overallFeedback
    });

    res.json(interview);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET: Fetch all interviews for the dashboard (NO AUTH REQUIRED)
router.get('/', async (req, res) => {
  try {
    const interviews = await Interview.findAll({ 
        order: [['createdAt', 'DESC']]
    });
    res.json(interviews);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE: Single record
router.delete('/:id', async (req, res) => {
  try {
    await Interview.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Session deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE: Clear all
router.delete('/clear', async (req, res) => {
  try {
    // Truncate empties the entire table
    await Interview.destroy({ where: {}, truncate: true });
    res.json({ msg: 'All sessions cleared' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;