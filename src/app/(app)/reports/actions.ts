"use server";

import { neon } from "@neondatabase/serverless";
import { auth } from "@/auth";
import { getMembers, getLoans, getSavingsAccounts, getTransactions, getMemberById } from "@/lib/data-service";

const sql = neon(process.env.DATABASE_URL!);

export type SkippedSavingsRow = {
  no: number;
  memberId: string;
  name: string;
  phone: string;
  monthlyContribution: number;
  paidShares: number;
  paidOther: number;
  isSkipped: boolean;
};

export async function getSkippedSavings(month: string): Promise<{ success: boolean; rows?: SkippedSavingsRow[]; error?: string }> {
  try {
    const session = await auth();
    const groupId = (session?.user as any)?.groupId ?? null;

    // month format: YYYY-MM
    const monthStart = `${month}-01`;

    const rows = await sql`
      SELECT
        m.id,
        m.name,
        m.phone_number,
        m.monthly_contribution,
        m.member_id,
        COALESCE(SUM(t.amount) FILTER (
          WHERE t.type = 'Deposit'
            AND DATE_TRUNC('month', t.date::date) = DATE_TRUNC('month', ${monthStart}::date)
        ), 0) AS paid_total
      FROM members m
      LEFT JOIN transactions t
        ON t.member_name = m.name
        AND t.group_id = ${groupId}
      WHERE m.status = 'Active'
        AND m.group_id = ${groupId}
      GROUP BY m.id, m.name, m.phone_number, m.monthly_contribution, m.member_id
      ORDER BY m.name
    `;

    const result: SkippedSavingsRow[] = rows.map((r, i) => {
      const required = Number(r.monthly_contribution) || 0;
      const paid = Number(r.paid_total) || 0;
      const paidShares = Math.min(paid, required);
      const paidOther = Math.max(0, paid - required);
      return {
        no: i + 1,
        memberId: r.member_id,
        name: r.name,
        phone: r.phone_number,
        monthlyContribution: required,
        paidShares,
        paidOther,
        isSkipped: paid < required,
      };
    });

    return { success: true, rows: result };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to load skipped savings." };
  }
}

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
