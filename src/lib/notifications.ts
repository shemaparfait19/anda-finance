"use server";

import { getLoans } from "./data-service";

export type AppNotification = {
  id: string;
  type: "overdue" | "pending" | "defaulted";
  title: string;
  description: string;
  href: string;
};

export async function getNotifications(): Promise<AppNotification[]> {
  const loans = await getLoans();
  const notes: AppNotification[] = [];

  const overdue = loans.filter((l) => l.status === "Overdue");
  const defaulted = loans.filter((l) => l.status === "Defaulted");
  const pending = loans.filter((l) => l.status === "Pending");

  if (overdue.length > 0) {
    notes.push({
      id: "overdue",
      type: "overdue",
      title: `${overdue.length} overdue loan${overdue.length > 1 ? "s" : ""}`,
      description: `RWF ${overdue.reduce((s, l) => s + l.balance, 0).toLocaleString()} at risk`,
      href: "/loans",
    });
  }

  if (defaulted.length > 0) {
    notes.push({
      id: "defaulted",
      type: "defaulted",
      title: `${defaulted.length} defaulted loan${defaulted.length > 1 ? "s" : ""}`,
      description: `RWF ${defaulted.reduce((s, l) => s + l.balance, 0).toLocaleString()} unrecovered`,
      href: "/loans",
    });
  }

  if (pending.length > 0) {
    notes.push({
      id: "pending",
      type: "pending",
      title: `${pending.length} loan${pending.length > 1 ? "s" : ""} awaiting approval`,
      description: "Review and approve pending loan applications",
      href: "/loans",
    });
  }

  return notes;
}
