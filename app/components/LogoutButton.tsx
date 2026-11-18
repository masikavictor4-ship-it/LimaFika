"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Could not log out. Please try again.");
      return;
    }

    localStorage.removeItem("limafika-user");
    localStorage.removeItem("limafika-last-order");

    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="logout-btn"
    >
      Logout
    </button>
  );
}

