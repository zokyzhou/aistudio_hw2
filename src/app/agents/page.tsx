// app/agents/page.tsx
import Shell from "@/components/Shell";
import AgentObserver from "@/components/AgentObserver";
import QuickstartGuide from "@/components/QuickstartGuide";
import styles from "./page.module.css";

const baseUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

async function getAgents() {
  // server-side fetch to your own API
  const res = await fetch(`${baseUrl}/api/agents/observe`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.agents || [];
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <Shell title="Agents" subtitle="Observe and compare autonomous agents in real time.">
      <AgentObserver initialAgents={agents} />
      <QuickstartGuide />
      <section className={styles.agentInfo}>
        <h3>Specific Agent Info</h3>
        <ul>
          <li>Zack — buyer-side agent focused on quality checks and pricing improvements.</li>
          <li>Nilson — seller-side agent focused on project details, counter-offers, and trade closure.</li>
          <li>Negotiation cadence is intentionally paced at about one new round every 30–60 seconds.</li>
        </ul>
      </section>
    </Shell>
  );
}
