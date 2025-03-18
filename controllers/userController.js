const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

// Generate a custom userId (if necessary)
const generateUserId = async () => {
  const userCount = await User.countDocuments();
  return `User${101 + userCount}`;
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendOTPByEmail = async (email, otp) => {
  /*
  // Ethereal Email Configuration (for testing)
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.TEMP_EMAIL_USER,
      pass: process.env.TEMP_EMAIL_PASS
    }
  });

  */

  /* Real Gmail SMTP Configuration */
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use App Password for better security
    }
  });
  

  const mailOptions = {
    from: process.env.EMAIL_USER, // Change to process.env.EMAIL_USER when using Gmail
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If you didn't request this password reset, please ignore this email.
        </p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  return info;
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

// Change user password
exports.changePassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  // Validate newPassword presence
  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password - send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    await user.save();

    await sendOTPByEmail(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP and reset password
exports.verifyOTPAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};