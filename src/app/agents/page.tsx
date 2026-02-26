// app/agents/page.tsx
import Shell from "@/components/Shell";
import AgentObserver from "@/components/AgentObserver";
import QuickstartGuide from "@/components/QuickstartGuide";

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
    </Shell>
  );
}
