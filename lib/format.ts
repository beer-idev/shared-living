export function formatMoney(amount: number, currency = "THB") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", ...(options ?? { day: "numeric", month: "short", year: "numeric" }) }).format(new Date(value));
}

export function formatDateInput(value = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(value)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
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
  if (score >= 92) return { level: 6, name: "Dream House" };
  if (score >= 78) return { level: 5, name: "Big Tree" };
  if (score >= 60) return { level: 4, name: "Healthy Tree" };
  if (score >= 40) return { level: 3, name: "Young Tree" };
  if (score >= 20) return { level: 2, name: "Small Plant" };
  return { level: 1, name: "Seed" };
}
