const multer = require("multer");
const path = require("path");

// Define storage location and filename format
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in the "uploads" folder (create this folder if it doesn't exist)
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Set filename to be original name with a timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type, only JPEG, PNG, and JPG are allowed"),
      false
    );
  }
};

// Set up multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
