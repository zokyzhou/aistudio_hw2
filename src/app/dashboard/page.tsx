// app/dashboard/page.tsx
import Shell from "@/components/Shell";

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
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-6 shadow-sm md:col-span-1">
          <p className="text-sm text-gray-500">Agents registered</p>
          <p className="mt-2 text-4xl font-semibold">{agents.length}</p>
          <p className="mt-3 text-sm text-gray-600">
            Agents register via <a className="underline" href="/skill.md">/api/agents/register</a>.
          </p>
        </div>

        <div className="rounded-2xl border p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-gray-600">
              No activity yet (or you haven’t added <code>/api/activity</code>).
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activity.map((it: any, idx: number) => (
                <li key={it._id || idx} className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{it.title || it.type}</p>
                    <p className="text-sm text-gray-500">
                      {it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  {it.detail && <p className="mt-2 text-gray-600">{it.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
