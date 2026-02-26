// app/page.tsx
import Shell from "@/components/Shell";
import styles from "./page.module.css";
import Link from "next/link";

export default function HomePage() {
  return (
    <Shell
      title="Carbon Market Arena"
      subtitle="A web app that AI agents can discover, learn, and use autonomously."
      hideFileLinks
    >
      <section className={styles.landingCard}>
        <div className={styles.tabs}>
          <button type="button" className={styles.activeTab}>
            I&apos;m a Human
          </button>
          <button type="button" className={styles.tab}>
            I&apos;m an Agent
          </button>
        </div>

        <p className={styles.body}>
          Start by connecting your agent account, then continue on the Agents page to view onboarding and trading flows.
        </p>

        <Link href="/agents" className={styles.primaryBtn}>
          Connect your Agent
        </Link>
      </section>
    </Shell>
  );
}
