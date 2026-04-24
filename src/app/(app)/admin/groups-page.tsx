'use client';

import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { PlusCircle, Pencil, Loader2, Users } from 'lucide-react';
import { Badge }   from '@/components/ui/badge';
import { Button }  from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createGroup, updateGroup } from './group-actions';

export type GroupRow = {
  id:        string;
  name:      string;
  code:      string | null;
  userCount: number;
  createdAt: string;
};

function SubmitBtn({ label, loading }: { label: string; loading: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? loading : label}
    </Button>
  );
}

// ── Create Group Dialog ────────────────────────────────────────────────────────

function CreateGroupDialog({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createGroup, { message: '', success: false });

  if (state.success && open) {
    toast({ title: 'Group created', description: state.message });
    setOpen(false);
    onDone();
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4" /> New Group
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form action={action}>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {state.message && !state.success && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Group ID</Label>
                <div className="col-span-3">
                  <Input name="id" placeholder="e.g. coop-kigali-01" autoComplete="off" />
                  <p className="text-xs text-muted-foreground mt-1">Lowercase, hyphens only. Cannot be changed later.</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Name</Label>
                <div className="col-span-3">
                  <Input name="name" placeholder="Kigali Savings Cooperative" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Code</Label>
                <div className="col-span-3">
                  <Input name="code" placeholder="KSC (optional short code)" autoComplete="off" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <SubmitBtn label="Create Group" loading="Creating…" />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Edit Group Dialog ─────────────────────────────────────────────────────────

function EditGroupDialog({ group, onDone }: { group: GroupRow; onDone: () => void }) {
  const { toast } = useToast();
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState(group.name);
  const [code,    setCode]    = useState(group.code ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const result = await updateGroup(group.id, name, code || null);
    setLoading(false);
    toast({
      title:       result.success ? 'Updated' : 'Error',
      description: result.message,
      variant:     result.success ? 'default' : 'destructive',
    });
    if (result.success) { setOpen(false); onDone(); }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group — {group.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input
                className="col-span-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Code</Label>
              <Input
                className="col-span-3"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Optional short code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={loading || !name.trim()} onClick={handleSave}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function GroupsPage({ groups }: { groups: GroupRow[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Each group is a cooperative, SACCO, or microfinance client. Users and data are fully isolated between groups.</CardDescription>
          </div>
          <CreateGroupDialog onDone={() => {}} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Users</span>
              </TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No groups yet. Create the first cooperative to get started.
                </TableCell>
              </TableRow>
            )}
            {groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono text-sm">{g.id}</TableCell>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>
                  {g.code
                    ? <Badge variant="secondary">{g.code}</Badge>
                    : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell className="text-sm">{g.userCount}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {new Date(g.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <EditGroupDialog group={g} onDone={() => {}} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
