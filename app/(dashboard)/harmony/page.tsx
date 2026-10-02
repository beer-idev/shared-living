import type { Metadata } from "next";
import { Bell, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createCelebrationAction } from "@/app/actions/house";
import { CelebrationPlanner } from "@/components/celebration-planner";
import { HarmonyGrowthModal } from "@/components/harmony-growth-modal";
import { HarmonyMilestonesModal } from "@/components/harmony-milestones-modal";
import { StatusMessage } from "@/components/status-message";
import { TreeIllustration } from "@/components/tree-illustration";
import { getAppContext, getNotifications } from "@/lib/data";
import { harmonyLevel } from "@/lib/format";

export const metadata: Metadata = { title: "House Harmony" };

const levels = [
  { level: 1, name: "Needs Improvement", range: "0–20%" },
  { level: 2, name: "Getting Better", range: "21–40%" },
  { level: 3, name: "Comfortable Home", range: "41–60%" },
  { level: 4, name: "Cozy Home", range: "61–80%" },
  { level: 5, name: "Harmony Home", range: "81–100%" },
];

export default async function HarmonyPage({ searchParams }: { searchParams: Promise<{ error?: string; celebration?: string }> }) {
  const [context, notifications, query] = await Promise.all([getAppContext(), getNotifications(), searchParams]);
  const harmony = harmonyLevel(context.house.harmony_score);
  const owner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  const unread = notifications.filter((notification) => !notification.read_at).length;

  return <div className="harmony-page">
    <header className="harmony-page__header">
      <div><h1>House Harmony</h1><p>Cooperate, grow the tree, celebrate together</p></div>
      <Link href="/notifications" aria-label={`${unread} unread notifications`}><Bell size={14} /><strong>{unread}</strong></Link>
    </header>
    <StatusMessage error={query.error} success={query.celebration ? "Celebration created. Your housemates will be notified." : undefined} />

    <section className="harmony-figma-hero">
      <div className="harmony-figma-hero__tree"><TreeIllustration /></div>
      <div className="harmony-figma-hero__content">
        <p>Level {harmony.level} · {harmony.name}</p>
        <h2>{context.house.harmony_score} / 100 <span>harmony</span></h2>
        <p>You reached the {harmony.level === 5 ? "highest" : `level ${harmony.level}`} level. Keep looking after your home.</p>
        <div className="harmony-progress"><span style={{ width: `${context.house.harmony_score}%` }} /></div>
        <div className="harmony-hero-actions"><HarmonyMilestonesModal levels={levels} currentLevel={harmony.level} /><HarmonyGrowthModal score={context.house.harmony_score} levelName={harmony.name} /></div>
      </div>
    </section>

    <section className="harmony-levels" id="milestones" aria-label="Harmony levels">
      {levels.map((item) => <article className={item.level === harmony.level ? "is-current" : item.level < harmony.level ? "is-complete" : ""} key={item.level}><small>Level {item.level}</small><strong>{item.name}</strong><span>{item.range}</span></article>)}
    </section>

    <div className="harmony-bottom">
      <section className="harmony-celebration" id="celebration">
        <h2>House celebration</h2>
        <p>Celebrate a level up with something you all enjoy.</p>
        {owner ? <CelebrationPlanner action={createCelebrationAction} /> : <p className="celebration-note">The house owner can schedule the next celebration.</p>}
      </section>
      <aside className="harmony-scoring">
        <h2>What grows the tree</h2>
        <dl><div><dt><CheckCircle2 size={15} /> Task completed</dt><dd>+10</dd></div><div><dt><Sparkles size={15} /> First appreciation</dt><dd>+5</dd></div></dl>
        <p>System Score is the main score. Community Bonus is awarded once per task.</p>
        <strong>Celebrating never spends or resets harmony.</strong>
      </aside>
    </div>
  </div>;
}
