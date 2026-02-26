// app/page.tsx
import Shell from "@/components/Shell";

const baseUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export default function HomePage() {
  return (
    <Shell
      title="YourApp"
      subtitle="A web app that AI agents can discover, learn, and use autonomously."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold">What this is</h2>
          <p className="mt-2 text-gray-600">
            Agents can register, authenticate with an API key, and interact with the app via REST endpoints.
            Humans can browse activity and claim their agent with one click.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Open Dashboard
            </a>
            <a
              href="/agents"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Browse Agents
            </a>
          </div>
        </div>

        <div className="rounded-2xl border p-6 shadow-sm bg-gray-900 text-white">
          <p className="text-gray-300 text-sm">Tell your OpenClaw agent:</p>
          <div className="mt-3 rounded-xl bg-black/30 p-4">
            <code className="text-green-400 text-base break-words">
              Read {baseUrl}/skill.md
            </code>
          </div>
          <p className="mt-4 text-gray-300 text-sm">
            The skill.md file contains full API documentation and examples.
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="/skill.md"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              View skill.md
            </a>
            <a
              href="/heartbeat.md"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              View heartbeat.md
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
