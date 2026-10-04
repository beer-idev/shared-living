import type { Metadata } from "next";
import { CalendarDays, CheckCircle2, ClipboardCheck, Hand, RotateCw, Shuffle } from "lucide-react";
import { completeTaskAction } from "@/app/actions/tasks";
import { Avatar } from "@/components/avatar";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusMessage } from "@/components/status-message";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskCompletedModal } from "@/components/task-completed-modal";
import { getAppContext, getNotifications, getTasks } from "@/lib/data";
import type { Task } from "@/lib/types";

export const metadata: Metadata = { title: "Tasks & Cleaning" };

function taskDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function bangkokDayKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function TaskCard({ task, index, currentUserId, isOwner }: { task: Task; index: number; currentUserId: string; isOwner: boolean }) {
  const fallback = { id: "", display_name: "?", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true };
  const completed = task.status === "completed";
  const AssignmentIcon = task.assignment_type === "rotation" ? RotateCw : task.assignment_type === "random" ? Shuffle : Hand;
  return (
    <TaskDetailModal task={task} currentUserId={currentUserId} index={index} completeAction={completeTaskAction} canComplete={!completed && (task.assigned_to === currentUserId || isOwner)}>
      <article className={`task-card${completed ? " is-completed" : ""}`}>
        <b className="task-points">+10</b>
        <h3>{task.title}</h3>
        <p>{task.description}</p>
        <div className="task-card-meta">
          <Avatar profile={task.assignee ?? fallback} index={index} size="sm" />
          <span className="task-card-assignee">{task.assignee?.display_name ?? "Unassigned"}</span>
          <em className="task-card-assignment"><AssignmentIcon size={11} aria-hidden="true" />{task.assignment_type}</em>
          <time dateTime={task.due_at}>{taskDate(task.due_at)}</time>
        </div>
        {completed && <div className="task-completed-strip"><CheckCircle2 size={14} /><span>Completed</span><b>{Object.values(task.reaction_counts ?? {}).reduce((sum, count) => sum + count, 0)} reactions</b></div>}
      </article>
    </TaskDetailModal>
  );
}

export default async function ChoresPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; completed?: string; reacted?: string; bonus?: string; task?: string; levelUp?: string }> }) {
  const [tasks, context, notifications, query] = await Promise.all([getTasks(), getAppContext(), getNotifications(), searchParams]);
  const isOwner = context.members.some((member) => member.user_id === context.userId && member.role === "owner");
  const todayKey = bangkokDayKey(new Date());
  const today = tasks.filter((task) => task.status === "pending" && bangkokDayKey(task.due_at) === todayKey);
  const upcoming = tasks.filter((task) => task.status === "pending" && bangkokDayKey(task.due_at) !== todayKey);
  const completed = tasks.filter((task) => task.status === "completed");
  const selectedTask = query.task ? tasks.find((task) => task.id === query.task) : null;
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
    <PageHeader title="Tasks & Cleaning" description="Fair chores, happy house" actionSlot={<CreateTaskDialog members={context.members} currentUserId={context.userId} />} unread={notifications.filter((item) => !item.read_at).length} />
    <StatusMessage error={query.error} success={query.created ? "Task created and added to the chore list." : query.completed ? "Task completed. +10 system points were added." : query.reacted ? query.bonus ? "Appreciation sent. The task owner received +5 bonus points." : "Appreciation updated. The one-time bonus was already awarded." : undefined} />
    {query.levelUp === "1" && <TaskCompletedModal open taskTitle={selectedTask?.title ?? "Your house"} isOwner={isOwner} />}
    {selectedTask && query.levelUp !== "1" && <TaskDetailModal task={selectedTask} currentUserId={context.userId} completeAction={completeTaskAction} canComplete={selectedTask.status === "pending" && (selectedTask.assigned_to === context.userId || isOwner)} autoOpen showTrigger={false} successMode={query.completed === "1"} />}
    {tasks.length === 0 ? <EmptyState icon={ClipboardCheck} title="No tasks yet" description="Create your first task and choose how it should be assigned." action={{ href: "/chores/new", label: "Create task" }} /> : <div className="figma-task-layout">
      <main>
        <section><h2>Today&apos;s tasks <span className="task-count">{today.length}</span></h2><div className="figma-task-grid">{today.map((task, index) => <TaskCard task={task} currentUserId={context.userId} isOwner={isOwner} index={index} key={task.id} />)}</div></section>
        <section><h2>Upcoming <span className="task-count">{upcoming.length}</span></h2><div className="figma-task-grid">{upcoming.map((task, index) => <TaskCard task={task} currentUserId={context.userId} isOwner={isOwner} index={index + today.length} key={task.id} />)}</div></section>
        <section><h2>Completed <span className="task-count">{completed.length}</span></h2><div className="figma-task-grid">{completed.map((task, index) => <TaskCard task={task} currentUserId={context.userId} isOwner={isOwner} index={index + 2} key={task.id} />)}</div></section>
      </main>
      <aside className="task-sidebar"><section className="task-calendar"><h2><CalendarDays size={16} /> {calendarLabel}</h2><div className="calendar-weekdays">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-grid">{calendarCells.map((day, index) => day ? <span className={day === calendarDate.getDate() ? "is-today" : ""} key={day}>{day}{taskDays.has(day) && <i />}</span> : <span className="calendar-empty" key={`empty-${index}`} />)}</div></section><section className="task-scoreboard"><h2>Score board</h2>{leaderboard.map((member, index) => <div key={member.user_id}><b>{index + 1}</b><Avatar profile={member.profile} index={index} size="sm" /><strong>{member.profile.display_name}</strong><span>{member.points}</span></div>)}</section></aside>
    </div>}
  </div>;
}
