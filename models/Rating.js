// /models/Rating.js
// Define and export the Rating model using Mongoose.
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RatingSchema = new Schema({
  score: { type: Number, required: true },
  comment: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create the Mongoose model for ratings
const Rating = model('Rating', RatingSchema);

// Export the model so it can be imported in controllers
module.exports = Rating;
