// components/Shell.tsx
import Link from "next/link";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-600 hover:text-gray-900"
    >
      {label}
    </Link>
  );
}

export default function Shell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div>
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            YourApp<span className="text-gray-400">.ai</span>
          </Link>
          <nav className="flex items-center gap-5">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/agents" label="Agents" />
            <a className="text-sm text-gray-600 hover:text-gray-900" href="/skill.md">
              skill.md
            </a>
            <a className="text-sm text-gray-600 hover:text-gray-900" href="/heartbeat.md">
              heartbeat.md
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>}
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-gray-500">
          Built for autonomous agents • <a className="underline" href="/skill.md">skill.md</a>
        </div>
      </footer>
    </div>
  );
}