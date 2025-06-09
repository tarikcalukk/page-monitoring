import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FaUserCircle } from "react-icons/fa";
import "./Account.css";

function Account() {
  const [email, setEmail] = useState("");
  const [userSince, setUserSince] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showChecks, setShowChecks] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasMinLength: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setEmail(decoded.email);
      if (decoded.iat) {
        const date = new Date(decoded.iat * 1000);
        setUserSince(date.toLocaleDateString());
      }
    }
  }, []);

  const validatePassword = (password) => {
    setPasswordValidation({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { hasUpperCase, hasLowerCase, hasNumber, hasMinLength } =
      passwordValidation;

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasMinLength) {
      setMessage("Password does not meet the required criteria.");
      return;
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/change-password`, {
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
    setShowPasswordForm(false);
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete your account?");
    if (!confirm) return;
  
    const token = localStorage.getItem("token");
  
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/delete-account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const data = await res.json();
    alert(data.msg);
  
    if (res.ok) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };  

  return (
    <div className="account-container">
      <h2><FaUserCircle /> ACCOUNT SETTINGS</h2>
      <p>
        <h3>E-mail Address</h3>
      </p>
      <p>Your email address is: <strong>{email}</strong></p>

      <div className="password-header">
        <h3>Change Password</h3>
        <button
          type="button"
          className="toggle-link"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          {showPasswordForm ? "Hide" : "Show"}
        </button>
      </div>

      {showPasswordForm && (
        <form onSubmit={handlePasswordChange} className="password-form">
          <div className="password-inputs">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setMessage("");
                setShowChecks(e.target.value.length > 0);
                validatePassword(e.target.value);
              }}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMessage("");
              }}
              required
            />
          </div>

          {showChecks && (
            <ul className="password-checks">
              <li
                className={`password-check-item ${
                  passwordValidation.hasUpperCase ? "valid" : ""
                }`}
              >
                ✔ At least one uppercase letter
              </li>
              <li
                className={`password-check-item ${
                  passwordValidation.hasLowerCase ? "valid" : ""
                }`}
              >
                ✔ At least one lowercase letter
              </li>
              <li
                className={`password-check-item ${
                  passwordValidation.hasNumber ? "valid" : ""
                }`}
              >
                ✔ At least one number
              </li>
              <li
                className={`password-check-item ${
                  passwordValidation.hasMinLength ? "valid" : ""
                }`}
              >
                ✔ Minimum 8 characters
              </li>
            </ul>
          )}

          <button type="submit">Save password</button>
          {message && <p className="message">{message}</p>}
        </form>
      )}

      <div className="delete-account-section">
        <h3>Delete Account</h3>
        <p>
          Would you like to delete your account? This account was created on{" "}
          <strong>{userSince}</strong>. Deleting your account will remove all
          the content associated with it.
        </p>
        <button className="delete-button" onClick={handleDelete}>
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Account;