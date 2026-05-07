import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export type MemberPortalMember = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  memberCode: string;
  email: string | null;
  phoneNumber: string;
  savingsBalance: number;
  loanBalance: number;
  status: string;
  avatarId: string;
  joinDate: string;
  province: string | null;
  district: string | null;
  gender: string | null;
  nationalId: string | null;
  groupId: string;
  address: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelationship: string | null;
  monthlyContribution: number | null;
  shareAmount: number | null;
  numberOfShares: number | null;
  dateOfBirth?: string | null;
  groupName?: string;
};

export type MemberPortalAccount = {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  accountName: string | null;
  openDate: string;
};

export type MemberPortalLoan = {
  id: string;
  loanId: string;
  principal: number;
  balance: number;
  interestRate: number;
  issueDate: string;
  dueDate: string;
  status: string;
  loanTerm: number;
  loanPurpose: string | null;
};

export type MemberPortalTransaction = {
  id: string;
  memberName: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  reason: string | null;
  accountNumber: string | null;
};

const sql = neon(process.env.DATABASE_URL!);

// ── Schema bootstrap ──────────────────────────────────────────────────────────

export async function ensureMemberPortalTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS member_pins (
      member_id  VARCHAR(50) PRIMARY KEY,
      pin_hash   TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS member_invite_tokens (
      token      TEXT PRIMARY KEY,
      member_id  VARCHAR(50) NOT NULL,
      group_id   TEXT NOT NULL,
      used       BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS member_push_subscriptions (
      id          SERIAL PRIMARY KEY,
      member_id   VARCHAR(50) NOT NULL,
      endpoint    TEXT NOT NULL,
      p256dh      TEXT NOT NULL,
      auth        TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (member_id, endpoint)
    )
  `;
}

// ── Invite tokens ─────────────────────────────────────────────────────────────

export async function createInviteToken(memberId: string, groupId: string): Promise<string> {
  await ensureMemberPortalTables();
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
  await sql`
    INSERT INTO member_invite_tokens (token, member_id, group_id, expires_at)
    VALUES (${token}, ${memberId}, ${groupId}, ${expiresAt.toISOString()})
    ON CONFLICT (token) DO NOTHING
  `;
  return token;
}

export async function consumeInviteToken(token: string): Promise<{ memberId: string; groupId: string } | null> {
  await ensureMemberPortalTables();
  const rows = await sql`
    SELECT member_id, group_id FROM member_invite_tokens
    WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
  `;
  if (!rows[0]) return null;
  await sql`UPDATE member_invite_tokens SET used = TRUE WHERE token = ${token}`;
  return { memberId: rows[0].member_id, groupId: rows[0].group_id };
}

// ── PIN management ────────────────────────────────────────────────────────────

export async function setMemberPin(memberId: string, pin: string): Promise<void> {
  await ensureMemberPortalTables();
  const hash = await bcrypt.hash(pin, 10);
  await sql`
    INSERT INTO member_pins (member_id, pin_hash)
    VALUES (${memberId}, ${hash})
    ON CONFLICT (member_id) DO UPDATE SET pin_hash = ${hash}, updated_at = NOW()
  `;
}

export async function verifyMemberPin(memberId: string, pin: string): Promise<boolean> {
  await ensureMemberPortalTables();
  const rows = await sql`SELECT pin_hash FROM member_pins WHERE member_id = ${memberId}`;
  if (!rows[0]) return false;
  return bcrypt.compare(pin, rows[0].pin_hash);
}

export async function memberHasPin(memberId: string): Promise<boolean> {
  await ensureMemberPortalTables();
  const rows = await sql`SELECT 1 FROM member_pins WHERE member_id = ${memberId}`;
  return rows.length > 0;
}

// ── Member lookup ─────────────────────────────────────────────────────────────

export async function getMemberByEmail(email: string, groupId: string): Promise<MemberPortalMember | null> {
  const rows = await sql`
    SELECT id, name, first_name as "firstName", last_name as "lastName",
           member_id as "memberCode", email, phone_number as "phoneNumber",
           savings_balance as "savingsBalance", loan_balance as "loanBalance",
           status, avatar_id as "avatarId", join_date as "joinDate",
           province, district, gender, national_id as "nationalId",
           address, sector, cell, village,
           next_of_kin_name as "nextOfKinName", next_of_kin_phone as "nextOfKinPhone",
           next_of_kin_relationship as "nextOfKinRelationship",
           monthly_contribution as "monthlyContribution",
           share_amount as "shareAmount", number_of_shares as "numberOfShares",
           date_of_birth as "dateOfBirth", group_id as "groupId"
    FROM members
    WHERE LOWER(email) = LOWER(${email}) AND group_id = ${groupId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    ...(rows[0] as any),
    savingsBalance: Number(rows[0].savingsBalance),
    loanBalance: Number(rows[0].loanBalance),
    monthlyContribution: rows[0].monthlyContribution ? Number(rows[0].monthlyContribution) : null,
    shareAmount: rows[0].shareAmount ? Number(rows[0].shareAmount) : null,
    numberOfShares: rows[0].numberOfShares ? Number(rows[0].numberOfShares) : null,
  } as MemberPortalMember;
}

// Lookup by email alone — for login when group is not known (returning user, cleared storage)
export async function getMemberByEmailAny(email: string): Promise<MemberPortalMember | null> {
  // Join with member_pins to only return members who have set up portal access
  const rows = await sql`
    SELECT m.id, m.name, m.first_name as "firstName", m.last_name as "lastName",
           m.member_id as "memberCode", m.email, m.phone_number as "phoneNumber",
           m.savings_balance as "savingsBalance", m.loan_balance as "loanBalance",
           m.status, m.avatar_id as "avatarId", m.join_date as "joinDate",
           m.group_id as "groupId"
    FROM members m
    INNER JOIN member_pins mp ON mp.member_id = m.id
    WHERE LOWER(m.email) = LOWER(${email})
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    ...(rows[0] as any),
    savingsBalance: Number(rows[0].savingsBalance),
    loanBalance: Number(rows[0].loanBalance),
    monthlyContribution: null,
    shareAmount: null,
    numberOfShares: null,
  } as MemberPortalMember;
}

export async function getMemberById(id: string): Promise<MemberPortalMember | null> {
  const rows = await sql`
    SELECT m.id, m.name, m.first_name as "firstName", m.last_name as "lastName",
           m.member_id as "memberCode", m.email, m.phone_number as "phoneNumber",
           m.savings_balance as "savingsBalance", m.loan_balance as "loanBalance",
           m.status, m.avatar_id as "avatarId", m.join_date as "joinDate",
           m.province, m.district, m.gender, m.national_id as "nationalId",
           m.group_id as "groupId",
           m.address, m.sector, m.cell, m.village,
           m.next_of_kin_name as "nextOfKinName", m.next_of_kin_phone as "nextOfKinPhone",
           m.next_of_kin_relationship as "nextOfKinRelationship",
           m.monthly_contribution as "monthlyContribution",
           m.share_amount as "shareAmount", m.number_of_shares as "numberOfShares",
           m.date_of_birth as "dateOfBirth"
    FROM members m
    WHERE m.id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    ...(rows[0] as any),
    savingsBalance: Number(rows[0].savingsBalance),
    loanBalance: Number(rows[0].loanBalance),
    monthlyContribution: rows[0].monthlyContribution ? Number(rows[0].monthlyContribution) : null,
    shareAmount: rows[0].shareAmount ? Number(rows[0].shareAmount) : null,
    numberOfShares: rows[0].numberOfShares ? Number(rows[0].numberOfShares) : null,
  } as MemberPortalMember;
}

