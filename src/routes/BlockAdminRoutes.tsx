import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// For routes that must stay public for everyone (including logged-out
// visitors) but are still off-limits to an admin session specifically —
// browsing/discovery hubs like the community feed, not the USER-only
// features AuthProtectedRoutes already covers.
const BlockAdminRoutes = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default BlockAdminRoutes;
