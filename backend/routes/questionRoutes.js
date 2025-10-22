const express = require("express");
const {
  addQuestionToSession,
  togglePinQuestion,
  updateQuestionNote,
} = require("../controllers/questionController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addQuestionToSession);
router.post("/:id/pin", protect, togglePinQuestion);
router.post("/:id/note", protect, updateQuestionNote);

module.exports = router;
