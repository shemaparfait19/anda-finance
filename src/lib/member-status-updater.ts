/**
 * Member Status Auto-Updater
 * 
 * Business Rules:
 * - Inactive: Member misses 1 month of savings
 * - Dormant: Member misses 3 months of savings
 * 
 * This service automatically updates member statuses based on their last contribution date.
 */

import { neon } from "@neondatabase/serverless";

interface Member {
  id: string;
  memberId: string;
  name: string;
  status: string;
  contributionDate?: string;
  monthlyContribution?: number;
}

/**
 * Calculate the number of months between two dates
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
  const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthsDiff = endDate.getMonth() - startDate.getMonth();
  return yearsDiff * 12 + monthsDiff;
}

/**
 * Determine the appropriate status based on missed months
 */
function determineStatus(missedMonths: number): string {
  if (missedMonths >= 3) {
    return 'Dormant';
  } else if (missedMonths >= 1) {
    return 'Inactive';
  }
  return 'Active';
}

/**
 * Update member statuses based on missed contributions
 * This function should be called periodically (e.g., daily via cron job)
 */
export async function updateMemberStatuses(): Promise<{
  updated: number;
  details: Array<{ memberId: string; name: string; oldStatus: string; newStatus: string; missedMonths: number }>;
}> {
  const sql = neon(process.env.DATABASE_URL!);
  const today = new Date();
  const updates: Array<{ memberId: string; name: string; oldStatus: string; newStatus: string; missedMonths: number }> = [];

  try {
    // Get all active, inactive, and dormant members (exclude closed and temporary inactive)
    const members = await sql`
      SELECT id, member_id as "memberId", name, status, contribution_date as "contributionDate", monthly_contribution as "monthlyContribution"
      FROM members 
      WHERE status IN ('Active', 'Inactive', 'Dormant')
      AND contribution_date IS NOT NULL
    ` as Member[];

    for (const member of members) {
      if (!member.contributionDate) continue;

      const lastContributionDate = new Date(member.contributionDate);
      const missedMonths = getMonthsDifference(lastContributionDate, today);

      // Determine what the status should be
      const newStatus = determineStatus(missedMonths);

      // Only update if status has changed
      if (newStatus !== member.status) {
        await sql`
          UPDATE members 
          SET status = ${newStatus}, 
              deactivation_reason = ${'Automatically updated: Missed ' + missedMonths + ' month(s) of contributions'}
          WHERE id = ${member.id}
        `;

        updates.push({
          memberId: member.memberId,
          name: member.name,
          oldStatus: member.status,
          newStatus: newStatus,
          missedMonths: missedMonths
        });
      }
    }

    console.log(`✅ Member status update completed. ${updates.length} member(s) updated.`);
    
    return {
      updated: updates.length,
      details: updates
    };
  } catch (error) {
    console.error('❌ Error updating member statuses:', error);
    throw error;
  }
}

/**
 * Check if a specific member should have their status updated
 * Useful for on-demand checks
 */
export async function checkMemberStatus(memberId: string): Promise<{
  shouldUpdate: boolean;
  currentStatus: string;
  suggestedStatus: string;
  missedMonths: number;
}> {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`
    SELECT id, member_id as "memberId", name, status, contribution_date as "contributionDate"
    FROM members 
    WHERE id = ${memberId}
  ` as Member[];
  
  const member = result[0];

  if (!member || !member.contributionDate) {
    return {
      shouldUpdate: false,
      currentStatus: member?.status || 'Unknown',
      suggestedStatus: member?.status || 'Unknown',
      missedMonths: 0
    };
  }

  const today = new Date();
  const lastContributionDate = new Date(member.contributionDate);
  const missedMonths = getMonthsDifference(lastContributionDate, today);
  const suggestedStatus = determineStatus(missedMonths);

  return {
    shouldUpdate: suggestedStatus !== member.status,
    currentStatus: member.status,
    suggestedStatus: suggestedStatus,
    missedMonths: missedMonths
  };
}
