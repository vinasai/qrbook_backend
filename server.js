const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const userRoutes = require("./routes/userRoutes");
const cardRoutes = require("./routes/cardRoutes");

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Specify the allowed origin for the frontend
    credentials: true, // Allow credentials (cookies, etc.)
  })
);

app.use(express.json()); // Allows express to parse JSON request bodies

app.use("/api", userRoutes); // User routes for handling user-related APIs
app.use("/api/cards", cardRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve images from uploads folder
