'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { PlusCircle, Pencil, ToggleLeft, ToggleRight, Loader2, ShieldCheck } from 'lucide-react';
import { Badge }  from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { roleLabel, roleBadgeVariant } from '@/lib/permissions';
import { createUser, updateUser, toggleUserActive } from './user-actions';
import type { User, UserRole } from '@/lib/types';

type GroupOption = { id: string; name: string };

const ASSIGNABLE_ROLES: UserRole[] = ['ADMIN_FULL', 'ADMIN_MAKER', 'ADMIN_CHECKER', 'IT_ADMIN'];

function SubmitBtn({ label, loading }: { label: string; loading: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? loading : label}
    </Button>
  );
}

// ── Create User Dialog ────────────────────────────────────────────────────────

function CreateUserDialog({
  onDone,
  isSuperAdmin,
  groups = [],
}: {
  onDone: () => void;
  isSuperAdmin: boolean;
  groups?: GroupOption[];
}) {
  const { toast }  = useToast();
  const router     = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createUser, { message: '', success: false });

  useEffect(() => {
    if (state.success && open) {
      toast({ title: 'User created', description: state.message });
      setOpen(false);
      onDone();
      router.refresh();
    }
  }, [state.success]);

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4" /> Add User
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form action={action}>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {state.message && !state.success && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Name</Label>
                <div className="col-span-3">
                  <Input name="name" placeholder="Full name" />
                  {state.fields?.name && <p className="text-xs text-destructive mt-1">{state.fields.name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Email</Label>
                <div className="col-span-3">
                  <Input name="email" type="email" placeholder="user@organisation.com" autoComplete="off" />
                  {state.fields?.email && <p className="text-xs text-destructive mt-1">{state.fields.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Role</Label>
                <div className="col-span-3">
                  <Select name="role" defaultValue="ADMIN_MAKER">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Phone</Label>
                <div className="col-span-3">
                  <Input name="phoneNumber" placeholder="+250 7XX XXX XXX (optional)" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1 leading-tight text-xs">Approvals needed</Label>
                <div className="col-span-3">
                  <Select name="approvalsRequired" defaultValue="1">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 checker</SelectItem>
                      <SelectItem value="2">2 checkers</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Only relevant for Maker role</p>
                </div>
              </div>
              {isSuperAdmin && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Group</Label>
                  <div className="col-span-3">
                    {groups.length > 0 ? (
                      <Select name="groupId">
                        <SelectTrigger><SelectValue placeholder="Assign to group…" /></SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name} <span className="text-muted-foreground text-xs ml-1">({g.id})</span></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input name="groupId" placeholder="Group ID (e.g. coop-kigali-01)" autoComplete="off" />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">The cooperative this user belongs to</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-1 py-2 rounded-md bg-muted/50 text-[12px] text-muted-foreground">
              The user will be prompted to create their own password and PIN on first login.
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <SubmitBtn label="Create User" loading="Creating…" />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Edit User Dialog ──────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  onDone,
  isSuperAdmin,
  groups = [],
}: {
  user: User;
  onDone: () => void;
  isSuperAdmin: boolean;
  groups?: GroupOption[];
}) {
  const { toast }  = useToast();
  const router     = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateUser, { message: '', success: false });

  useEffect(() => {
    if (state.success && open) {
      toast({ title: 'User updated', description: state.message });
      setOpen(false);
      onDone();
      router.refresh();
    }
  }, [state.success]);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form action={action}>
            <input type="hidden" name="id" value={user.id} />
            <DialogHeader>
              <DialogTitle>Edit User — {user.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {state.message && !state.success && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Name</Label>
                <div className="col-span-3">
                  <Input name="name" defaultValue={user.name} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Role</Label>
                <div className="col-span-3">
                  <Select name="role" defaultValue={user.role}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Phone</Label>
                <div className="col-span-3">
                  <Input name="phoneNumber" defaultValue={user.phoneNumber ?? ''} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs leading-tight">New password</Label>
                <div className="col-span-3">
                  <Input name="password" type="password" placeholder="Leave blank to keep current" autoComplete="new-password" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs leading-tight">New PIN</Label>
                <div className="col-span-3">
                  <Input name="pin" type="password" inputMode="numeric" maxLength={5} placeholder="Leave blank to keep current" autoComplete="new-password" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1 text-xs leading-tight">Approvals</Label>
                <div className="col-span-3">
                  <Select name="approvalsRequired" defaultValue={String(user.approvalsRequired ?? 1)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 checker</SelectItem>
                      <SelectItem value="2">2 checkers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3">
                  <Select name="isActive" defaultValue={String(user.isActive ?? true)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isSuperAdmin && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Group</Label>
                  <div className="col-span-3">
                    {groups.length > 0 ? (
                      <Select name="groupId" defaultValue={user.groupId ?? ''}>
                        <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name} <span className="text-muted-foreground text-xs ml-1">({g.id})</span></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input name="groupId" defaultValue={user.groupId ?? ''} placeholder="Group ID" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <SubmitBtn label="Save Changes" loading="Saving…" />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface UserManagementPageProps {
  users: User[];
  isSuperAdmin?: boolean;
  groups?: GroupOption[];
}

export default function UserManagementPage({
  users,
  isSuperAdmin = false,
  groups = [],
}: UserManagementPageProps) {
  const { toast }  = useToast();
  const router     = useRouter();
  const [toggling, setToggling] = useState<number | null>(null);

  const handleToggle = async (user: User) => {
    setToggling(user.id);
    const result = await toggleUserActive(user.id, !(user.isActive ?? true));
    toast({
      title: result.success ? 'Updated' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setToggling(null);
    if (result.success) router.refresh();
  };

  // Build group name lookup for SUPER_ADMIN table display
  const groupNameById = Object.fromEntries(groups.map((g) => [g.id, g.name]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? 'All staff users across every group.'
                : 'Add, edit, and manage staff access & permissions.'}
            </CardDescription>
          </div>
          <CreateUserDialog onDone={() => {}} isSuperAdmin={isSuperAdmin} groups={groups} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {isSuperAdmin && <TableHead>Group</TableHead>}
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Last Login</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id} className={!(user.isActive ?? true) ? 'opacity-60' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.role === 'SUPER_ADMIN' && (
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    {user.name}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(user.role as UserRole)}>
                    {roleLabel(user.role as UserRole)}
                  </Badge>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-sm">
                    {user.groupId
                      ? <span className="font-mono text-xs">{groupNameById[user.groupId] ?? user.groupId}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                )}
                <TableCell className="hidden md:table-cell">
                  <Badge variant={(user.isActive ?? true) ? 'default' : 'outline'}>
                    {(user.isActive ?? true) ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {user.role !== 'SUPER_ADMIN' && (
                      <>
                        <EditUserDialog user={user} onDone={() => {}} isSuperAdmin={isSuperAdmin} groups={groups} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(user)}
                          disabled={toggling === user.id}
                          title={(user.isActive ?? true) ? 'Deactivate' : 'Activate'}
                        >
                          {toggling === user.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : (user.isActive ?? true)
                              ? <ToggleRight className="h-4 w-4 text-primary" />
                              : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
