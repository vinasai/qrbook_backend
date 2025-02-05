const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");
const upload = require("../config/uploadConfig"); // Use the new multer config

router.get("/", cardController.getCards);
router.get("/:id", cardController.getCardById); // Update this line
router.post(
  "/",
  cardController.upload, // This should be the modified middleware
  cardController.createCard
);
router.put("/:id", upload.single("profileImage"), cardController.updateCard);
router.delete("/:id", cardController.deleteCard);
router.get("/image/:filename", cardController.getImage);
router.get("/user/:userId", cardController.getCardsByUserId);

module.exports = router;
