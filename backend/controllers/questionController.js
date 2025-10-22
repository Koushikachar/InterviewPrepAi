const Question = require("../models/Question");
const Session = require("../models/Session");

// ✅ Add multiple questions to a session
exports.addQuestionToSession = async (req, res) => {
  try {
    const { sessionId, questions } = req.body;

    if (!sessionId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const createdQuestions = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer,
      }))
    );

    session.questions = session.questions || [];
    session.questions.push(...createdQuestions.map((q) => q._id));
    await session.save();

    res.status(201).json({
      success: true,
      message: "Questions added successfully",
      questions: createdQuestions,
    });
  } catch (error) {
    console.error("Error adding questions:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Toggle pinned status of a question
exports.togglePinQuestion = async (req, res) => {
  try {
    // ✅ Correct way to access the question ID from params

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // ✅ Toggle pin
    question.isPinned = !question.isPinned;
    await question.save();

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Error toggling pin:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Update note for a question
exports.updateQuestionNote = async (req, res) => {
  try {
    const { note } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.note = note || "";
    await question.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      question,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
