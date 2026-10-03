import type { Metadata } from "next";
import { Bell, CheckCircle2, Heart, ReceiptText } from "lucide-react";
import Link from "next/link";
import { createCelebrationAction } from "@/app/actions/house";
import { CelebrationPlanner } from "@/components/celebration-planner";
import { HarmonyGrowthModal } from "@/components/harmony-growth-modal";
import { HarmonyMilestonesModal } from "@/components/harmony-milestones-modal";
import { StatusMessage } from "@/components/status-message";
import { TreeIllustration } from "@/components/tree-illustration";
import { getAppContext, getExpenses, getNotifications, getTasks } from "@/lib/data";

export const metadata: Metadata = { title: "House Harmony" };

const levels = [
  { level: 1, name: "Seed", range: "0+", threshold: 0, icon: "🌱" },
  { level: 2, name: "Small Plant", range: "20+", threshold: 20, icon: "🌿" },
  { level: 3, name: "Young Tree", range: "40+", threshold: 40, icon: "🌾" },
  { level: 4, name: "Healthy Tree", range: "60+", threshold: 60, icon: "🌳" },
  { level: 5, name: "Big Tree", range: "78+", threshold: 78, icon: "🌲" },
  { level: 6, name: "Dream House", range: "92+", threshold: 92, icon: "🏡" },
];

export default async function HarmonyPage({ searchParams }: { searchParams: Promise<{ error?: string; celebration?: string }> }) {
  const [context, notifications, tasks, expenses, query] = await Promise.all([getAppContext(), getNotifications(), getTasks(), getExpenses(), searchParams]);
  const score = context.house.harmony_score;
  const currentStage = [...levels].reverse().find((item) => score >= item.threshold) ?? levels[0];
  const nextStage = levels.find((item) => item.threshold > score);
  const pointsToNext = nextStage ? nextStage.threshold - score : 0;
  const owner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  const unread = notifications.filter((notification) => !notification.read_at).length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const settledBills = expenses.filter((expense) => expense.splits?.length && expense.splits.every((split) => split.is_paid)).length;
  const topContributors = [...context.members].sort((a, b) => b.points - a.points).slice(0, 3);

  return <div className="harmony-page">
    <header className="harmony-page__header">
      <div><h1>House Harmony</h1><p>Cooperate, grow the tree, celebrate together</p></div>
      <Link href="/notifications" aria-label={`${unread} unread notifications`}><Bell size={14} /><strong>{unread}</strong></Link>
    </header>
    <StatusMessage error={query.error} success={query.celebration ? "Celebration created. Your housemates will be notified." : undefined} />

    <section className="harmony-figma-hero">
      <div className="harmony-figma-hero__tree"><TreeIllustration /><span>{currentStage.name}</span></div>
      <div className="harmony-figma-hero__content">
        <span className="harmony-status-badge">{score >= 60 ? "Thriving house" : "Growing house"}</span>
        <h2><strong>{score}</strong><span>/100 <b>harmony</b></span></h2>
        <p>Level {currentStage.level} · {currentStage.name}{nextStage ? ` — ${pointsToNext} points to ${nextStage.name}` : " — You reached the top level"}</p>
        <div className="harmony-progress"><span style={{ width: `${score}%` }} /></div>
        <div className="harmony-hero-actions"><HarmonyMilestonesModal levels={levels} currentLevel={currentStage.level} triggerLabel="Level up house" /><HarmonyGrowthModal score={score} levelName={currentStage.name} /></div>
      </div>
    </section>

    <section className="harmony-levels" id="milestones" aria-label="Harmony levels">
      {levels.map((item) => <article className={item.level === currentStage.level ? "is-current" : item.level < currentStage.level ? "is-complete" : ""} key={item.level}><span className="harmony-level-icon" aria-hidden="true">{item.icon}</span><strong>{item.name}</strong><small>{item.range}</small></article>)}
    </section>

    <div className="harmony-bottom">
      <section className="harmony-celebration" id="celebration">
        <h2>House celebration</h2>
        <p>As the owner you can spend harmony on a reward — or keep growing the tree.</p>
        {owner ? <CelebrationPlanner action={createCelebrationAction} /> : <p className="celebration-note">The house owner can schedule the next celebration.</p>}
        <div className="harmony-continue"><HarmonyGrowthModal score={score} levelName={currentStage.name} /></div>
      </section>
      <aside className="harmony-scoring">
        <h2>What grows the tree</h2>
        <dl><div><dt><CheckCircle2 size={15} /> {completedTasks} tasks completed</dt><dd>+3 each</dd></div><div><dt><ReceiptText size={15} /> {settledBills} bills settled</dt><dd>+1 each</dd></div><div><dt><Heart size={15} /> Reactions given</dt><dd>+1 each</dd></div></dl>
        <h3>Top contributors</h3>
        <ol className="harmony-contributors">{topContributors.map((member, index) => <li key={member.user_id}><span aria-hidden="true">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span><strong>{member.profile.display_name}</strong><b>{member.points}</b></li>)}</ol>
      </aside>
    </div>
  </div>;
}
