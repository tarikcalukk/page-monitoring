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
      setErrorMessage("Unesite ispravnu e-mail adresu.");
      return;
    }

    if (!password) {
      setErrorMessage("Lozinka je obavezna.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: normalizedEmail, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error.details?.needsEmailVerification) {
        navigate("/verify-email", {
          replace: true,
          state: { email: error.details.email || normalizedEmail },
        });
        return;
      }
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <AuthForm
      title="Prijava"
      error={errorMessage}
      onSubmit={handleLogin}
      submitLabel="Prijavi se"
      isSubmitting={isSubmitting}
      footer={
        <p className="auth-link">
          Nemate račun? <Link to="/register">Registrujte se</Link>
        </p>
      }
    >
      <label htmlFor="login-email">E-mail</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="ime@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="login-password">Lozinka</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="Vaša lozinka"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
    </AuthForm>
  );
}

export default Login;
