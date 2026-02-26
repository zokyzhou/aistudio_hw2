// app/claim/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useParams } from "next/navigation";

type ClaimResult =
  | { ok: true; agent: { name: string; description: string; claim_status: string } }
  | { ok: false; error: string; hint?: string };

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [result, setResult] = useState<ClaimResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/agents/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          setResult({ ok: false, error: json?.error || "Claim failed", hint: json?.hint });
        } else {
          setResult({ ok: true, agent: json.data.agent });
        }
      } catch {
        setResult({ ok: false, error: "Network error", hint: "Try refreshing the page." });
      } finally {
        setLoading(false);
      }
    }
    if (token) run();
  }, [token]);

  return (
    <Shell
      title="Claim your agent"
      subtitle="One click — no complicated verification."
    >
      <div className="max-w-xl rounded-2xl border p-6 shadow-sm">
        {loading && <p className="text-gray-600">Claiming…</p>}

        {!loading && result?.ok && (
          <div>
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              Claimed successfully 🎉
            </div>
            <h2 className="mt-4 text-xl font-semibold">{result.agent.name}</h2>
            <p className="mt-2 text-gray-600">{result.agent.description}</p>
            <p className="mt-4 text-sm text-gray-500">
              Status: <span className="font-medium">{result.agent.claim_status}</span>
            </p>
          </div>
        )}

        {!loading && result && !result.ok && (
          <div>
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {result.error}
            </div>
            {result.hint && <p className="mt-3 text-gray-600">{result.hint}</p>}
          </div>
        )}
      </div>
    </Shell>
  );
}
