"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanEmail = email.trim().toLowerCase();

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function changeMode(newMode: Mode) {
    setMode(newMode);
    clearMessages();
    setPassword("");
    setConfirmPassword("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearMessages();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error("[browser] Login error:", loginError);

        if (
          loginError.message.toLowerCase().includes("invalid login")
        ) {
          setError("Invalid email or password.");
        } else {
          setError(loginError.message);
        }

        return;
      }

      if (!data.session) {
        setError("Login failed. Please try again.");
        return;
      }

      setMessage("Login successful. Redirecting...");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[browser] Login exception:", err);
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearMessages();

    if (!cleanEmail || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

      if (signupError) {
        console.error("[browser] Signup error:", signupError);
        setError(signupError.message);
        return;
      }

      if (data.session) {
        setMessage("Account created successfully. Redirecting...");

        router.push("/dashboard");
        router.refresh();
        return;
      }

      setMessage(
        "Account created. Check your email to confirm your account, then log in."
      );

      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("[browser] Signup exception:", err);
      setError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });

      if (resetError) {
        console.error(
          "[browser] Password reset error:",
          resetError
        );

        const errorMessage = resetError.message.toLowerCase();

        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("email rate limit")
        ) {
          setError(
            "Password reset emails are temporarily rate-limited by Supabase. Please wait before requesting another reset email."
          );
        } else {
          setError(resetError.message);
        }

        return;
      }

      setMessage(
        "Password reset email sent. Check your inbox and click the reset link."
      );
    } catch (err) {
      console.error(
        "[browser] Password reset exception:",
        err
      );

      setError(
        "Unable to send the password reset email. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>LimaFika</h1>

          <p>
            {mode === "login" &&
              "Sign in to your account"}

            {mode === "signup" &&
              "Create your LimaFika account"}

            {mode === "forgot" &&
              "Reset your password"}
          </p>
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

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              required
            />

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-links">
              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("forgot")}
                disabled={loading}
              >
                Forgot Password?
              </button>

              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("signup")}
                disabled={loading}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup}>
            <label htmlFor="signup-email">
              Email
            </label>

            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              required
            />

            <label htmlFor="signup-password">
              Password
            </label>

            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={loading}
              required
            />

            <label htmlFor="confirm-password">
              Confirm Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={loading}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

            <div className="auth-links">
              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("login")}
                disabled={loading}
              >
                Already have an account? Login
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword}>
            <label htmlFor="forgot-email">
              Email
            </label>

            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your account email"
              autoComplete="email"
              disabled={loading}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading
                ? "Sending..."
                : "Send Reset Email"}
            </button>

            <div className="auth-links">
              <button
                type="button"
                className="text-button"
                onClick={() => changeMode("login")}
                disabled={loading}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <Link href="/">
            ← Back to LimaFika
          </Link>
        </div>
      </div>
    </main>
  );
}
