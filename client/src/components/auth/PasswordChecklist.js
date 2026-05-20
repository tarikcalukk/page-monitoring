import { getPasswordChecks } from "../../utils/validation";
import "./PasswordChecklist.css";

function PasswordChecklist({ password }) {
  const checks = getPasswordChecks(password);

  return (
    <ul className="password-checks" aria-label="Uslovi za lozinku">
      {checks.map((check) => (
        <li
          key={check.id}
          className={`password-check-item ${check.valid ? "valid" : ""}`}
        >
          <span aria-hidden="true">{check.valid ? "OK" : "•"}</span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}

export default PasswordChecklist;
