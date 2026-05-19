import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";
import AuthForm from "./AuthForm";
import { useAuth } from "../../contexts/AuthContext";
import { getFriendlyErrorMessage } from "../../utils/errors";
import { isValidEmail, normalizeEmail } from "../../utils/validation";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/home";

  useEffect(() => {
    setErrorMessage("");
  }, [email, password]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: normalizedEmail, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <AuthForm
      title="Sign In"
      error={errorMessage}
      onSubmit={handleLogin}
      submitLabel="Login"
      isSubmitting={isSubmitting}
      footer={
        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      }
    >
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
    </AuthForm>
  );
}

export default Login;
