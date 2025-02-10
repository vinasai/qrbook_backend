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
// New encoded path route
router.get("/encoded/:encodedId", cardController.getCardByEncodedId);
// New route to update a card using id
router.put("/update/:id", upload.single("profileImage"), cardController.updateCardById);

module.exports = router;
