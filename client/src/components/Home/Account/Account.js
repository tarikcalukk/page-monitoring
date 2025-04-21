import React, { useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";
import "./Account.css";
import { FaUserCircle } from "react-icons/fa";

function Account() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChecks, setShowChecks] = useState(false);
  const [message, setMessage] = useState("");

  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;

  const isValidPassword = () =>
    hasUpperCase && hasLowerCase && hasNumber && hasMinLength;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setEmail(decoded.email);
    }
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!isValidPassword()) {
      setMessage(
        "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number."
      );
      return;
    }

    const res = await fetch("http://localhost:5000/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await res.json();
    setMessage(data.msg || "Something went wrong.");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="account-tab">
      <div className="profile-section">
        <FaUserCircle className="profile-icon" />
        <h3>{email}</h3>
      </div>

      <form className="change-password-form" onSubmit={handlePasswordChange}>
        <h4>Change Password</h4>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setShowChecks(e.target.value.length > 0 && !isValidPassword());
            setMessage("");
          }}
          required
        />

        {showChecks && (
          <ul className="password-checks">
            {!hasUpperCase && (
              <li className="password-check-item">✔ At least one uppercase letter</li>
            )}
            {!hasLowerCase && (
              <li className="password-check-item">✔ At least one lowercase letter</li>
            )}
            {!hasNumber && (
              <li className="password-check-item">✔ At least one number</li>
            )}
            {!hasMinLength && (
              <li className="password-check-item">✔ Minimum 8 characters</li>
            )}
          </ul>
        )}

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setMessage("");
          }}
          required
        />

        <button type="submit">Update </button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default Account;