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
      setMessage({ type: "error", text: "Lozinke se ne podudaraju." });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setMessage({
        type: "error",
        text: "Lozinka ne zadovoljava tražene uslove.",
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
        text: response?.msg || "Lozinka je uspješno promijenjena.",
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
      "Jeste li sigurni da želite obrisati račun? Ova radnja se ne može poništiti.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    clearMessage();
    try {
      const response = await apiService.deleteAccount();
      setMessage({
        type: "success",
        text: response?.msg || "Račun je uspješno obrisan.",
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
        <FaUserCircle aria-hidden="true" /> POSTAVKE RAČUNA
      </h2>

      <section aria-labelledby="account-email-title">
        <h3 id="account-email-title">E-mail adresa</h3>
        <p>
          Vaša e-mail adresa je: <strong>{user?.email || "-"}</strong>
        </p>
      </section>

      <section aria-labelledby="password-title">
        <div className="password-header">
          <h3 id="password-title">Promjena lozinke</h3>
          <button
            type="button"
            className="toggle-link"
            onClick={() => setShowPasswordForm((current) => !current)}
          >
            {showPasswordForm ? "Sakrij" : "Prikaži"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="password-inputs">
              <label htmlFor="current-password">Trenutna lozinka</label>
              <input
                id="current-password"
                type="password"
                placeholder="Trenutna lozinka"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  clearMessage();
                }}
                autoComplete="current-password"
                required
              />

              <label htmlFor="new-password">Nova lozinka</label>
              <input
                id="new-password"
                type="password"
                placeholder="Nova lozinka"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  clearMessage();
                }}
                autoComplete="new-password"
                required
              />
              <PasswordChecklist password={newPassword} />

              <label htmlFor="confirm-new-password">Potvrdite lozinku</label>
              <input
                id="confirm-new-password"
                type="password"
                placeholder="Potvrdite lozinku"
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
              {isSavingPassword ? "Spremanje..." : "Spremi lozinku"}
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
        <h3 id="delete-title">Brisanje računa</h3>
        <p>
          Ovaj račun je kreiran <strong>{userSince}</strong>. Brisanjem računa
          uklanjaju se svi povezani podaci.
        </p>
        <button
          type="button"
          className="delete-button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Brisanje..." : "Obriši račun"}
        </button>
      </section>
    </div>
  );
}

export default Account;
