const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ====================
// ✅ Register Controller - FIXED
// ====================
const registerUser = async (req, res) => {
  try {
    console.log("📝 Register request body:", req.body);

    const { name, email, password, profileImageUrl } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        message: "All fields are required",
        received: { name: !!name, email: !!email, password: !!password },
      });
    }

    // Trim and validate name
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      console.log("❌ Name too short:", trimmedName);
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters long" });
    }

    // Password length validation
    if (password.length < 6) {
      console.log("❌ Password too short");
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log("✅ Normalized email:", normalizedEmail);

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      console.log("❌ User already exists:", normalizedEmail);
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      profileImageUrl: profileImageUrl || "",
    });

    console.log("✅ User created successfully:", user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Register error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// ====================
// ✅ Login Controller
// ====================
const loginUser = async (req, res) => {
  try {
    console.log("🔐 Login attempt for:", req.body.email);

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("❌ User not found:", normalizedEmail);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", normalizedEmail);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("✅ Login successful:", normalizedEmail);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

// ====================
// ✅ Get User Profile
// ====================
const getUserprofile = async (req, res) => {
  try {
    console.log("👤 Getting profile for user:", req.user?.id || req.user?._id);

    // Make sure your auth middleware sets req.user._id or req.user.id
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Profile retrieved:", user.email);

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      message: "Server error retrieving profile",
      error: error.message,
    });
  }
};

module.exports = { registerUser, loginUser, getUserprofile };
