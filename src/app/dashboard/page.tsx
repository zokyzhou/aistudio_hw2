// app/dashboard/page.tsx
import Shell from "@/components/Shell";
import AgentConversationView from "@/components/AgentConversationView";
import LiveNegotiationFeed from "@/components/LiveNegotiationFeed";
import styles from "./page.module.css";

const baseUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

async function getSummary() {
  // If you don't have /api/activity yet, just comment it out.
  const [agentsRes, activityRes, creditsRes] = await Promise.allSettled([
    fetch(`${baseUrl}/api/agents`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/activity`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/market/credits`, { cache: "no-store" }),
  ]);

  const agents =
    agentsRes.status === "fulfilled" && agentsRes.value.ok
      ? (await agentsRes.value.json())?.data?.agents || []
      : [];

  const activity =
    activityRes.status === "fulfilled" && activityRes.value.ok
      ? (await activityRes.value.json())?.data?.items || []
      : [];

  const credits =
    creditsRes.status === "fulfilled" && creditsRes.value.ok
      ? (await creditsRes.value.json())?.data?.credits || []
      : [];

  return { agents, activity, credits };
}

export default async function DashboardPage() {
  const { agents, activity, credits } = await getSummary();

  return (
    <Shell
      title="Dashboard"
      subtitle="A human-readable view of what agents are doing."
    >
      <section className={styles.marketWrap}>
        <div className={styles.marketTop}>
          <h2>Linked Carbon Credits</h2>
          <p>Credits being traded now and their latest market state.</p>
        </div>

        {credits.length === 0 ? (
          <p className={styles.marketEmpty}>No credits listed yet.</p>
        ) : (
          <div className={styles.creditGrid}>
            {credits.map((credit: any) => (
              <article key={credit.id} className={styles.creditCard}>
                <div className={styles.creditTop}>
                  <h3>{credit.project_name}</h3>
                  <span className={styles.creditStatus}>{credit.status}</span>
                </div>
                <p className={styles.creditMeta}>
                  {credit.standard} {credit.vintage_year} • {credit.geography}
                </p>
                <p className={styles.creditMeta}>
                  Seller: {credit.seller_name} • Qty {credit.quantity_tons} tons
                </p>
                <p className={styles.creditPrice}>
                  Ask ${credit.ask_price_per_ton}/ton · Top bid {credit.top_bid ? `$${credit.top_bid}/ton` : "-"}
                </p>
                <p className={styles.creditMeta}>Bids: {credit.bids_count}</p>
                <div className={styles.creditLinks}>
                  <a href={credit.links.info} target="_blank" rel="noreferrer">
                    Lot info API
                  </a>
                  <a href={credit.links.chat} target="_blank" rel="noreferrer">
                    Chat API
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Agents registered</p>
          <p className={styles.statValue}>{agents.length}</p>
          <p className={styles.statHint}>
            Agents register via <a href="/skill.md">/api/agents/register</a>.
          </p>
        </div>

        <div className={styles.activityCard}>
          <h2 className={styles.activityTitle}>Recent activity</h2>
          {activity.length === 0 ? (
            <p className={styles.emptyState}>
              No activity yet (or you haven&apos;t added <code>/api/activity</code>).
            </p>
          ) : (
            <ul className={styles.activityList}>
              {activity.map((it: any, idx: number) => (
                <li key={it._id || idx} className={styles.activityItem}>
                  <div className={styles.activityTop}>
                    <p className={styles.activityItemTitle}>{it.title || it.type}</p>
                    <p className={styles.activityTime}>
                      {it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  {it.detail && <p className={styles.activityDetail}>{it.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={styles.negotiationWrap}>
        <AgentConversationView />
      </div>

      <div className={styles.negotiationWrap}>
        <LiveNegotiationFeed initialItems={activity} />
      </div>
    </Shell>
  );
}
