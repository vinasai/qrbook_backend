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

exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findOne({ id: req.params.id });
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new card
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
    // Generate custom card ID
    const id = await generateCardId(userId);

    // Extract website name from Link header
    const linkHeader = req.get("Link");
    if (!linkHeader) {
      return res.status(400).json({ message: "Link header is required" });
    }
    const websiteName = "QRbook.ca";

    // Generate business card link
    const businessCardLink = `https://${websiteName}/business-card/${id}`;

    // Generate temporary card link
    const temporaryCardLink = `https://${websiteName}/temporary-card/${id}`;

    // Set expiry dates
    const temporaryCardExpiry = new Date();
    temporaryCardExpiry.setDate(temporaryCardExpiry.getDate() + 2);
    const paymentExpiry = new Date();
    paymentExpiry.setDate(paymentExpiry.getDate() + 4);

    // Get uploaded image path
    const profileImage = req.file ? `/uploads/${req.file.filename}` : "";

    const newCard = new Card({
      id,
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
