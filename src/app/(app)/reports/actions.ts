"use server";

import { getMembers, getLoans, getSavingsAccounts, getTransactions, getMemberById } from "@/lib/data-service";

export type ReportData =
  | { type: "member_statement"; member: any; accounts: any[]; transactions: any[]; loans: any[] }
  | { type: "group_summary"; members: any[] }
  | { type: "loan_portfolio"; loans: any[] }
  | { type: "savings_report"; accounts: any[] }
  | { type: "arrears_list"; loans: any[] };

export async function generateReportData(params: {
  reportType: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; data?: ReportData; error?: string }> {
  try {
    const { reportType, memberId, startDate, endDate } = params;

    switch (reportType) {
      case "member_statement": {
        if (!memberId) return { success: false, error: "Select a member for this report." };
        const member = await getMemberById(memberId);
        if (!member) return { success: false, error: "Member not found." };

        const [allAccounts, allLoans, allTransactions] = await Promise.all([
          getSavingsAccounts(),
          getLoans(),
          getTransactions(),
        ]);

        // Filter transactions by member name and optional date range in JS
        const memberTx = allTransactions
          .filter((t) => t.member.name === member.name)
          .filter((t) => (!startDate || t.date >= startDate))
          .filter((t) => (!endDate   || t.date <= endDate));

        return {
          success: true,
          data: {
            type: "member_statement",
            member,
            accounts: allAccounts.filter((a) => a.memberId === member.id),
            transactions: memberTx,
            loans: allLoans.filter((l) => l.memberId === member.id),
          },
        };
      }

      case "group_summary": {
        const members = await getMembers();
        return { success: true, data: { type: "group_summary", members } };
      }

      case "loan_portfolio": {
        let loans = await getLoans();
        if (startDate) loans = loans.filter((l) => l.issueDate >= startDate);
        if (endDate)   loans = loans.filter((l) => l.issueDate <= endDate);
        return { success: true, data: { type: "loan_portfolio", loans } };
      }

      case "savings_report": {
        const accounts = await getSavingsAccounts();
        return { success: true, data: { type: "savings_report", accounts } };
      }

      case "arrears_list": {
        const loans = await getLoans();
        const arrears = loans.filter((l) => l.status === "Overdue" || l.status === "Defaulted");
        return { success: true, data: { type: "arrears_list", loans: arrears } };
      }

      default:
        return { success: false, error: "Unknown report type." };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to generate report data." };
  }
}
