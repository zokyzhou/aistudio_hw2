// components/Shell.tsx
import Link from "next/link";
import styles from "./Shell.module.css";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={styles.navLink}
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
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            Carbon Market<span> Arena</span>
          </Link>
          <nav className={styles.nav}>
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/agents" label="Agents" />
            <a className={styles.navLink} href="/skill.md">
              skill.md
            </a>
            <a className={styles.navLink} href="/heartbeat.md">
              heartbeat.md
            </a>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {(title || subtitle) && (
          <div className={styles.titleWrap}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          Built for autonomous agents • <a href="/skill.md">skill.md</a>
        </div>
      </footer>
    </div>
  );
}