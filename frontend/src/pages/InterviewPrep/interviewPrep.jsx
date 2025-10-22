import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import moment from "moment";

import SpinnerLoader from "../../components/loader/SpinnerLoader";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import RoleInfoHeader from "./components/RoleInfoHeader";
import QuestionCard from "../../components/Cards/QuestionCard";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPath";
import { LuCircleAlert, LuListCollapse } from "react-icons/lu";
import AIResponsePreview from "./components/AIResponsePreview";
import Drawer from "../../components/loader/Drawer";
import SkeletonLoader from "../../components/loader/SkeletonLoader";

const InterviewPrep = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [isUpdateLoader, setIsUpdateLoader] = useState(false);
  const [openLearnMoreDrawer, setOpenLearnMoreDrawer] = useState(false);

  // ✅ Fetch session details
  const fetchSessionDetailsById = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.SESSION.GET_ONE(sessionId)
      );
      if (response?.data?.session) {
        setSessionData(response.data.session);
      }
    } catch (error) {
      console.error("Fetch session error:", error);
      setErrorMsg("Failed to load session details.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Toggle question pin status
  const toggleQuestionPinStatus = async (questionId) => {
    try {
      setIsUpdateLoader(true);
      const response = await axiosInstance.post(
        API_PATHS.QUESTION.PIN(questionId)
      );

      if (response.data?.success && response.data?.question) {
        toast.success(response.data.message || "Pin status updated!");

        setSessionData((prev) => {
          const updatedQuestions = prev.questions.map((q) =>
            q._id === questionId ? { ...q, isPinned: !q.isPinned } : q
          );

          // Sort pinned first
          const sortedQuestions = [
            ...updatedQuestions.filter((q) => q.isPinned),
            ...updatedQuestions.filter((q) => !q.isPinned),
          ];

          return { ...prev, questions: sortedQuestions };
        });
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin status");
    } finally {
      setIsUpdateLoader(false);
    }
  };

  // ✅ Generate AI explanation
  const generateConceptExplanation = async (question) => {
    try {
      setErrorMsg("");
      setExplanation(null);
      setDrawerLoading(true);
      setOpenLearnMoreDrawer(true);

      const response = await axiosInstance.post(
        API_PATHS.AI.GENERATE_EXPLANATION,
        { question }
      );

      if (response.data) {
        setExplanation(response.data);
      }
    } catch (error) {
      console.error("AI explanation error:", error);
      setExplanation(null);
      setErrorMsg("Failed to generate explanation. Try again later.");
    } finally {
      setDrawerLoading(false);
    }
  };

  // ✅ Upload more questions using AI
  const uploadMoreQuestions = async () => {
    try {
      setIsUpdateLoader(true);
      setErrorMsg("");

      if (!sessionData?.role || !sessionData?.topicsToFocus) {
        toast.error("Missing session data (role or topics).");
        return;
      }

      // 1️⃣ Send to AI
      const aiPayload = {
        role: sessionData.role,
        experiences: sessionData.experiences,
        topicsToFocus: sessionData.topicsToFocus,
        numberOfQuestions: 10,
      };

      console.log("🔹 Sending AI payload:", aiPayload);

      const aiResponse = await axiosInstance.post(
        API_PATHS.AI.GENERATE_QUESTIONS,
        aiPayload
      );
      console.log("✅ AI Response:", aiResponse.data);

      let generatedQuestions =
        aiResponse.data?.questions || aiResponse.data?.data || aiResponse.data;

      if (!Array.isArray(generatedQuestions)) {
        generatedQuestions = [generatedQuestions];
      }

      // 2️⃣ Normalize questions
      const formattedQuestions = generatedQuestions.map((q) => {
        if (typeof q === "string") {
          return { question: q, answer: "" };
        } else if (q?.question && q?.answer) {
          return q;
        } else if (q?.question) {
          return { question: q.question, answer: "" };
        }
        return { question: JSON.stringify(q), answer: "" };
      });

      console.log("🧩 Final formatted questions:", formattedQuestions);

      // 3️⃣ Send to backend
      const response = await axiosInstance.post(
        API_PATHS.QUESTION.ADD_TO_SESSION,
        {
          sessionId,
          questions: formattedQuestions,
        }
      );

      console.log("🧾 Add-to-session response:", response.data);

      if (response.data?.success) {
        toast.success("Added more Q&A successfully!");
        await fetchSessionDetailsById();
      } else {
        throw new Error(response.data?.message || "Failed to add questions");
      }
    } catch (error) {
      console.error("❌ Error uploading questions:", error);
      console.error("❌ Response data:", error.response?.data);

      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong, please try again";
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setIsUpdateLoader(false);
    }
  };

  // ✅ Fetch data on mount
  useEffect(() => {
    if (sessionId) fetchSessionDetailsById();
  }, [sessionId]);

  return (
    <DashboardLayout>
      <RoleInfoHeader
        role={sessionData?.role || ""}
        topicsToFocus={sessionData?.topicsToFocus || ""}
        experiences={sessionData?.experiences || "-"}
        questions={sessionData?.questions?.length || "-"}
        description={sessionData?.description || ""}
        lastUpdated={
          sessionData?.updatedAt
            ? moment(sessionData.updatedAt).format("MMM D YYYY")
            : ""
        }
      />

      <div className="container mx-auto pt-4 px-4 md:px-0">
        <h2 className="text-lg font-semibold text-black">Interview Q & A</h2>

        <div className="grid grid-cols-12 gap-4 mt-5 mb-10">
          <div
            className={`col-span-12 ${
              openLearnMoreDrawer ? "md:col-span-7" : "md:col-span-8"
            }`}
          >
            <AnimatePresence>
              {sessionData?.questions?.map((data, index) => (
                <motion.div
                  key={data._id || index}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                    delay: index * 0.1,
                    damping: 15,
                  }}
                  layout
                  layoutId={`question-${data._id || index}`}
                >
                  <QuestionCard
                    question={data.question}
                    answer={data.answer}
                    isPinned={data.isPinned}
                    onTogglePin={() => toggleQuestionPinStatus(data._id)}
                    onLearnMore={() =>
                      generateConceptExplanation(data.question)
                    }
                  />
                  {!isLoading &&
                    sessionData?.questions?.length === index + 1 && (
                      <div className="flex items-center justify-center mt-5">
                        <button
                          className="flex items-center gap-3 text-sm text-white font-medium bg-black px-5 py-2 mr-2 rounded text-nowrap cursor-pointer"
                          disabled={isLoading || isUpdateLoader}
                          onClick={uploadMoreQuestions}
                        >
                          {isUpdateLoader ? (
                            <SpinnerLoader />
                          ) : (
                            <LuListCollapse className="text-lg" />
                          )}
                          Load More
                        </button>
                      </div>
                    )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <Drawer
          isOpen={openLearnMoreDrawer}
          onClose={() => setOpenLearnMoreDrawer(false)}
          title={!drawerLoading && explanation?.title}
        >
          {errorMsg && (
            <p className="flex gap-2 text-sm text-amber-600 font-medium">
              <LuCircleAlert className="mt-1" />
              {errorMsg}
            </p>
          )}
          {drawerLoading && <SkeletonLoader />}
          {!drawerLoading && explanation && (
            <AIResponsePreview content={explanation?.explanation} />
          )}
        </Drawer>
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
