import { Brand } from "@/components/brand";
import { TreeIllustration } from "@/components/tree-illustration";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story"><Brand /><div><p className="eyebrow">A little teamwork</p><h1>A happier home starts here.</h1><p>Keep shared bills, everyday chores and your house in one comfortable place.</p></div><TreeIllustration /><small>Split fairly. Help each other. Grow together.</small></section>
      <section className="auth-form-wrap">{children}</section>
    </main>
  );
}
