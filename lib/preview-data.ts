import type { AppContext, Expense, Notification, Task } from "./types";

const ids = {
  napat: "10000000-0000-0000-0000-000000000001",
  ploy: "10000000-0000-0000-0000-000000000002",
  kevin: "10000000-0000-0000-0000-000000000003",
  mei: "10000000-0000-0000-0000-000000000004",
};

const profiles = {
  napat: { id: ids.napat, display_name: "Napat W.", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true },
  ploy: { id: ids.ploy, display_name: "Ploy S.", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true },
  kevin: { id: ids.kevin, display_name: "Kevin L.", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true },
  mei: { id: ids.mei, display_name: "Mei T.", avatar_path: null, task_reminders: true, bill_alerts: true, house_activity: true },
};

export const previewContext: AppContext = {
  preview: true,
  userId: ids.napat,
  email: "napat@example.com",
  profile: profiles.napat,
  house: {
    id: "20000000-0000-0000-0000-000000000001",
    name: "Sunrise House 402",
    invite_code: "SUNRISE402",
    currency: "THB",
    harmony_score: 82,
  },
  members: [
    { user_id: ids.napat, role: "owner", profile: profiles.napat, points: 145 },
    { user_id: ids.ploy, role: "member", profile: profiles.ploy, points: 130 },
    { user_id: ids.kevin, role: "member", profile: profiles.kevin, points: 105 },
    { user_id: ids.mei, role: "member", profile: profiles.mei, points: 95 },
  ],
};

export const previewExpenses: Expense[] = [
  { id: "30000000-0000-0000-0000-000000000001", title: "Electricity bill — July", description: "Monthly electricity bill", category: "electricity", amount: 2480, expense_date: "2026-08-02", paid_by: ids.napat, payer: profiles.napat },
  { id: "30000000-0000-0000-0000-000000000002", title: "Weekly groceries", description: "Fresh food and household essentials", category: "grocery", amount: 1860, expense_date: "2026-08-02", paid_by: ids.ploy, payer: profiles.ploy },
  { id: "30000000-0000-0000-0000-000000000003", title: "Fiber internet", description: "Home internet", category: "internet", amount: 899, expense_date: "2026-08-02", paid_by: ids.kevin, payer: profiles.kevin },
  { id: "30000000-0000-0000-0000-000000000004", title: "August rent", description: "Monthly house rent", category: "rent", amount: 18000, expense_date: "2026-08-01", paid_by: ids.napat, payer: profiles.napat },
  { id: "30000000-0000-0000-0000-000000000005", title: "Cleaning supplies", description: "Shared cleaning products", category: "other", amount: 640, expense_date: "2026-08-04", paid_by: ids.mei, payer: profiles.mei },
  { id: "30000000-0000-0000-0000-000000000006", title: "Movie night snacks", description: "Snacks for the house", category: "other", amount: 520, expense_date: "2026-08-06", paid_by: ids.ploy, payer: profiles.ploy },
];

const today = new Date();
export const previewTasks: Task[] = [
  { id: "40000000-0000-0000-0000-000000000001", title: "Kitchen deep clean", description: "Counters, sink, stove top and recycling.", due_at: new Date(today.setHours(18, 0, 0, 0)).toISOString(), assignment_type: "rotation", assigned_to: ids.ploy, assignee: profiles.ploy, status: "pending", completion_photo_path: null, completed_at: null },
  { id: "40000000-0000-0000-0000-000000000002", title: "Take out the trash", description: "All bins, including the balcony bin.", due_at: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), assignment_type: "rotation", assigned_to: ids.kevin, assignee: profiles.kevin, status: "pending", completion_photo_path: null, completed_at: null },
  { id: "40000000-0000-0000-0000-000000000003", title: "Water the plants", description: "Water indoor plants and balcony herbs.", due_at: new Date(Date.now() - 3600000).toISOString(), assignment_type: "manual", assigned_to: ids.napat, assignee: profiles.napat, status: "completed", completion_photo_path: "demo/water-plants.webp", completed_at: new Date(Date.now() - 2700000).toISOString() },
  { id: "40000000-0000-0000-0000-000000000004", title: "Bathroom scrub", description: "Shower glass, mirror and floor.", due_at: new Date(Date.now() + 86400000).toISOString(), assignment_type: "random", assigned_to: ids.mei, assignee: profiles.mei, status: "pending", completion_photo_path: null, completed_at: null },
  { id: "40000000-0000-0000-0000-000000000005", title: "Grocery run", description: "Use the shared list on the fridge.", due_at: new Date(Date.now() + 172800000).toISOString(), assignment_type: "manual", assigned_to: ids.napat, assignee: profiles.napat, status: "pending", completion_photo_path: null, completed_at: null },
  { id: "40000000-0000-0000-0000-000000000006", title: "Living room tidy-up", description: "Cushions, table and the rug.", due_at: new Date(Date.now() - 172800000).toISOString(), assignment_type: "rotation", assigned_to: ids.napat, assignee: profiles.napat, status: "completed", completion_photo_path: "demo/living-room.webp", completed_at: new Date(Date.now() - 86400000).toISOString() },
];

export const previewNotifications: Notification[] = [
  { id: "70000000-0000-0000-0000-000000000001", type: "task", title: "Kitchen deep clean is due today", body: "Ploy has a task due at 6:00 PM.", href: "/chores/40000000-0000-0000-0000-000000000001", read_at: null, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: "70000000-0000-0000-0000-000000000002", type: "expense", title: "Ploy added a shared expense", body: "Weekly groceries · ฿1,860", href: "/expenses/30000000-0000-0000-0000-000000000002", read_at: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "70000000-0000-0000-0000-000000000003", type: "harmony", title: "Your house reached Harmony Home", body: "Level 5 is ready to celebrate.", href: "/harmony", read_at: null, created_at: new Date(Date.now() - 86400000).toISOString() },
];
