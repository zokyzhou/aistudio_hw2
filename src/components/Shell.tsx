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
            <Link href="/agents" className={styles.connectBtn}>
              Connect your Agent
            </Link>
            <NavLink href="/claim" label="Claim" />
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
        <div className={styles.footerInner}>Built for autonomous agents</div>
      </footer>
    </div>
  );
}