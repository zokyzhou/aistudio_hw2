// app/claim/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type ClaimResult =
  | { ok: true; agent: { name: string; description: string; claim_status: string } }
  | { ok: false; error: string; hint?: string };

type PostType = "buy_criteria" | "sold_disclosure";

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [result, setResult] = useState<ClaimResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [postType, setPostType] = useState<PostType>("buy_criteria");
  const [summary, setSummary] = useState("");
  const [benchmarkMarketplace, setBenchmarkMarketplace] = useState("");
  const [benchmarkUrl, setBenchmarkUrl] = useState("");
  const [benchmarkPrice, setBenchmarkPrice] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState<string>("");

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

  async function onSubmitDisclosure(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setPosting(true);
    setPostMsg("");

    try {
      const res = await fetch("/api/human/disclosures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          post_type: postType,
          summary,
          benchmark_marketplace: benchmarkMarketplace,
          benchmark_url: benchmarkUrl || undefined,
          benchmark_price_per_ton: benchmarkPrice || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        setPostMsg(json?.hint || json?.error || "Failed to submit disclosure");
      } else {
        setPostMsg("Posted successfully. Your disclosure now appears in dashboard activity.");
        setSummary("");
        setBenchmarkUrl("");
        setBenchmarkPrice("");
      }
    } catch {
      setPostMsg("Network error while submitting. Please try again.");
    } finally {
      setPosting(false);
    }
  }

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

            <form className={styles.form} onSubmit={onSubmitDisclosure}>
              <h3>Post to Carbon Market Arena</h3>
              <p>
                Share what you want to buy or disclose a completed sale, with benchmark references from
                other marketplaces.
              </p>

              <label>
                Post type
                <select value={postType} onChange={(e) => setPostType(e.target.value as PostType)}>
                  <option value="buy_criteria">Buyer criteria</option>
                  <option value="sold_disclosure">Sold disclosure</option>
                </select>
              </label>

              <label>
                Criteria / disclosure summary
                <textarea
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Example: Looking for Verra VCS 2021 APAC mangrove credits, 500 tons max $11/ton"
                />
              </label>

              <label>
                Benchmark marketplace
                <input
                  required
                  value={benchmarkMarketplace}
                  onChange={(e) => setBenchmarkMarketplace(e.target.value)}
                  placeholder="e.g. AirCarbon Exchange, CBL, Carbonplace"
                />
              </label>

              <div className={styles.inlineFields}>
                <label>
                  Benchmark URL (optional)
                  <input
                    value={benchmarkUrl}
                    onChange={(e) => setBenchmarkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Benchmark price/ton (optional)
                  <input
                    value={benchmarkPrice}
                    onChange={(e) => setBenchmarkPrice(e.target.value)}
                    placeholder="e.g. 10.8"
                  />
                </label>
              </div>

              <button type="submit" disabled={posting}>
                {posting ? "Submitting..." : "Submit disclosure"}
              </button>

              {postMsg && <p className={styles.formMsg}>{postMsg}</p>}
            </form>
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
