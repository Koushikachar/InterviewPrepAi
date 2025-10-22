const Session = require("../models/Session");
const Question = require("../models/Question");

// ✅ Create a new session
exports.createSession = async (req, res) => {
  try {
    const { role, experiences, topicsToFocus, description, questions } =
      req.body;

    if (!role || !experiences || !topicsToFocus) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found in request",
      });
    }

    const userId = req.user._id;

    const session = await Session.create({
      user: userId,
      role,
      experiences,
      topicsToFocus,
      description,
    });

    let questionDocs = [];

    if (Array.isArray(questions) && questions.length > 0) {
      questionDocs = await Promise.all(
        questions.map(async (q) => {
          if (!q?.question || !q?.answer) return null;

          const question = await Question.create({
            session: session._id,
            question: q.question,
            answer: q.answer,
          });
          return question._id;
        })
      );

      session.questions = questionDocs.filter(Boolean);
      await session.save();
    }

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.error("❌ Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ✅ Get all sessions for a user
exports.getMySession = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("questions");
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Get my session error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ Get session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("questions")
      .exec();

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    console.error("Get session by ID error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Question.deleteMany({ session: session._id });

    // CHANGE THIS LINE:
    // await session.remove(); ❌ DEPRECATED
    await Session.findByIdAndDelete(session._id); // ✅ USE THIS INSTEAD

    // OR use:
    // await session.deleteOne(); // ✅ THIS ALSO WORKS

    res.status(200).json({ success: true, message: "Session deleted" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
