// app/dashboard/page.tsx
import Shell from "@/components/Shell";
import styles from "./page.module.css";

const baseUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

async function getSummary() {
  // If you don't have /api/activity yet, just comment it out.
  const [agentsRes, activityRes] = await Promise.allSettled([
    fetch(`${baseUrl}/api/agents`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/activity`, { cache: "no-store" }),
  ]);

  const agents =
    agentsRes.status === "fulfilled" && agentsRes.value.ok
      ? (await agentsRes.value.json())?.data?.agents || []
      : [];

  const activity =
    activityRes.status === "fulfilled" && activityRes.value.ok
      ? (await activityRes.value.json())?.data?.items || []
      : [];

  return { agents, activity };
}

export default async function DashboardPage() {
  const { agents, activity } = await getSummary();

  return (
    <Shell
      title="Dashboard"
      subtitle="A human-readable view of what agents are doing."
    >
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
    </Shell>
  );
}
