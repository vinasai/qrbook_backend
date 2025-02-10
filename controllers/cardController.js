const Card = require("../models/cardModel");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer Filter (Only Images Allowed)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

// Upload Middleware
const upload = multer({ storage, fileFilter });

// Generate a custom card ID
const generateCardId = async (userId) => {
  const cardCount = await Card.countDocuments({ userId });
  return `${userId}_${String(cardCount + 1).padStart(3, "0")}`;
};

// Function to decode encoded ID
const decodeId = (encodedId) => {
  let base64Str = encodedId
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padLength = (4 - (base64Str.length % 4)) % 4;
  base64Str += '='.repeat(padLength);

  return Buffer.from(base64Str, 'base64').toString('utf8');
};

// ✅ Get all cards with pagination
exports.getCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total number of documents
    const total = await Card.countDocuments();
    
    // Get paginated results with latest first
    const cards = await Card.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      cards,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all cards for a specific user
exports.getCardsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cards = await Card.find({ userId });
    if (cards.length === 0) {
      return res.status(404).json({ message: "No cards found for this user" });
    }
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get card by ID or encoded path
exports.getCardById = async (req, res) => {
  try {
    const { id } = req.params;
    let decodedId = id;

    try {
      // Attempt to decode the ID
      const decodedPath = decodeEncodedPath(id);
      decodedId = decodedPath.startsWith('/') ? decodedPath.slice(1) : decodedPath;
    } catch (error) {
      // If decoding fails, proceed with original ID
      console.log('Using original ID:', id);
    }

    const card = await Card.findOne({ id: decodedId });
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New controller for encoded paths
exports.getCardByEncodedId = async (req, res) => {
  try {
    const encodedId = req.params.encodedId;

    // Find by encodedPath field directly
    const card = await Card.findOne({ encodedPath: encodedId });
    
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Create a new card (updated with encoded path)
exports.createCard = async (req, res) => {
  const {
    userId,
    name,
    pronouns,
    jobPosition,
    mobileNumber,
    email,
    description,
    socialMedia,
  } = req.body;

  try {
    // Validate mobile number format
    const phoneRegex = /^\+\d{1,4}\d{6,14}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    // Generate ID WITHOUT leading slash
    const id = await generateCardId(userId);
    const encodedPath = Buffer.from(id)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Generate links with clean encoded ID
    const websiteName = "QRbook.ca";
    const businessCardLink = `https://${websiteName}/${encodedPath}`;
    const temporaryCardLink = `https://${websiteName}/temporary/${encodedPath}`;

    // Set expiry dates
    const temporaryCardExpiry = new Date();
    temporaryCardExpiry.setDate(temporaryCardExpiry.getDate() + 2);
    const paymentExpiry = new Date();
    paymentExpiry.setDate(paymentExpiry.getDate() + 4);

    // Get uploaded image path
    const profileImage = req.file ? `/uploads/${req.file.filename}` : "";

    // Store card with original ID and encoded path
    const newCard = new Card({
      id,
      encodedPath,
      userId,
      name,
      pronouns,
      jobPosition,
      mobileNumber,
      email,
      profileImage,
      description,
      socialMedia,
      businessCardLink,
      temporaryCardLink,
      temporaryCardExpiry,
      paymentExpiry,
    });

    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Update a card
exports.updateCard = async (req, res) => {
  const {
    name,
    pronouns,
    jobPosition,
    mobileNumber,
    email,
    description,
    socialMedia,
    paymentConfirmed,
  } = req.body;

  try {
    // Get uploaded image path
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedCard = await Card.findByIdAndUpdate(
      req.params.id,
      {
        name,
        pronouns,
        jobPosition,
        mobileNumber,
        email,
        profileImage,
        description,
        socialMedia,
        paymentConfirmed,
      },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.json(updatedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// New controller to update a card using id
exports.updateCardById = async (req, res) => {
  const {
    name,
    pronouns,
    jobPosition,
    mobileNumber,
    email,
    description,
    socialMedia,
    paymentConfirmed,
  } = req.body;

  try {
    // Get uploaded image path
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Parse socialMedia field as an array of objects if it is a valid JSON string
    let parsedSocialMedia = socialMedia;
    if (typeof socialMedia === 'string') {
      try {
        parsedSocialMedia = JSON.parse(socialMedia);
      } catch (error) {
        return res.status(400).json({ message: "Invalid socialMedia format" });
      }
    }

    const updatedCard = await Card.findOneAndUpdate(
      { id: req.params.id },
      {
        name,
        pronouns,
        jobPosition,
        mobileNumber,
        email,
        profileImage,
        description,
        socialMedia: parsedSocialMedia,
        paymentConfirmed,
      },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.json(updatedCard);
  } catch (error) {
    console.error("Error updating card:", error); // Log the error details
    res.status(400).json({ message: error.message });
  }
};

// ✅ Delete a card (also deletes image file)
exports.deleteCard = async (req, res) => {
  try {
    const deletedCard = await Card.findByIdAndDelete(req.params.id);
    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Delete the image file from uploads folder
    if (deletedCard.profileImage) {
      const imagePath = path.join(__dirname, "..", deletedCard.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: "Card deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete cards with expired payment dates and unconfirmed payments
exports.deleteExpiredUnpaidCards = async () => {
  try {
    const now = new Date();
    const expiredCards = await Card.find({
      paymentConfirmed: false,
      createdAt: { $lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
    });

    for (const card of expiredCards) {
      // Delete the image file from uploads folder
      if (card.profileImage) {
        const imagePath = path.join(__dirname, "..", card.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      await card.remove();
    }

    console.log(`Deleted ${expiredCards.length} expired unpaid cards.`);
  } catch (error) {
    console.error("Error deleting expired unpaid cards:", error);
  }
};

// ✅ Serve Images (No GridFS)
exports.getImage = async (req, res) => {
  try {
    const imagePath = path.join(
      __dirname,
      "..",
      "uploads",
      req.params.filename
    );

    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Multer Middleware Export
exports.upload = upload.single("profileImage"); // Changed from "image"
