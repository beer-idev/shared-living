import type { Metadata } from "next";
import { CalendarDays, CheckCircle2, ClipboardCheck, Plus } from "lucide-react";
import { completeTaskAction } from "@/app/actions/tasks";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { getAppContext, getNotifications, getTasks } from "@/lib/data";
import type { Task } from "@/lib/types";

export const metadata: Metadata = { title: "Tasks & Cleaning" };

function taskPoints(title: string) {
  return ({
    "Kitchen deep clean": 30,
    "Take out the trash": 10,
    "Bathroom scrub": 25,
    "Grocery run": 20,
    "Living room tidy-up": 20,
    "Laundry room reset": 15,
  } as Record<string, number>)[title] ?? 10;
}

function taskDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const fallback = { id: "", display_name: "?", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true };
  const completed = task.status === "completed";
  return <TaskDetailModal task={task} index={index} completeAction={completeTaskAction} canComplete={!completed}><article className={completed ? "is-completed" : ""}><b className="task-points">+{taskPoints(task.title)}</b><h3>{task.title}</h3><p>{task.description}</p><div><Avatar profile={task.assignee ?? fallback} index={index} size="sm" /><span>{task.assignee?.display_name ?? "Unassigned"}</span><em>{task.assignment_type}</em></div><small>{taskDate(task.due_at)}</small>{completed && <div className="task-completed-strip"><CheckCircle2 size={14} /><span>Completed</span><b>3 reactions</b></div>}</article></TaskDetailModal>;
}

export default async function ChoresPage({ searchParams }: { searchParams: Promise<{ error?: string; completed?: string; task?: string }> }) {
  const [tasks, context, notifications, query] = await Promise.all([getTasks(), getAppContext(), getNotifications(), searchParams]);
  const todayKey = new Date().toDateString();
  const today = tasks.filter((task) => task.status === "pending" && new Date(task.due_at).toDateString() === todayKey);
  const upcoming = tasks.filter((task) => task.status === "pending" && new Date(task.due_at).toDateString() !== todayKey);
  const completed = tasks.filter((task) => task.status === "completed");
  const completedTask = query.task ? tasks.find((task) => task.id === query.task) : null;
  const calendarDate = new Date(tasks[0]?.due_at ?? new Date());
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const calendarLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(calendarDate);
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const taskDays = new Set(tasks.map((task) => { const date = new Date(task.due_at); return date.getFullYear() === calendarYear && date.getMonth() === calendarMonth ? date.getDate() : -1; }));
  const leaderboard = [...context.members].sort((a, b) => b.points - a.points);

  return <div className="figma-tasks">
    <PageHeader title="Tasks & Cleaning" description="Fair chores, happy house" action={{ href: "/chores/new", label: "New task", icon: Plus }} unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} />
    {completedTask && <TaskDetailModal task={completedTask} completeAction={completeTaskAction} autoOpen={query.completed === "1"} showTrigger={false} successMode={query.completed === "1"} />}
    {tasks.length === 0 ? <EmptyState icon={ClipboardCheck} title="No tasks yet" description="Create your first task and choose how it should be assigned." action={{ href: "/chores/new", label: "Create task" }} /> : <div className="figma-task-layout">
      <main>
        <section><h2>Today&apos;s tasks <span className="task-count">{today.length}</span></h2><div className="figma-task-grid">{today.map((task, index) => <TaskCard task={task} index={index} key={task.id} />)}</div></section>
        <section><h2>Upcoming <span className="task-count">{upcoming.length}</span></h2><div className="figma-task-grid">{upcoming.map((task, index) => <TaskCard task={task} index={index + today.length} key={task.id} />)}</div></section>
        <section><h2>Completed <span className="task-count">{completed.length}</span></h2><div className="figma-task-grid">{completed.map((task, index) => <TaskCard task={task} index={index + 2} key={task.id} />)}</div></section>
      </main>
      <aside className="task-sidebar"><section className="task-calendar"><h2><CalendarDays size={16} /> {calendarLabel}</h2><div className="calendar-weekdays">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-grid">{calendarCells.map((day, index) => day ? <span className={day === calendarDate.getDate() ? "is-today" : ""} key={day}>{day}{taskDays.has(day) && <i />}</span> : <span className="calendar-empty" key={`empty-${index}`} />)}</div></section><section className="task-scoreboard"><h2>Score board</h2>{leaderboard.map((member, index) => <div key={member.user_id}><b>{index + 1}</b><Avatar profile={member.profile} index={index} size="sm" /><strong>{member.profile.display_name}</strong><span>{member.points}</span></div>)}</section></aside>
    </div>}
  </div>;
}
