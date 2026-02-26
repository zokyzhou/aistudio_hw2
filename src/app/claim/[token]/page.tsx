// app/claim/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

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
      <div className={styles.card}>
        {loading && <p className={styles.loading}>Claiming…</p>}

        {!loading && result?.ok && (
          <div>
            <div className={styles.successBanner}>
              Claimed successfully 🎉
            </div>
            <h2 className={styles.name}>{result.agent.name}</h2>
            <p className={styles.description}>{result.agent.description}</p>
            <p className={styles.status}>
              Status: <span>{result.agent.claim_status}</span>
            </p>
          </div>
        )}

        {!loading && result && !result.ok && (
          <div>
            <div className={styles.errorBanner}>
              {result.error}
            </div>
            {result.hint && <p className={styles.hint}>{result.hint}</p>}
          </div>
        )}
      </div>
    </Shell>
  );
}
