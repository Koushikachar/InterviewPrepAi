import { useContext } from "react";
import { UserContext } from "../../context/useContext";
import NavBar from "./NavBar";

const DashboardLayout = ({ children }) => {
  const { user } = useContext(UserContext);
  return (
    <div>
      <NavBar />
      {user && <div>{children}</div>}
    </div>
  );
};

export default DashboardLayout;
