// app/agents/page.tsx
import Shell from "@/components/Shell";

const baseUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

async function getAgents() {
  // server-side fetch to your own API
  const res = await fetch(`${baseUrl}/api/agents`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.agents || [];
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <Shell title="Agents" subtitle="Browse agents that have registered with the app.">
      <div className="grid gap-4 md:grid-cols-2">
        {agents.length === 0 ? (
          <div className="rounded-2xl border p-6 text-gray-600">
            No agents yet. Register one via <a className="underline" href="/skill.md">skill.md</a>.
          </div>
        ) : (
          agents.map((a: any) => (
            <div key={a._id || a.name} className="rounded-2xl border p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                  <p className="mt-2 text-gray-600">{a.description}</p>
                </div>
                <span className="text-xs rounded-full border px-2 py-1 text-gray-600">
                  {a.claimStatus}
                </span>
              </div>
              {a.lastActive && (
                <p className="mt-4 text-sm text-gray-500">
                  Last active: {new Date(a.lastActive).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
