export type Profile = {
  id: string;
  display_name: string;
  avatar_path: string | null;
  task_reminders: boolean;
  bill_alerts: boolean;
  house_activity: boolean;
};

export type House = {
  id: string;
  name: string;
  invite_code: string;
  currency: string;
  harmony_score: number;
  created_at?: string;
};

export type Member = {
  user_id: string;
  role: "owner" | "member";
  profile: Profile;
  points: number;
  joined_at?: string;
};

export type Expense = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  expense_date: string;
  paid_by: string;
  payer: Profile;
  receipt_path?: string | null;
  splits?: ExpenseSplit[];
};

export type ExpenseSplit = {
  id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string | null;
  profile: Profile;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string;
  assignment_type: "manual" | "random" | "rotation";
  assigned_to: string | null;
  assignee: Profile | null;
  status: "pending" | "completed";
  completion_photo_path: string | null;
  completed_at: string | null;
  overdue_penalty_applied?: boolean;
  reaction_counts?: { appreciate: number; thanks: number; looks_great: number };
  my_reaction?: "appreciate" | "thanks" | "looks_great" | null;
};

export type Notification = {
  id: string;
  type: "expense" | "task" | "harmony" | "celebration" | "member";
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type AppContext = {
  preview: boolean;
  userId: string;
  email: string;
  profile: Profile;
  house: House;
  members: Member[];
};

export type ExpenseSummary = {
  total: number;
  owed: number;
  owedCount: number;
  receivable: number;
  receivableCount: number;
  settledPercent: number;
};

export type MemberStats = Record<string, { chores: number; bills: number; thanks: number }>;

export type HouseDebt = { userId: string; name: string; amount: number };

export type Celebration = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
};
