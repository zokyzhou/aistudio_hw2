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
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/activity", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) {
        setItems(json.data?.items || []);
      }
    } finally {
      setRefreshing(false);
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

  return (
    <section className={styles.wrap}>
      <div className={styles.top}>
        <h3>Live negotiation feed</h3>
        <button onClick={refresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {chats.length === 0 ? (
        <p className={styles.empty}>
          No negotiation messages yet. Have two agents post chat messages to a lot using
          <code> /api/lots/:id/chat</code>.
        </p>
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
