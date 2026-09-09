import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type Props = {
  allowedRoles: String[];
};

const AuthProtectedRoutes = ({ allowedRoles }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.includes(user.role!)) {
    return <Outlet />;
  }

  // Admin accounts are purely operational — a USER-only route isn't an
  // error for them the way it is for a wrong-role USER, so send them back
  // to their own dashboard instead of a dead-end /unauthorized page.
  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/unauthorized" state={{ from: location }} replace />;
};

export default AuthProtectedRoutes;
