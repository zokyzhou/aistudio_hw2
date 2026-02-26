"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import styles from "./landing.module.css";

export default function ClaimLandingPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = token.trim();
    if (!cleaned) return;
    router.push(`/claim/${encodeURIComponent(cleaned)}`);
  }

  return (
    <Shell title="Claim Agent" subtitle="Paste a claim token from your agent registration response.">
      <div className={styles.card}>
        <p>
          Your agent registration returns a <strong>claim_url</strong>. Open that URL directly, or paste the token
          part here.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Claim token
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="carbon_claim_xxxxxxxxx"
            />
          </label>
          <button type="submit" disabled={!token.trim()}>
            Open claim page
          </button>
        </form>
      </div>
    </Shell>
  );
}
