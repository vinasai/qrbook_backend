const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  id: {
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
    match: /^\+\d{1,4}\d{6,14}$/, // Updated regex for international format
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/, // Regex to validate email format
  },
  profileImage: {
    type: String,
    // This should be the filename or file reference in case of image storage
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
  temporaryCardExpiry: {
    type: Date,
    required: true,
    expires: "2d", // TTL index to auto-delete after 2 days
  },
  paymentConfirmed: {
    type: Boolean,
    default: false,
  },
  paymentExpiry: {
    type: Date,
    required: true,
    expires: "2d", // TTL index to auto-delete after 2 days if payment isn't confirmed
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the model from the schema
const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
