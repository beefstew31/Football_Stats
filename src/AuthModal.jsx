import React from "react";
import { supa } from "./supa";

export default function AuthModal({ mode = "login", onClose, onSuccess }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const title = mode === "signup" ? "Create account" : "Log in";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signup") {
        const { error } = await supa.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Check your inbox to confirm your email.");
        onSuccess?.();
      } else {
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess?.();
      }
    } catch (err) {
      setMsg(err.message || "Authentication error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {msg && <div className="muted" style={{ marginTop: 6 }}>{msg}</div>}
          <div className="modal-actions">
            <button type="button" className="pill-button outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="pill-button" disabled={busy}>
              {busy ? "Please wait…" : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
