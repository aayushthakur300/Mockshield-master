const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');

router.post('/', auth, async (req, res) => {
  try {
    const { questions, totalScore, overallFeedback } = req.body;
    
    const interview = await Interview.create({
      userId: req.user.id,
      questions_data: questions, // Stores the full Q&A array as JSON
      total_score: totalScore,
      overall_feedback: overallFeedback
    });

    res.json(interview);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const interviews = await Interview.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
    });
    res.json(interviews);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;