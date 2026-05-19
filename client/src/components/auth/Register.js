import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import "./Auth.css";
import AuthForm from "./AuthForm";
import PasswordChecklist from "./PasswordChecklist";
import { useAuth } from "../../contexts/AuthContext";
import { getFriendlyErrorMessage } from "../../utils/errors";
import {
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
} from "../../utils/validation";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setErrorMessage("");
  }, [email, password, confirmPassword]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMessage(
        "Password must meet all listed requirements before registration.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email: normalizedEmail, password });
      setSuccessMessage("Account created successfully. Redirecting to login.");
      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <AuthForm
      title="Sign Up"
      error={errorMessage}
      success={successMessage}
      onSubmit={handleRegister}
      submitLabel="Register"
      isSubmitting={isSubmitting}
      footer={
        <p className="auth-link">
          Already have an account? <Link to="/">Log in</Link>
        </p>
      }
    >
      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="register-password">Password</label>
      <input
        id="register-password"
        type="password"
        autoComplete="new-password"
        placeholder="Create a password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-describedby="password-requirements"
        required
      />
      <div id="password-requirements">
        <PasswordChecklist password={password} />
      </div>

      <label htmlFor="register-confirm-password">Confirm password</label>
      <input
        id="register-confirm-password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
    </AuthForm>
  );
}

export default Register;
