import type { Metadata } from "next";
import { CheckCircle2, CircleDot, Flower2, Heart, House, Sprout, TreeDeciduous } from "lucide-react";
import { createCelebrationAction } from "@/app/actions/house";
import { CelebrationPlanner } from "@/components/celebration-planner";
import { HarmonyGrowthModal } from "@/components/harmony-growth-modal";
import { HarmonyMilestonesModal } from "@/components/harmony-milestones-modal";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { TreeIllustration } from "@/components/tree-illustration";
import { getAppContext, getNotifications, getTasks } from "@/lib/data";
import { HARMONY_LEVELS, harmonyLevel } from "@/lib/harmony";

export const metadata: Metadata = { title: "House Harmony" };

const levelIcons = [CircleDot, Sprout, TreeDeciduous, Flower2, House];

export default async function HarmonyPage({ searchParams }: { searchParams: Promise<{ error?: string; celebration?: string }> }) {
  const [context, notifications, tasks, query] = await Promise.all([getAppContext(), getNotifications(), getTasks(), searchParams]);
  const score = context.house.harmony_score;
  const currentStage = harmonyLevel(score);
  const nextStage = HARMONY_LEVELS.find((item) => item.threshold > score);
  const pointsToNext = nextStage ? nextStage.threshold - score : 0;
  const owner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  const unread = notifications.filter((notification) => !notification.read_at).length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const overdueTasks = tasks.filter((task) => task.overdue_penalty_applied).length;
  const appreciatedTasks = tasks.filter((task) => Object.values(task.reaction_counts ?? {}).some((count) => count > 0)).length;
  const topContributors = [...context.members].sort((a, b) => b.points - a.points).slice(0, 3);

  return <div className="harmony-page">
    <PageHeader title="House Harmony" description="Cooperate, grow the tree, celebrate together" unread={unread} />
    <StatusMessage error={query.error} success={query.celebration ? "Celebration created. Your housemates will be notified." : undefined} />

    <section className="harmony-figma-hero">
      <div className="harmony-figma-hero__tree"><TreeIllustration /><span>{currentStage.name}</span></div>
      <div className="harmony-figma-hero__content">
        <span className="harmony-status-badge">{score >= 60 ? "Thriving house" : "Growing house"}</span>
        <h2><strong>{score}</strong><span>/100 <b>harmony</b></span></h2>
        <p>Level {currentStage.level} · {currentStage.name}{nextStage ? ` — ${pointsToNext} points to ${nextStage.name}` : " — You reached the top level"}</p>
        <div className="harmony-progress"><span style={{ width: `${score}%` }} /></div>
        <div className="harmony-hero-actions"><HarmonyMilestonesModal levels={HARMONY_LEVELS} currentLevel={currentStage.level} triggerLabel="View levels" /><HarmonyGrowthModal score={score} levelName={currentStage.name} /></div>
      </div>
    </section>

    <section className="harmony-levels" id="milestones" aria-label="Harmony levels">
      {HARMONY_LEVELS.map((item, index) => { const Icon = levelIcons[index]; return <article className={item.level === currentStage.level ? "is-current" : item.level < currentStage.level ? "is-complete" : ""} key={item.level}><span className="harmony-level-icon" aria-hidden="true"><Icon size={18} /></span><strong>{item.name}</strong><small>{item.range}</small></article>; })}
    </section>

    <div className="harmony-bottom">
      <section className="harmony-celebration" id="celebration">
        <h2>House celebration</h2>
        <p>When the house reaches a new level, celebrate together or keep growing. Celebrations do not spend harmony points.</p>
        {owner ? <CelebrationPlanner action={createCelebrationAction} /> : <p className="celebration-note">The house owner can schedule the next celebration.</p>}
        <div className="harmony-continue"><HarmonyGrowthModal score={score} levelName={currentStage.name} /></div>
      </section>
      <aside className="harmony-scoring">
        <h2>What grows the tree</h2>
        <dl><div><dt><CheckCircle2 size={15} /> {completedTasks} tasks completed</dt><dd>+10 each</dd></div><div><dt><TreeDeciduous size={15} /> {overdueTasks} overdue tasks</dt><dd>-5 each</dd></div><div><dt><Heart size={15} /> {appreciatedTasks} first appreciations</dt><dd>+5 each</dd></div></dl>
        <h3>Top contributors</h3>
        <ol className="harmony-contributors">{topContributors.map((member, index) => <li key={member.user_id}><span aria-hidden="true">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span><strong>{member.profile.display_name}</strong><b>{member.points}</b></li>)}</ol>
      </aside>
    </div>
  </div>;
}
