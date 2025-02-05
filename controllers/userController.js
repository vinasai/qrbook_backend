const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Generate a custom userId (if necessary)
const generateUserId = async () => {
  const userCount = await User.countDocuments();
  return `User${101 + userCount}`;
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by userId
exports.getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register a new user
exports.registerUser = async (req, res) => {
  const { fullName, email, mobileNo, password } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate custom userId (optional)
    const userId = await generateUserId();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userId,
      fullName,
      email,
      mobileNo,
      password: hashedPassword,
      type: "user" // Automatically set type as "user" for normal registration
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create a new admin
exports.createAdmin = async (req, res) => {
  const { fullName, email, mobileNo, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      userId: new mongoose.Types.ObjectId().toString(),
      fullName,
      email,
      mobileNo,
      password: hashedPassword,
      type: "admin",
    });

    await newAdmin.save();
    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login user or admin
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.userId, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, email, mobileNo } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { fullName, email, mobileNo },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findOneAndDelete({ userId });
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all admins with pagination
exports.getAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Get total number of admin documents
    const total = await User.countDocuments({ type: "admin" });

    // Get paginated results with latest first
    const admins = await User.find({ type: "admin" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      admins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update admin details
exports.updateAdmin = async (req, res) => {
  const { userId } = req.params;
  const { fullName, email } = req.body;

  try {
    const updatedAdmin = await User.findOneAndUpdate(
      { userId },
      { fullName, email },
      { new: true } // Return the updated document
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(updatedAdmin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedAdmin = await User.findOneAndDelete({ userId, type: "admin" });
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all admins without pagination
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ type: "admin" }).sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};