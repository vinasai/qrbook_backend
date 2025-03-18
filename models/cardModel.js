const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  encodedPath: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
  },
  pronouns: {
    type: String,
    required: true,
  },
  jobPosition: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    match: /^\+\d{1,4}\s\d{2}-\d{3}-\d{4}$/, // Updated regex for format: +XX XX-XXX-XXXX
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/, // Regex to validate email format
  },
  website: {
    type: String,
  },
  address: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  description: {
    type: String,
  },
  socialMedia: [
    {
      platform: {
        type: String,
      },
      url: {
        type: String,
        match: /^(https?:\/\/)?[\w.-]+(\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/, // Valid URL regex that accepts URLs with or without http/https
      },
    },
  ],
  businessCardLink: {
    type: String,
    required: true,
  },
  temporaryCardLink: {
    type: String,
    required: true,
  },
  paymentConfirmed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Create the model from the schema
const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
