"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          setError(
            "This password reset link is invalid or has expired. Please request a new reset email."
          );
        }
      } catch (err) {
        console.error(
          "[browser] Reset session error:",
          err
        );

        if (mounted) {
          setError(
            "Unable to verify the password reset session."
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
    };
  }, []);

  async function handleUpdatePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Your new password must be at least 6 characters."
      );
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
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "Your password reset session has expired. Please request a new reset email."
        );
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(
          "[browser] Password update error:",
          updateError
        );

        setError(updateError.message);
        return;
      }

      setMessage(
        "Your password has been updated successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (err) {
      console.error(
        "[browser] Password update exception:",
        err
      );

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
            <p>Checking password reset...</p>
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
          <p>Create a new password</p>
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

        {!message && (
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
              placeholder="Enter new password"
              autoComplete="new-password"
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
              placeholder="Confirm new password"
              autoComplete="new-password"
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
