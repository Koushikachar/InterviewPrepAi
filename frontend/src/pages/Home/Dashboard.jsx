import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LuPlus } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPath";
import { CARD_BG } from "../../utils/data";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import SummaryCard from "../../components/Cards/SummaryCard";
import Modal from "../../components/Modal";
import CreateSession from "./CreateSession";
import toast from "react-hot-toast";
import DeleteAlertContent from "../../components/loader/DeleteAlertContent";

const Dashboard = () => {
  const navigate = useNavigate();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [session, setSession] = useState([]);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    open: false,
    data: null,
  });

  const fetchAllSession = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.SESSION.GET_ALL);
      console.log("Sessions:", response.data);
      // Adjust this based on what backend returns
      const sessions = Array.isArray(response.data)
        ? response.data
        : response.data.sessions || [];
      setSession(sessions);
    } catch (error) {
      console.error("Error fetching session data:", error);
    }
  };
  const deleteSession = async (sessionData) => {
    console.log("🔴 Delete clicked, session data:", sessionData);
    console.log("🔴 Session ID:", sessionData?._id);

    if (!sessionData?._id) {
      toast.error("Invalid session ID");
      return;
    }

    try {
      await axiosInstance.delete(API_PATHS.SESSION.DELETE(sessionData?._id));

      toast.success("Session Deleted Successfully");
      setOpenDeleteAlert({ open: false, data: null });
      fetchAllSession();
    } catch (error) {
      console.error("❌ Error deleting session:", error);
      console.error("❌ Error response:", error.response);
      toast.error(error.response?.data?.message || "Failed to delete session");
    }
  };

  useEffect(() => {
    fetchAllSession();
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto pt-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-7 pt-1 pb-6 px-4 md:px-0">
          {session?.length > 0 ? (
            session.map((data, index) => (
              <SummaryCard
                key={data?._id}
                colors={CARD_BG[index % CARD_BG.length]}
                role={data?.role || ""}
                topicsToFocus={data?.topicsToFocus || ""}
                experiences={data?.experiences || ""}
                questions={data?.questions?.length || 0}
                description={data?.description || ""}
                lastUpdated={
                  data?.updatedAt
                    ? moment(data?.updatedAt).format("DD MMM YYYY")
                    : ""
                }
                onSelect={() => navigate(`/interview-prep/${data?._id}`)}
                onDelete={() => setOpenDeleteAlert({ open: true, data })}
              />
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-3">
              No sessions available.
            </p>
          )}
        </div>

        <button
          className="h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF9324] to-[#e99a4b] text-sm font-semibold text-white px-7 py-2.5 rounded-full hover:bg-black hover:text-white transition-colors cursor-pointer shadow-lg fixed bottom-10 right-10"
          onClick={() => setOpenCreateModal(true)}
        >
          <LuPlus className="text-2xl text-white" />
          Add New
        </button>
      </div>
      <Modal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        hideHeader
      >
        <div>
          <CreateSession />
        </div>
      </Modal>
      <Modal
        isOpen={openDeleteAlert?.open}
        onClose={() => {
          setOpenDeleteAlert({ open: false, data: null });
        }}
        title="Delete Alert"
      >
        <div className="w-[30vw]">
          <DeleteAlertContent
            content="Are you sure you want to delete this session details?"
            onDelete={() => deleteSession(openDeleteAlert.data)}
            onCancel={() => setOpenDeleteAlert({ open: false, data: null })}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Dashboard;
