import { NextRequest, NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { principal, interestRate, loanTerm, purpose, purposeDescription } = await req.json();
    if (!principal || !interestRate || !loanTerm || !purpose) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (principal <= 0 || interestRate <= 0 || loanTerm <= 0) {
      return NextResponse.json({ error: 'Invalid loan parameters.' }, { status: 400 });
    }

    // Get member's group_id for isolation
    const memberRows = await sql`SELECT group_id FROM members WHERE id = ${session.memberId} LIMIT 1`;
    if (!memberRows[0]) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

    const groupId = memberRows[0].group_id;
    if (groupId !== session.groupId) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    // Create pending loan application (status = 'Pending')
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + Number(loanTerm));

    const loanId = `LOAN-${Date.now().toString(36).toUpperCase()}`;
    const id = crypto.randomUUID();

    const purposeText = purposeDescription ? `${purpose} — ${purposeDescription}` : purpose;
    await sql`
      INSERT INTO loans (id, member_id, member_name, loan_id, principal, balance, interest_rate,
                         issue_date, due_date, status, loan_term, loan_purpose, group_id)
      VALUES (
        ${id}, ${session.memberId}, ${session.name}, ${loanId},
        ${principal}, ${principal}, ${interestRate},
        ${now.toISOString().split('T')[0]}, ${dueDate.toISOString().split('T')[0]},
        'Pending', ${loanTerm}, ${purposeText}, ${groupId}
      )
    `;

    return NextResponse.json({ success: true, loanId });
  } catch (e: any) {
    console.error('[member/loan-apply]', e);
    return NextResponse.json({ error: e.message || 'Server error.' }, { status: 500 });
  }
}
