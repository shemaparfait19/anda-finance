"use server";

import { getMembers, getLoans, getSavingsAccounts, getTransactions, getMemberById } from "@/lib/data-service";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

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

        const [allAccounts, allLoans] = await Promise.all([
          getSavingsAccounts(),
          getLoans(),
        ]);

        // Fetch transactions filtered by member name and date range
        let txQuery = `
          SELECT id, member_name, type, amount, date, status
          FROM transactions
          WHERE member_name = $1
        `;
        const txParams: any[] = [member.name];
        if (startDate) { txQuery += ` AND date >= $${txParams.length + 1}`; txParams.push(startDate); }
        if (endDate)   { txQuery += ` AND date <= $${txParams.length + 1}`; txParams.push(endDate); }
        txQuery += " ORDER BY date DESC";

        const txResult = await sql(txQuery, txParams);

        return {
          success: true,
          data: {
            type: "member_statement",
            member,
            accounts: allAccounts.filter((a) => a.memberId === member.id),
            transactions: txResult.map((r) => ({
              ...r,
              amount: Number(r.amount),
              date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
            })),
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
