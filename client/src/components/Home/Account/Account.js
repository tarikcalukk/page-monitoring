import { useMemo, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import "./Account.css";
import PasswordChecklist from "../../auth/PasswordChecklist";
import { useAuth } from "../../../contexts/AuthContext";
import { apiService } from "../../../services/apiService";
import { getFriendlyErrorMessage } from "../../../utils/errors";
import { isStrongPassword } from "../../../utils/validation";

function Account() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userSince = useMemo(() => {
    if (!user?.createdAt) return "-";
    return new Date(user.createdAt).toLocaleDateString();
  }, [user]);

  const clearMessage = () => setMessage(null);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    clearMessage();

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setMessage({
        type: "error",
        text: "Password does not meet the required criteria.",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await apiService.changePassword({
        currentPassword,
        newPassword,
      });
      setMessage({
        type: "success",
        text: response?.msg || "Password changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      window.setTimeout(logout, 1000);
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    clearMessage();
    try {
      const response = await apiService.deleteAccount();
      setMessage({
        type: "success",
        text: response?.msg || "Account deleted successfully.",
      });
      window.setTimeout(logout, 800);
    } catch (error) {
      setMessage({ type: "error", text: getFriendlyErrorMessage(error) });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="account-container">
      <h2>
        <FaUserCircle aria-hidden="true" /> ACCOUNT SETTINGS
      </h2>

      <section aria-labelledby="account-email-title">
        <h3 id="account-email-title">E-mail Address</h3>
        <p>
          Your email address is: <strong>{user?.email || "-"}</strong>
        </p>
      </section>

      <section aria-labelledby="password-title">
        <div className="password-header">
          <h3 id="password-title">Change Password</h3>
          <button
            type="button"
            className="toggle-link"
            onClick={() => setShowPasswordForm((current) => !current)}
          >
            {showPasswordForm ? "Hide" : "Show"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="password-inputs">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  clearMessage();
                }}
                autoComplete="current-password"
                required
              />

              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  clearMessage();
                }}
                autoComplete="new-password"
                required
              />
              <PasswordChecklist password={newPassword} />

              <label htmlFor="confirm-new-password">Confirm password</label>
              <input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearMessage();
                }}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Saving..." : "Save password"}
            </button>
          </form>
        )}
      </section>

      {message && (
        <p className={`message ${message.type}`} role="status">
          {message.text}
        </p>
      )}

      <section className="delete-account-section" aria-labelledby="delete-title">
        <h3 id="delete-title">Delete Account</h3>
        <p>
          This account was created on <strong>{userSince}</strong>. Deleting
          your account will remove all content associated with it.
        </p>
        <button
          type="button"
          className="delete-button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
        </button>
      </section>
    </div>
  );
}

export default Account;
