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
      setErrorMessage("Unesite ispravnu e-mail adresu.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Lozinke se ne podudaraju.");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMessage(
        "Lozinka mora zadovoljiti sve prikazane uslove prije registracije.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({ email: normalizedEmail, password });
      navigate("/verify-email", {
        replace: true,
        state: {
          email: response?.email || normalizedEmail,
          devVerificationCode: response?.devVerificationCode,
        },
      });
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <AuthForm
      title="Registracija"
      error={errorMessage}
      success={successMessage}
      onSubmit={handleRegister}
      submitLabel="Kreiraj račun"
      isSubmitting={isSubmitting}
      footer={
        <p className="auth-link">
          Već imate račun? <Link to="/">Prijavite se</Link>
        </p>
      }
    >
      <label htmlFor="register-email">E-mail</label>
      <input
        id="register-email"
        type="email"
        autoComplete="email"
        placeholder="ime@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="register-password">Lozinka</label>
      <input
        id="register-password"
        type="password"
        autoComplete="new-password"
        placeholder="Kreirajte lozinku"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-describedby="password-requirements"
        required
      />
      <div id="password-requirements">
        <PasswordChecklist password={password} />
      </div>

      <label htmlFor="register-confirm-password">Potvrdite lozinku</label>
      <input
        id="register-confirm-password"
        type="password"
        autoComplete="new-password"
        placeholder="Ponovite lozinku"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
    </AuthForm>
  );
}

export default Register;