export async function getMemberAccounts(memberId: string): Promise<MemberPortalAccount[]> {
  const rows = await sql`
    SELECT id, account_number as "accountNumber", type, balance,
           account_name as "accountName", open_date as "openDate"
    FROM savings_accounts
    WHERE member_id = ${memberId}
    ORDER BY open_date ASC
  `;
  return rows.map((r) => ({ ...(r as any), balance: Number(r.balance) })) as MemberPortalAccount[];
}

export async function getMemberTransactions(memberId: string, accountNumber?: string, limit = 50): Promise<MemberPortalTransaction[]> {
  // Transactions don't have member_id — query by account_number(s) belonging to this member
  if (accountNumber) {
    const rows = await sql`
      SELECT id, member_name as "memberName", type, amount, date, status, reason, account_number as "accountNumber"
      FROM transactions
      WHERE account_number = ${accountNumber}
      ORDER BY date DESC, created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({ ...(r as any), amount: Number(r.amount) })) as MemberPortalTransaction[];
  }

  // Get all account numbers for this member, then get their transactions
  const accounts = await sql`SELECT account_number FROM savings_accounts WHERE member_id = ${memberId}`;
  if (!accounts.length) return [];

  const accountNumbers = accounts.map((a) => a.account_number);
  const rows = await sql`
    SELECT id, member_name as "memberName", type, amount, date, status, reason, account_number as "accountNumber"
    FROM transactions
    WHERE account_number = ANY(${accountNumbers})
    ORDER BY date DESC, created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...(r as any), amount: Number(r.amount) })) as MemberPortalTransaction[];
}

export async function getMemberLoans(memberId: string): Promise<MemberPortalLoan[]> {
  const rows = await sql`
    SELECT id, loan_id as "loanId", principal, balance, interest_rate as "interestRate",
           issue_date as "issueDate", due_date as "dueDate", status,
           loan_term as "loanTerm", loan_purpose as "loanPurpose"
    FROM loans
    WHERE member_id = ${memberId}
    ORDER BY issue_date DESC
  `;
  return rows.map((r) => ({
    ...(r as any),
    principal: Number(r.principal),
    balance: Number(r.balance),
    interestRate: Number(r.interestRate),
  })) as MemberPortalLoan[];
}

export async function getGroupName(groupId: string): Promise<string> {
  try {
    const rows = await sql`SELECT name FROM groups WHERE id = ${groupId} LIMIT 1`;
    return rows[0]?.name ?? 'Your Group';
  } catch {
    return 'Your Group';
  }
}

// ── Push subscriptions ────────────────────────────────────────────────────────

export async function savePushSubscription(
  memberId: string,
  endpoint: string,
  p256dh: string,
  auth: string
) {
  await ensureMemberPortalTables();
  await sql`
    INSERT INTO member_push_subscriptions (member_id, endpoint, p256dh, auth)
    VALUES (${memberId}, ${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (member_id, endpoint) DO UPDATE SET p256dh = ${p256dh}, auth = ${auth}
  `;
}

export async function getMemberPushSubscriptions(memberId: string) {
  await ensureMemberPortalTables();
  const rows = await sql`
    SELECT endpoint, p256dh, auth FROM member_push_subscriptions WHERE member_id = ${memberId}
  `;
  return rows as { endpoint: string; p256dh: string; auth: string }[];
}

export async function deletePushSubscription(memberId: string, endpoint: string) {
  await sql`
    DELETE FROM member_push_subscriptions WHERE member_id = ${memberId} AND endpoint = ${endpoint}
  `;
}
