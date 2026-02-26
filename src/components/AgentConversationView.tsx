"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AgentConversationView.module.css";

type Message = {
  id: string;
  lot_id: string;
  lot_name: string;
  lot_ask_price_per_ton: number | null;
  lot_quantity_tons: number | null;
  agent_id: string;
  agent_name: string;
  agent_role: "buyer" | "seller" | "hybrid";
  message: string;
  tag: "quality" | "project" | "price" | "general";
  createdAt: string;
};

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString();
}

export default function AgentConversationView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoStatus, setAutoStatus] = useState("Auto mode active");

  async function refresh() {
    const res = await fetch("/api/negotiations/feed", { cache: "no-store" });
    const json = await res.json();
    if (res.ok && json?.success) {
      setMessages(json.data?.messages || []);
    }
    setLoading(false);
  }

  async function boostRound() {
    try {
      await fetch("/api/agents/boost", { method: "POST" });
      await refresh();
      setAutoStatus("Auto round completed");
      window.setTimeout(() => setAutoStatus("Auto mode active (30–60s cadence)"), 1800);
    } finally {
      // no-op
    }
  }

  useEffect(() => {
    refresh();

    const refreshTimer = window.setInterval(refresh, 5000);
    let autoBoostTimer: number | null = null;

    const scheduleBoost = () => {
      const delay = 30000 + Math.floor(Math.random() * 30000);
      autoBoostTimer = window.setTimeout(async () => {
        await boostRound();
        scheduleBoost();
      }, delay);
    };

    scheduleBoost();

    return () => {
      window.clearInterval(refreshTimer);
      if (autoBoostTimer) window.clearTimeout(autoBoostTimer);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const message of messages) {
      if (!map.has(message.lot_id)) map.set(message.lot_id, []);
      map.get(message.lot_id)!.push(message);
    }

    return Array.from(map.entries())
      .map(([lotId, rows]) => {
        const sortedRows = [...rows].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const latestTs = sortedRows.length
          ? new Date(sortedRows[sortedRows.length - 1].createdAt).getTime()
          : 0;

        return {
          lotId,
          lotName: sortedRows[0]?.lot_name || "Unknown lot",
          ask: sortedRows[0]?.lot_ask_price_per_ton,
          qty: sortedRows[0]?.lot_quantity_tons,
          latestTs,
          rows: sortedRows.slice(-4),
        };
      })
      .sort((a, b) => b.latestTs - a.latestTs)
      .slice(0, 3);
  }, [messages]);

  return (
    <section className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h2>Agent Conversation Room</h2>
          <p>Latest negotiation previews only. {autoStatus}.</p>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading conversations...</p>
      ) : grouped.length === 0 ? (
        <p className={styles.empty}>
          Initializing automated negotiation rounds...
        </p>
      ) : (
        <div className={styles.groups}>
          {grouped.map((group) => (
            <article key={group.lotId} className={styles.groupCard}>
              <div className={styles.groupTop}>
                <h3>{group.lotName}</h3>
                <p>
                  Ask {group.ask ? `$${group.ask}/ton` : "-"} • Qty {group.qty ?? "-"} tons
                </p>
              </div>

              <ul className={styles.messageList}>
                {group.rows.map((message) => (
                  <li key={message.id} className={styles.messageItem}>
                    <div className={styles.rowTop}>
                      <strong>{message.agent_name}</strong>
                      <span className={styles.tag}>{message.tag}</span>
                    </div>
                    <p>{message.message}</p>
                    <time>{fmtDate(message.createdAt)}</time>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
