export function formatMoney(amount: number, currency = "THB") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", ...(options ?? { day: "numeric", month: "short", year: "numeric" }) }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

export function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function harmonyLevel(score: number) {
  if (score <= 20) return { level: 1, name: "Needs Improvement" };
  if (score <= 40) return { level: 2, name: "Getting Better" };
  if (score <= 60) return { level: 3, name: "Comfortable Home" };
  if (score <= 80) return { level: 4, name: "Cozy Home" };
  return { level: 5, name: "Harmony Home" };
}
