import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const { signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Get the redirect path from location state, defaulting to root "/"
  const from = (location.state as any)?.from?.pathname || "/";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: sendError } = await signInWithOtp(email);
      if (sendError) {
        throw sendError;
      }
      setStep("otp");
      setMessage("A 6-digit OTP verification code has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) return;

    setLoading(true);
    setError(null);

    try {
      const { session, error: verifyError } = await verifyOtp(email, token);
      if (verifyError) {
        throw verifyError;
      }
      if (session) {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-dot" />
          <h1 className="auth-title">MedGuard</h1>
          <p className="auth-description">
            {step === "email"
              ? "Zero-Knowledge Medical Claim Verification Platform"
              : "Verify your cryptographic identity"}
          </p>
        </div>

        {error && (
          <div className="alert-banner-error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert-banner-message">
            {message}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? (
                <>
                  <div className="auth-loader-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", marginRight: "8px" }} />
                  Sending OTP...
                </>
              ) : (
                "Send One-Time Password"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">
                One-Time Password (OTP)
              </label>
              <input
                id="otp"
                type="text"
                className="form-input"
                placeholder="e.g. 123456"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={loading}
                autoFocus
                style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: "1.2rem", fontWeight: "bold" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? (
                <>
                  <div className="auth-loader-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", marginRight: "8px" }} />
                  Verifying OTP...
                </>
              ) : (
                "Verify and Sign In"
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={loading}
              onClick={() => {
                setStep("email");
                setToken("");
                setError(null);
                setMessage(null);
              }}
              style={{ width: "100%" }}
            >
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
