
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionAvailable, setSessionAvailable] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    // Listen for Supabase recovery session events.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "INITIAL_SESSION" && session) ||
        (event === "SIGNED_IN" && session) ||
        (event === "TOKEN_REFRESHED" && session)
      ) {
        setSessionAvailable(true);
        setError("");
        setCheckingSession(false);
      }
    });

    async function checkSession() {
      try {
        // Wait for Supabase to initialize and process the
        // recovery callback from the email link.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          setSessionAvailable(true);
          setError("");
        } else {
          const params = new URLSearchParams(
            window.location.search
          );

          const hash = new URLSearchParams(
            window.location.hash.replace(/^#/, "")
          );

          const callbackError =
            params.get("error_description") ||
            hash.get("error_description");

          setError(
            callbackError
              ? decodeURIComponent(callbackError.replace(/\+/g, " "))
              : "Your password reset link is invalid or expired. Please request a new reset email."
          );
        }
      } catch (err) {
        console.error("Recovery session error:", err);

        if (mounted) {
          setError(
            "Unable to verify your recovery link. Please request a new one."
          );
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!sessionAvailable) {
      setError(
        "Your recovery session is missing. Please request a new reset email."
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError(
          "Your reset session has expired. Please request another reset email."
        );
        setSessionAvailable(false);
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error("Password update error:", updateError);
        setError(updateError.message);
        return;
      }

      setPassword("");
      setConfirmPassword("");

      setMessage(
        "Your LimaFika password has been updated successfully. Redirecting to login..."
      );

      // Password has already been updated successfully.
      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      console.error("Password update exception:", err);

      setError(
        "Unable to update your password. Please request a new reset link."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1>LimaFika</h1>
            <p>Verifying your password reset link...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>LimaFika</h1>
          <p>Reset your LimaFika password</p>
        </div>

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-message auth-success">
            {message}
          </div>
        )}

        {sessionAvailable && !message && (
          <form onSubmit={handleUpdatePassword}>
            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your new password"
              autoComplete="new-password"
              minLength={6}
              disabled={loading}
              required
            />

            <label htmlFor="confirm-new-password">
              Confirm New Password
            </label>

            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your new password"
              autoComplete="new-password"
              minLength={6}
              disabled={loading}
              required
            />

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Updating Password..."
                : "Update Password"}
            </button>
          </form>
        )}

        {!sessionAvailable && !message && (
          <button
            type="button"
            className="auth-button"
            onClick={() => router.push("/login")}
          >
            Return to Login
          </button>
        )}

        <div className="login-footer">
          <button
            type="button"
            className="text-button"
            onClick={() => router.push("/login")}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}
