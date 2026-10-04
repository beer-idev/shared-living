import nextEnv from "@next/env";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

nextEnv.loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured.");

const credential = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      })
    : applicationDefault();

const firebase = getApps()[0] ?? initializeApp({ credential, projectId });
const auth = getAuth(firebase);
const firestore = getFirestore(firebase);

const userIds = {
  napat: "10000000-0000-0000-0000-000000000001",
  ploy: "10000000-0000-0000-0000-000000000002",
  kevin: "10000000-0000-0000-0000-000000000003",
  mei: "10000000-0000-0000-0000-000000000004",
};
const houseId = "20000000-0000-0000-0000-000000000001";
const password = "12345678";

const users = [
  { uid: userIds.napat, email: "napat@gmail.com", displayName: "Napat W." },
  { uid: userIds.ploy, email: "ploy@gmail.com", displayName: "Ploy S." },
  { uid: userIds.kevin, email: "kevin@gmail.com", displayName: "Kevin L." },
  { uid: userIds.mei, email: "mei@gmail.com", displayName: "Mei T." },
];

const now = new Date();
const nowIso = now.toISOString();
const bangkokDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(now);
const part = (type) => bangkokDateParts.find((item) => item.type === type)?.value;
const bangkokMidnight = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00+07:00`);
const hours = (value) => value * 60 * 60 * 1000;
const days = (value) => value * 24 * hours(1);
const isoAt = (offset) => new Date(bangkokMidnight.getTime() + offset).toISOString();
const dateAt = (offset) => isoAt(offset).slice(0, 10);
const monthsAgo = (value) => {
  const date = new Date(now);
  date.setUTCMonth(date.getUTCMonth() - value);
  return date.toISOString();
};

const expenseIds = [1, 2, 3, 4].map((value) => `30000000-0000-0000-0000-00000000000${value}`);
const taskIds = [1, 2, 3, 4].map((value) => `40000000-0000-0000-0000-00000000000${value}`);
const documents = [];
const add = (collection, id, data) => documents.push({ collection, id, data });

for (const user of users) {
  add("profiles", user.uid, {
    display_name: user.displayName,
    avatar_path: null,
    task_reminders: true,
    bill_alerts: true,
    house_activity: true,
    created_at: nowIso,
    updated_at: nowIso,
  });
}

add("houses", houseId, {
  name: "Sunrise House 402",
  invite_code: "SUNRISE402",
  currency: "THB",
  harmony_score: 10,
  created_by: userIds.napat,
  created_at: monthsAgo(6),
  updated_at: nowIso,
});
add("invite_codes", "SUNRISE402", { house_id: houseId });

for (const [index, user] of users.entries()) {
  add("house_members", user.uid, {
    house_id: houseId,
    role: index === 0 ? "owner" : "member",
    points: index === 0 ? 10 : 0,
    joined_at: monthsAgo(index === 0 ? 6 : index === 3 ? 4 : 5),
  });
}

const expenses = [
  {
    id: expenseIds[0], title: "Electricity bill — September", description: "Monthly electricity bill",
    category: "electricity", amount: 2480, paid_by: userIds.napat, expense_date: dateAt(-days(3)), created_by: userIds.napat,
  },
  {
    id: expenseIds[1], title: "Weekly groceries", description: "Fresh food and household essentials",
    category: "grocery", amount: 1860, paid_by: userIds.ploy, expense_date: dateAt(-days(2)), created_by: userIds.ploy,
  },
  {
    id: expenseIds[2], title: "Fiber internet", description: "September internet",
    category: "internet", amount: 899, paid_by: userIds.kevin, expense_date: dateAt(-days(7)), created_by: userIds.kevin,
  },
  {
    id: expenseIds[3], title: "September rent", description: "Monthly house rent",
    category: "rent", amount: 18000, paid_by: userIds.napat,
    expense_date: `${part("year")}-${part("month")}-01`, created_by: userIds.napat,
  },
];

for (const expense of expenses) {
  add("expenses", expense.id, {
    house_id: houseId,
    title: expense.title,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    paid_by: expense.paid_by,
    receipt_path: null,
    expense_date: expense.expense_date,
    created_by: expense.created_by,
    created_at: nowIso,
  });
  const splitAmount = Math.round((expense.amount / users.length) * 100) / 100;
  for (const user of users) {
    const isPaid = user.uid === expense.paid_by;
    add("expense_splits", `${expense.id}_${user.uid}`, {
      expense_id: expense.id,
      house_id: houseId,
      user_id: user.uid,
      amount: splitAmount,
      is_paid: isPaid,
      paid_at: isPaid ? nowIso : null,
    });
  }
}

const tasks = [
  {
    id: taskIds[0], title: "Kitchen deep clean", description: "Counters, sink, stove top and recycling.",
    due_at: isoAt(hours(18)), assignment_type: "rotation", assigned_to: userIds.ploy,
    status: "pending", completed_at: null, created_by: userIds.napat,
  },
  {
    id: taskIds[1], title: "Take out the trash", description: "All bins, including the balcony bin.",
    due_at: isoAt(hours(20)), assignment_type: "rotation", assigned_to: userIds.kevin,
    status: "pending", completed_at: null, created_by: userIds.napat,
  },
  {
    id: taskIds[2], title: "Water the plants", description: "Water indoor plants and the balcony herbs.",
    due_at: new Date(now.getTime() - hours(1)).toISOString(), assignment_type: "manual", assigned_to: userIds.napat,
    status: "completed", completed_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), created_by: userIds.napat,
  },
  {
    id: taskIds[3], title: "Bathroom scrub", description: "Shower glass, mirror and floor.",
    due_at: isoAt(days(1)), assignment_type: "random", assigned_to: userIds.mei,
    status: "pending", completed_at: null, created_by: userIds.ploy,
  },
];

for (const task of tasks) {
  add("tasks", task.id, {
    house_id: houseId,
    title: task.title,
    description: task.description,
    due_at: task.due_at,
    assignment_type: task.assignment_type,
    assigned_to: task.assigned_to,
    status: task.status,
    completion_photo_path: null,
    completed_at: task.completed_at,
    created_by: task.created_by,
    created_at: nowIso,
    overdue_penalty_applied: false,
    due_reminder_sent: false,
  });
}

add("harmony_events", "50000000-0000-0000-0000-000000000001", {
  house_id: houseId,
  user_id: userIds.napat,
  task_id: taskIds[2],
  points: 10,
  reason: "task_completed",
  created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
});

add("celebrations", "60000000-0000-0000-0000-000000000001", {
  house_id: houseId,
  title: "Movie night",
  details: "Pick a movie together and bring your favourite snack.",
  location: "Living room",
  starts_at: isoAt(days(1) + hours(19.5)),
  created_by: userIds.napat,
  created_at: nowIso,
});

const notifications = [
  {
    id: "70000000-0000-0000-0000-000000000001", type: "task",
    title: "Kitchen deep clean is due today", body: "Ploy has a task due at 6:00 PM.",
    href: `/chores/${taskIds[0]}`, created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "70000000-0000-0000-0000-000000000002", type: "expense",
    title: "Ploy added a shared expense", body: "Weekly groceries · ฿1,860",
    href: `/expenses/${expenseIds[1]}`, created_at: new Date(now.getTime() - hours(1)).toISOString(),
  },
  {
    id: "70000000-0000-0000-0000-000000000003", type: "task",
    title: "Water the plants was completed", body: "Napat earned 10 harmony points.",
    href: `/chores/${taskIds[2]}`, created_at: new Date(now.getTime() - days(1)).toISOString(),
  },
];

for (const notification of notifications) {
  const { id, ...data } = notification;
  add("notifications", id, {
    ...data,
    user_id: userIds.napat,
    house_id: houseId,
    read_at: null,
  });
}

const existingCollections = await firestore.listCollections();
const existingCounts = {};
for (const collection of existingCollections) {
  existingCounts[collection.id] = (await collection.count().get()).data().count;
}
const existingDocuments = Object.values(existingCounts).reduce((sum, count) => sum + count, 0);

const authPlan = [];
for (const user of users) {
  try {
    const existing = await auth.getUser(user.uid);
    if (existing.email?.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error(`Firebase UID ${user.uid} already belongs to another email.`);
    }
    authPlan.push({ ...user, action: "keep" });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    try {
      const existingByEmail = await auth.getUserByEmail(user.email);
      if (existingByEmail.uid !== user.uid) {
        throw new Error(`${user.email} already exists with another Firebase UID.`);
      }
      authPlan.push({ ...user, action: "keep" });
    } catch (emailError) {
      if (emailError?.code !== "auth/user-not-found") throw emailError;
      authPlan.push({ ...user, action: "create" });
    }
  }
}

console.log(`Firebase project: ${projectId}`);
console.log(`Seed plan: ${users.length} Auth accounts and ${documents.length} Firestore documents.`);
console.log(`Auth accounts to create: ${authPlan.filter((item) => item.action === "create").length}.`);
console.log(`Existing Firestore documents: ${existingDocuments}.`);

if (!apply) {
  console.log("Dry run only. Pass --apply to create the seed data.");
  process.exit(0);
}
if (existingDocuments > 0) {
  throw new Error(`Firestore is not empty (${JSON.stringify(existingCounts)}). Seed was not applied.`);
}

for (const user of authPlan) {
  if (user.action === "create") {
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      emailVerified: true,
      password,
      displayName: user.displayName,
    });
  } else {
    await auth.updateUser(user.uid, {
      emailVerified: true,
      password,
      displayName: user.displayName,
    });
  }
}

for (let index = 0; index < documents.length; index += 450) {
  const batch = firestore.batch();
  for (const item of documents.slice(index, index + 450)) {
    batch.create(firestore.collection(item.collection).doc(item.id), item.data);
  }
  await batch.commit();
}

console.log(`Created ${documents.length} Firestore documents.`);
console.log(`Demo login: ${users[0].email} / ${password}`);
