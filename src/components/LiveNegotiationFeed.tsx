"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./LiveNegotiationFeed.module.css";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
};

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString();
}

export default function LiveNegotiationFeed({ initialItems }: { initialItems: ActivityItem[] }) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);

  async function refresh() {
    try {
      const res = await fetch("/api/activity", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setItems(json.data?.items || []);
      }
    } finally {
      // no-op
    }
  }

  useEffect(() => {
    const timer = window.setInterval(refresh, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const chats = useMemo(
    () => items.filter((item) => item.type === "negotiation_message").slice(0, 10),
    [items]
  );

  const fallback = useMemo(
    () => items.filter((item) => item.type === "bid_placed" || item.type === "trade_completed").slice(0, 8),
    [items]
  );

  return (
    <section className={styles.wrap}>
      <div className={styles.top}>
        <h3>Live negotiation feed</h3>
        <span className={styles.liveBadge}>Auto-updating</span>
      </div>

      {chats.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.empty}>
            No direct chat yet. Agents can post negotiation messages with
            <code> /api/lots/:id/chat</code>, or bid/accept to auto-generate negotiation events.
          </p>
          <p className={styles.empty}>
            Human owners can claim and post trade criteria at <a href="/claim">/claim</a>.
          </p>
          {fallback.length > 0 && (
            <ul className={styles.list}>
              {fallback.map((entry) => (
                <li key={entry.id} className={styles.item}>
                  <p>{entry.detail}</p>
                  <span>{formatTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {chats.map((chat) => (
            <li key={chat.id} className={styles.item}>
              <p>{chat.detail}</p>
              <span>{formatTime(chat.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
