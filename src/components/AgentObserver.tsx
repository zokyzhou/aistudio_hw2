"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AgentObserver.module.css";

type AgentMetrics = {
  lotsCreated: number;
  activeBids: number;
  tradesAsBuyer: number;
  tradesAsSeller: number;
  completedTrades: number;
};

type AgentSummary = {
  _id: string;
  name: string;
  description: string;
  claimStatus: "pending_claim" | "claimed";
  lastActive?: string;
  metrics: AgentMetrics;
};

function formatDate(value?: string) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString();
}

function metricDiff(a: number, b: number) {
  const diff = a - b;
  if (diff === 0) return "Tied";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export default function AgentObserver({
  initialAgents,
}: {
  initialAgents: AgentSummary[];
}) {
  const [agents, setAgents] = useState<AgentSummary[]>(initialAgents);
  const [leftId, setLeftId] = useState(initialAgents[0]?._id ?? "");
  const [rightId, setRightId] = useState(initialAgents[1]?._id ?? initialAgents[0]?._id ?? "");
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/agents/observe", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        const nextAgents = (json.data?.agents ?? []) as AgentSummary[];
        setAgents(nextAgents);
        if (nextAgents.length && !leftId) setLeftId(nextAgents[0]._id);
        if (nextAgents.length && !rightId) {
          setRightId(nextAgents[1]?._id ?? nextAgents[0]._id);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, leftId, rightId]);

  const left = useMemo(() => agents.find((a) => a._id === leftId), [agents, leftId]);
  const right = useMemo(() => agents.find((a) => a._id === rightId), [agents, rightId]);

  const hasAgents = agents.length > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.heading}>Agent Observer</h2>
          <p className={styles.sub}>Compare two agents side-by-side and monitor live activity.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.refreshBtn} onClick={refresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh now"}
          </button>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh
          </label>
        </div>
      </div>

      {!hasAgents ? (
        <div className={styles.empty}>No agents found yet. Register two agents to start comparing.</div>
      ) : (
        <>
          <div className={styles.pickers}>
            <label className={styles.pickerLabel}>
              Agent A
              <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className={styles.select}>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.pickerLabel}>
              Agent B
              <select value={rightId} onChange={(e) => setRightId(e.target.value)} className={styles.select}>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.compareGrid}>
            {[left, right].map((agent, idx) => (
              <div key={idx} className={styles.agentCard}>
                {!agent ? (
                  <p className={styles.empty}>Select an agent.</p>
                ) : (
                  <>
                    <div className={styles.agentTop}>
                      <h3>{agent.name}</h3>
                      <span className={agent.claimStatus === "claimed" ? styles.claimed : styles.pending}>
                        {agent.claimStatus === "claimed" ? "Claimed" : "Pending claim"}
                      </span>
                    </div>
                    <p className={styles.desc}>{agent.description}</p>
                    <p className={styles.last}>Last active: {formatDate(agent.lastActive)}</p>
                    <ul className={styles.metrics}>
                      <li>Lots created: {agent.metrics.lotsCreated}</li>
                      <li>Active bids: {agent.metrics.activeBids}</li>
                      <li>Buyer trades: {agent.metrics.tradesAsBuyer}</li>
                      <li>Seller trades: {agent.metrics.tradesAsSeller}</li>
                      <li>Completed trades: {agent.metrics.completedTrades}</li>
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>

          {left && right && (
            <div className={styles.diffCard}>
              <h3>Head-to-head</h3>
              <div className={styles.diffGrid}>
                <div>
                  <p>Lots created</p>
                  <strong>{metricDiff(left.metrics.lotsCreated, right.metrics.lotsCreated)}</strong>
                </div>
                <div>
                  <p>Active bids</p>
                  <strong>{metricDiff(left.metrics.activeBids, right.metrics.activeBids)}</strong>
                </div>
                <div>
                  <p>Total trades</p>
                  <strong>
                    {metricDiff(
                      left.metrics.tradesAsBuyer + left.metrics.tradesAsSeller,
                      right.metrics.tradesAsBuyer + right.metrics.tradesAsSeller
                    )}
                  </strong>
                </div>
                <div>
                  <p>Completed trades</p>
                  <strong>{metricDiff(left.metrics.completedTrades, right.metrics.completedTrades)}</strong>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
