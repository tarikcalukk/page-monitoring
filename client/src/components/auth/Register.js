import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../logo.jpg";
import "./Auth.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChecks, setShowChecks] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;

  const isValidPassword = () =>
    hasUpperCase && hasLowerCase && hasNumber && hasMinLength;

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setShowChecks(newPassword.length > 0 && !isValidPassword());
    setErrorMessage("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords does not match");
      return;
    }

    if (!isValidPassword()) {
      setErrorMessage(
        "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number."
      );
      return;
    }

    const res = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      navigate("/");
    } else {
      setErrorMessage(data.msg || "Registration failed");
    }
  };

  return (
    <div className="background">
      <div className="container">
        <img src={logo} alt="Your Logo" className="applogo" />
        <h2 className="title">Sign Up</h2>

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage("");
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
          />

          {showChecks && (
            <ul className="password-checks">
              {!hasUpperCase && <li className="password-check-item">✔ At least one uppercase letter</li>}
              {!hasLowerCase && <li className="password-check-item">✔ At least one lowercase letter</li>}
              {!hasNumber && <li className="password-check-item">✔ At least one number</li>}
              {!hasMinLength && <li className="password-check-item">✔ Minimum 8 characters</li>}
            </ul>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorMessage("");
            }}
            required
          />
          <button type="submit">Register</button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/")}>Log in</span>
        </p>
      </div>
    </div>
  );
}

export default Register;