import nextEnv from "@next/env";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { put } from "@vercel/blob";
import { randomBytes } from "node:crypto";

nextEnv.loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
const sourceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!sourceUrl || !sourceKey || !projectId) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY), and FIREBASE_PROJECT_ID before running the migration.");
}

const credential = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") })
    : applicationDefault();
const firebase = getApps()[0] ?? initializeApp({ credential, projectId });
const auth = getAuth(firebase);
const firestore = getFirestore(firebase);

async function sourceJson(url) {
  const response = await fetch(url, {
    headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}) for ${new URL(url).pathname}`);
  return response.json();
}

async function table(name) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const url = new URL(`${sourceUrl}/rest/v1/${name}`);
    url.searchParams.set("select", "*");
    url.searchParams.set("limit", "1000");
    url.searchParams.set("offset", String(offset));
    const page = await sourceJson(url);
    if (!Array.isArray(page)) throw new Error(`Supabase did not return rows for ${name}`);
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

async function sourceUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const url = new URL(`${sourceUrl}/auth/v1/admin/users`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "1000");
    const result = await sourceJson(url);
    if (!Array.isArray(result.users)) throw new Error("Supabase Auth did not return a user list");
    users.push(...result.users);
    if (result.users.length < 1000) return users;
  }
}

function sourceObjectPath(bucket, value) {
  if (!value) return null;
  let path = String(value);
  if (path.startsWith("https://")) {
    let parsed;
    try { parsed = new URL(path); } catch { return null; }
    if (parsed.hostname !== new URL(sourceUrl).hostname) return null;
    path = decodeURIComponent(parsed.pathname);
    const match = path.match(new RegExp(`/storage/v1/object/(?:public|authenticated|sign)/${bucket}/(.+)$`));
    if (!match) return null;
    return match[1];
  }
  const bucketPrefix = `${bucket}/`;
  if (path.startsWith(bucketPrefix)) path = path.slice(bucketPrefix.length);
  path = path.replace(/^\/+/, "");
  return path || null;
}

async function moveStorageObject(bucket, oldValue, newPath) {
  const objectPath = sourceObjectPath(bucket, oldValue);
  if (!objectPath) return oldValue ?? null;
  const url = `${sourceUrl}/storage/v1/object/authenticated/${bucket}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, { headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Could not read a legacy ${bucket} file (${response.status}).`);
  const contentType = (response.headers.get("content-type") || "application/octet-stream").split(";")[0].toLowerCase();
  const content = new Uint8Array(await response.arrayBuffer());
  if (content.length > 5 * 1024 * 1024) throw new Error(`Legacy file exceeds 5 MB: ${objectPath}`);
  if (!content.length) throw new Error(`Legacy file is empty: ${objectPath}`);
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : contentType === "image/jpeg" ? "jpg" : contentType === "application/pdf" && bucket === "expense-receipts" ? "pdf" : null;
  if (!extension) throw new Error(`Unsupported legacy file type for ${objectPath}: ${contentType}`);
  const blob = await put(`${newPath}.${extension}`, content, { access: "public", contentType, addRandomSuffix: false, allowOverwrite: true });
  return blob.url;
}

const [profiles, houses, memberships, expenses, splits, tasks, reactions, harmonyEvents, celebrations, notifications, users] = await Promise.all([
  table("profiles"), table("houses"), table("house_members"), table("expenses"), table("expense_splits"),
  table("tasks"), table("task_reactions"), table("harmony_events"), table("celebrations"), table("notifications"), sourceUsers(),
]);

const emailById = new Map(users.filter((user) => user.email).map((user) => [user.id, user]));
const profileById = new Map(profiles.map((profile) => [profile.id, {
  id: profile.id,
  display_name: profile.display_name,
  avatar_path: null,
  task_reminders: profile.task_reminders ?? true,
  bill_alerts: profile.bill_alerts ?? true,
  house_activity: profile.house_activity ?? true,
}]));
const housesByUser = new Map();
for (const membership of memberships) {
  const existing = housesByUser.get(membership.user_id);
  if (existing && existing !== membership.house_id) throw new Error(`User ${membership.user_id} belongs to multiple houses; the current app supports one house per account.`);
  housesByUser.set(membership.user_id, membership.house_id);
}

const pointsByUser = new Map();
for (const event of harmonyEvents) pointsByUser.set(event.user_id, (pointsByUser.get(event.user_id) ?? 0) + Number(event.points ?? 0));
const documents = new Map();
function add(collection, id, data) {
  if (!id) throw new Error(`Missing document ID in ${collection}`);
  documents.set(`${collection}/${id}`, { collection, id, data });
}

for (const profile of profiles) add("profiles", profile.id, profileById.get(profile.id));
for (const house of houses) {
  add("houses", house.id, house);
  add("invite_codes", house.invite_code.toUpperCase(), { house_id: house.id });
}
for (const membership of memberships) {
  const profile = profileById.get(membership.user_id);
  if (!profile) throw new Error(`Missing profile for member ${membership.user_id}`);
  add("house_members", membership.user_id, {
    house_id: membership.house_id, role: membership.role,
    points: pointsByUser.get(membership.user_id) ?? 0, joined_at: membership.joined_at,
  });
}
for (const expense of expenses) {
  add("expenses", expense.id, { ...expense, amount: Number(expense.amount) });
}
for (const split of splits) {
  const parent = expenses.find((expense) => expense.id === split.expense_id);
  if (!parent) throw new Error(`Missing expense ${split.expense_id} for split ${split.id}`);
  add("expense_splits", split.id, { ...split, house_id: parent.house_id, amount: Number(split.amount), is_paid: Boolean(split.is_paid) });
}
for (const task of tasks) {
  add("tasks", task.id, { ...task, overdue_penalty_applied: false, due_reminder_sent: false });
}
for (const reaction of reactions) {
  const parent = tasks.find((task) => task.id === reaction.task_id);
  if (!parent) throw new Error(`Missing task ${reaction.task_id} for reaction ${reaction.id}`);
  add("task_reactions", `${reaction.task_id}_${reaction.user_id}`, { ...reaction, house_id: parent.house_id });
}
for (const celebration of celebrations) add("celebrations", celebration.id, celebration);
for (const notification of notifications) add("notifications", notification.id, notification);
for (const event of harmonyEvents) {
  const id = event.reason === "first_appreciation" ? `${event.task_id}_first_appreciation` : event.id;
  add("harmony_events", id, event);
}

for (const userId of housesByUser.keys()) {
  if (!emailById.has(userId)) throw new Error(`No email address was returned by Supabase Auth for member ${userId}.`);
}

const collections = [...new Set([...documents.values()].map(({ collection }) => collection))];
const existingCounts = {};
for (const collection of collections) existingCounts[collection] = (await firestore.collection(collection).listDocuments()).length;
const alreadyHasData = Object.values(existingCounts).some((count) => count > 0);
const usersToCreate = [];
const importedEmails = new Map();
for (const userId of housesByUser.keys()) {
  const sourceUser = emailById.get(userId);
  const emailKey = sourceUser.email.toLowerCase();
  if (importedEmails.has(emailKey) && importedEmails.get(emailKey) !== userId) throw new Error(`Supabase contains more than one account for ${sourceUser.email}.`);
  importedEmails.set(emailKey, userId);
  try {
    const existing = await auth.getUser(userId);
    if (existing.email?.toLowerCase() !== emailKey) throw new Error(`Firebase UID ${userId} already belongs to a different email.`);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    try {
      await auth.getUserByEmail(sourceUser.email);
      throw new Error(`Firebase already has an account for ${sourceUser.email} with a different user ID.`);
    } catch (emailError) {
      if (emailError?.code !== "auth/user-not-found") throw emailError;
    }
    usersToCreate.push({ userId, sourceUser });
  }
}
const legacyMedia = [
  ...expenses.filter((expense) => sourceObjectPath("expense-receipts", expense.receipt_path)).map((expense) => ({ bucket: "expense-receipts", value: expense.receipt_path, path: `expense-receipts/${expense.house_id}/${expense.id}/receipt` })),
  ...tasks.filter((task) => sourceObjectPath("task-proofs", task.completion_photo_path)).map((task) => ({ bucket: "task-proofs", value: task.completion_photo_path, path: `task-proofs/${task.id}/${task.assigned_to || task.created_by}/proof` })),
];

console.log(`Supabase data: ${documents.size} Firestore documents across ${collections.length} collections.`);
console.log(`Members requiring Firebase Auth accounts: ${housesByUser.size}.`);
console.log(`Legacy Storage files to copy to Vercel Blob: ${legacyMedia.length}.`);
console.log(`Existing Firebase documents in destination collections: ${Object.entries(existingCounts).filter(([, count]) => count > 0).map(([name, count]) => `${name}=${count}`).join(", ") || "none"}.`);
if (!apply) {
  console.log("Dry run only. Review the counts, then pass --apply to write the data.");
  process.exit(0);
}
if (alreadyHasData) throw new Error("Target Firestore collections already contain data; export/clear or review the Firebase project before importing.");
if (legacyMedia.length && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Set BLOB_READ_WRITE_TOKEN before copying legacy photos.");

const migratedMedia = new Map();
for (const item of legacyMedia) migratedMedia.set(`${item.bucket}:${item.value}`, await moveStorageObject(item.bucket, item.value, item.path));
for (const expense of expenses) if (expense.receipt_path) {
  const path = migratedMedia.get(`expense-receipts:${expense.receipt_path}`) ?? expense.receipt_path;
  const doc = documents.get(`expenses/${expense.id}`);
  if (doc) doc.data.receipt_path = path;
}
for (const task of tasks) if (task.completion_photo_path) {
  const path = migratedMedia.get(`task-proofs:${task.completion_photo_path}`) ?? task.completion_photo_path;
  const doc = documents.get(`tasks/${task.id}`);
  if (doc) doc.data.completion_photo_path = path;
}

let createdUsers = 0;
for (const { userId, sourceUser } of usersToCreate) {
  const profile = profileById.get(userId);
  const temporaryPassword = randomBytes(32).toString("base64url");
  await auth.createUser({ uid: userId, email: sourceUser.email, emailVerified: Boolean(sourceUser.email_confirmed_at), displayName: profile?.display_name, password: temporaryPassword });
  createdUsers++;
}

const writes = [...documents.values()];
for (let index = 0; index < writes.length; index += 450) {
  const batch = firestore.batch();
  for (const item of writes.slice(index, index + 450)) batch.set(firestore.collection(item.collection).doc(item.id), item.data);
  await batch.commit();
}

console.log(`Imported ${writes.length} Firestore documents and created ${createdUsers} Firebase accounts.`);
console.log("Users received random temporary passwords that cannot be recovered from Supabase. They must reset their Firebase passwords before signing in.");
console.log("Receipt and task-proof files were copied from Supabase Storage to Vercel Blob.");
