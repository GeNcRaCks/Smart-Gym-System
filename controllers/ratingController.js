// /controllers/ratingController.js
// Import the Rating model exported from /models/Rating.js
const Rating = require('../models/Rating');

if (!Rating) {
  console.error('Rating model not loaded');
}

console.log('Rating model:', typeof Rating);

async function createRating(req, res) {
  try {
    const rating = await Rating.create({
      score: req.body.score,
      comment: req.body.comment,
      user: req.body.userId
    });

    return res.status(201).json(rating);
  } catch (error) {
    console.error('createRating error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createRating
};
