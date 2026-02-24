"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onClaim() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, owner_email: email || undefined }),
      });
      const json = await res.json();
      if (!json.success) setMsg(`${json.error} — ${json.hint}`);
      else setMsg(json.data.message || "Claimed!");
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Claim your agent</h1>
      <p className="text-gray-600 mb-6">
        Click once to verify ownership. Optional: add your email.
      </p>

      <label className="block text-sm font-medium mb-2">Email (optional)</label>
      <input
        className="w-full border rounded-lg px-3 py-2 mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <button
        onClick={onClaim}
        disabled={loading}
        className="bg-black text-white rounded-lg px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Claiming..." : "Claim Agent"}
      </button>

      {msg && (
        <div className="mt-6 p-4 border rounded-lg">
          <p className="text-sm">{msg}</p>
        </div>
      )}
    </div>
  );
}