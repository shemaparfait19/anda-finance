import { neon } from '@neondatabase/serverless';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmsReminderForm    from './sms-reminder-form';
import SettingsPage       from './settings-page';
import UserManagementPage from './user-management-page';
import PendingActionsPage from './pending-actions-page';
import GroupsPage, { type GroupRow } from './groups-page';
import { auth }           from '@/auth';
import { canApprove }     from '@/lib/permissions';
import { getPendingActions } from '@/lib/pending-actions-service';
import { initializeDatabase } from '@/lib/database';
import type { User, UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

async function getGroupUsers(groupId: string | null): Promise<User[]> {
  try {
    const rows = await sql`
      SELECT id, name, email, role, is_active, last_login, phone_number, approvals_required, group_id, created_at
      FROM users
      WHERE group_id = ${groupId}
      ORDER BY id
    `;
    return rows.map(mapUser);
  } catch (err: any) {
    throw new Error(`Failed to load users: ${err?.message ?? String(err)}`);
  }
}

async function getAllUsers(): Promise<User[]> {
  try {
    const rows = await sql`
      SELECT id, name, email, role, is_active, last_login, phone_number, approvals_required, group_id, created_at
      FROM users
      ORDER BY group_id NULLS LAST, id
    `;
    return rows.map(mapUser);
  } catch (err: any) {
    throw new Error(`Failed to load users: ${err?.message ?? String(err)}`);
  }
}

function mapUser(r: any): User {
  return {
    id:                r.id,
    name:              r.name,
    email:             r.email,
    role:              r.role as UserRole,
    isActive:          r.is_active ?? true,
    lastLogin:         r.last_login ?? undefined,
    phoneNumber:       r.phone_number ?? undefined,
    approvalsRequired: r.approvals_required ?? 1,
    groupId:           r.group_id ?? null,
    createdAt:         r.created_at,
  };
}

async function getGroups(): Promise<GroupRow[]> {
  try {
    const rows = await sql`
      SELECT g.id, g.name, g.code, g.created_at,
             COUNT(u.id) AS user_count
      FROM groups g
      LEFT JOIN users u ON u.group_id = g.id
      GROUP BY g.id, g.name, g.code, g.created_at
      ORDER BY g.created_at DESC
    `;
    return rows.map((r) => ({
      id:        r.id,
      name:      r.name,
      code:      r.code ?? null,
      userCount: Number(r.user_count),
      createdAt: r.created_at,
    }));
  } catch (err: any) {
    throw new Error(`Failed to load groups: ${err?.message ?? String(err)}`);
  }
}

export default async function AdminPage() {
  await initializeDatabase();

  const session = await auth();
  const role    = session?.user?.role as UserRole | undefined;
  const groupId = (session?.user as any)?.groupId as string | null;

  const isSuperAdmin    = role === 'SUPER_ADMIN';
  const isAdminFull     = role === 'ADMIN_FULL';
  const isCheckerOrFull = role ? canApprove(role) : false;
  const isMaker         = role === 'ADMIN_MAKER';
  const isITAdmin       = role === 'IT_ADMIN';

  // ── IT_ADMIN — settings only ────────────────────────────────────────────────
  if (isITAdmin) {
    return <SettingsPage canClearData={false} />;
  }

  // ── SUPER_ADMIN — system control panel ─────────────────────────────────────
  // Manages cooperatives and their users. Never sees member/financial data.
  if (isSuperAdmin) {
    const [allGroups, allUsers] = await Promise.all([
      getGroups(),
      getAllUsers(),
    ]);

    return (
      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <GroupsPage groups={allGroups} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementPage
            users={allUsers}
            isSuperAdmin={true}
            groups={allGroups.map((g) => ({ id: g.id, name: g.name }))}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPage canClearData={false} />
        </TabsContent>
      </Tabs>
    );
  }

  // ── ADMIN_MAKER — only their submitted actions + SMS tool ───────────────────
  if (isMaker) {
    const allActions    = await getPendingActions();
    const visibleActions = allActions.filter((a) => a.initiatedByEmail === session?.user?.email);
    const pendingCount   = visibleActions.filter((a) => a.status === 'pending').length;

    return (
      <Tabs defaultValue="my-actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-actions" className="relative">
            My Submitted Actions
            {pendingCount > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sms-reminder">SMS Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="my-actions">
          <PendingActionsPage actions={visibleActions} canApprove={false} />
        </TabsContent>
        <TabsContent value="sms-reminder">
          <SmsReminderForm />
        </TabsContent>
      </Tabs>
    );
  }

  // ── ADMIN_CHECKER — approvals queue + SMS tool + settings ──────────────────
  if (role === 'ADMIN_CHECKER') {
    const allActions   = await getPendingActions();
    const pendingCount = allActions.filter((a) => a.status === 'pending').length;

    return (
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {pendingCount > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sms-reminder">SMS Reminders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="approvals">
          <PendingActionsPage actions={allActions} canApprove={true} />
        </TabsContent>
        <TabsContent value="sms-reminder">
          <SmsReminderForm />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPage canClearData={false} />
        </TabsContent>
      </Tabs>
    );
  }

  // ── ADMIN_FULL — cooperative admin panel ────────────────────────────────────
  const [groupUsers, allActions] = await Promise.all([
    getGroupUsers(groupId),
    getPendingActions(),
  ]);
  const pendingCount = allActions.filter((a) => a.status === 'pending').length;

  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="approvals" className="relative">
          Approvals
          {pendingCount > 0 && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="sms-reminder">SMS Reminders</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <UserManagementPage users={groupUsers} isSuperAdmin={false} />
      </TabsContent>

      <TabsContent value="approvals">
        <PendingActionsPage actions={allActions} canApprove={isCheckerOrFull} />
      </TabsContent>

      <TabsContent value="sms-reminder">
        <SmsReminderForm />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsPage canClearData={isAdminFull} />
      </TabsContent>
    </Tabs>
  );
}
