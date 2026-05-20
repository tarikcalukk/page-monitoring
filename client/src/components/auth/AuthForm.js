import logo from "../../assets/images/logo.jpg";

function AuthForm({
  title,
  error,
  success,
  children,
  footer,
  onSubmit,
  submitLabel,
  isSubmitting,
}) {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <img src={logo} alt="Page Monitoring" className="auth-logo" />
        <h1 id="auth-title" className="auth-title">
          {title}
        </h1>

        {error && (
          <div className="auth-message auth-message-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-message auth-message-success" role="status">
            {success}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {children}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Molimo sačekajte..." : submitLabel}
          </button>
        </form>

        {footer}
      </section>
    </main>
  );
}

export default AuthForm;
