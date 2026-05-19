import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated, isChecking } = useAuth();

  if (isChecking) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default RequireAuth;
