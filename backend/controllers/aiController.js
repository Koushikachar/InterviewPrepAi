const { GoogleGenAI } = require("@google/genai");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// -------------------------
// Generate Interview Questions
// -------------------------
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experiences, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experiences || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(
      role,
      experiences,
      topicsToFocus,
      numberOfQuestions
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    // Safely access model output text
    const rawText = response.text;

    // Clean markdown formatting
    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    // Parse JSON safely
    const data = JSON.parse(cleanedText);

    res.status(200).json({
      success: true,
      message: "Interview questions generated successfully",
      data,
    });
  } catch (error) {
    console.error("❌ Error generating interview questions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

// -------------------------
// Generate Concept Explanation
// -------------------------
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res
        .status(400)
        .json({ message: "Missing required field: question" });
    }

    const prompt = conceptExplainPrompt(question);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const rawText = response.text;

    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const data = JSON.parse(cleanedText);

    res.status(200).json({
      success: true,
      message: "Concept explanation generated successfully",
      ...data,
    });
  } catch (error) {
    console.error("❌ Error generating concept explanation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};
module.exports = { generateConceptExplanation, generateInterviewQuestions };
