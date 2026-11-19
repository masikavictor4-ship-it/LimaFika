"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ConfirmRecoveryPage() {
  const router = useRouter();
  const started = useRef(false);

  const [message, setMessage] = useState(
    "Verifying your password reset link..."
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function verifyRecoveryLink() {
      try {
        const params = new URLSearchParams(window.location.search);

        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (!tokenHash || type !== "recovery") {
          throw new Error(
            "This password reset link is incomplete or invalid. Please request a new reset email."
          );
        }

        const { data, error: verifyError } =
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

        if (verifyError) {
          throw verifyError;
        }

        if (!data.session) {
          throw new Error(
            "The recovery link could not create a password reset session. Please request another email."
          );
        }

        setMessage("Link verified. Opening the password reset page...");

        router.replace("/reset-password");
      } catch (err) {
        console.error("Password recovery verification error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify this password reset link."
        );

        setMessage("");
      }
    }

    verifyRecoveryLink();
  }, [router]);

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>LimaFika</h1>
          <p>Password Recovery</p>
        </div>

        {message && (
          <div className="auth-message auth-success">{message}</div>
        )}

        {error && (
          <>
            <div className="auth-message auth-error">{error}</div>

            <button
              type="button"
              className="auth-button"
              onClick={() => router.replace("/login")}
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </main>
  );
}
