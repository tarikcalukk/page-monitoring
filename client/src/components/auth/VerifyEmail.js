import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./Auth.css";
import AuthForm from "./AuthForm";
import { useAuth } from "../../contexts/AuthContext";
import { getFriendlyErrorMessage } from "../../utils/errors";
import { isValidEmail, normalizeEmail } from "../../utils/validation";

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(
    () => normalizeEmail(location.state?.email || ""),
    [location.state?.email],
  );
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { isAuthenticated, verifyEmail, resendVerificationCode } = useAuth();

  useEffect(() => {
    setMessage(null);
  }, [email, code]);

  const handleVerify = async (event) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    setMessage(null);

    if (!isValidEmail(normalizedEmail)) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setMessage({
        type: "error",
        text: "Verification code must contain 6 digits.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail({ email: normalizedEmail, code: code.trim() });
      navigate("/home", { replace: true });
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const normalizedEmail = normalizeEmail(email);
    setMessage(null);

    if (!isValidEmail(normalizedEmail)) {
      setMessage({
        type: "error",
        text: "Enter the account email before requesting a new code.",
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await resendVerificationCode({ email: normalizedEmail });
      setMessage({
        type: "success",
        text: response?.devVerificationCode
          ? `New code sent. Development code: ${response.devVerificationCode}`
          : "New verification code sent.",
      });
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsResending(false);
    }
  };

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <AuthForm
      title="Verify Email"
      error={message?.type === "error" ? message.text : ""}
      success={message?.type === "success" ? message.text : ""}
      onSubmit={handleVerify}
      submitLabel="Verify"
      isSubmitting={isSubmitting}
      footer={
        <div className="auth-link verification-actions">
          <button
            type="button"
            className="link-button"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Send new code"}
          </button>
          <span>
            Already verified? <Link to="/">Log in</Link>
          </span>
        </div>
      }
    >
      <p className="auth-helper">
        Enter the 6-digit code sent to your email address.
      </p>
      {location.state?.devVerificationCode && (
        <p className="auth-dev-code" role="status">
          Development code: {location.state.devVerificationCode}
        </p>
      )}

      <label htmlFor="verify-email">Email</label>
      <input
        id="verify-email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="verify-code">Verification code</label>
      <input
        id="verify-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        maxLength="6"
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        required
      />
    </AuthForm>
  );
}

export default VerifyEmail;
