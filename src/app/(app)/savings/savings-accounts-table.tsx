"use client";

import { useState } from "react";
import { MoreHorizontal, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SavingsAccount, Member } from "@/lib/types";
import NewDepositDialog from "./new-deposit-dialog";
import NewWithdrawalDialog from "./new-withdrawal-dialog";
import ViewStatementDialog from "./view-statement-dialog";

interface SavingsAccountsTableProps {
  accounts: SavingsAccount[];
  members: Member[];
}

export default function SavingsAccountsTable({
  accounts,
  members,
}: SavingsAccountsTableProps) {
  const maxBalance = Math.max(...accounts.map((a) => a.balance), 1);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? accounts.filter((a) => {
        const q = query.toLowerCase();
        const member = members.find((m) => m.id === a.memberId);
        return (
          (a.memberName ?? "").toLowerCase().includes(q) ||
          (a.accountNumber ?? "").toLowerCase().includes(q) ||
          (a.accountName ?? "").toLowerCase().includes(q) ||
          (member?.memberId ?? "").toLowerCase().includes(q)
        );
      })
    : accounts;

  const [dialogState, setDialogState] = useState({
    deposit: { open: false, account: null as SavingsAccount | null },
    withdrawal: { open: false, account: null as SavingsAccount | null },
    statement: { open: false, account: null as SavingsAccount | null },
  });

  const findMemberForAccount = (memberId: string) =>
    members.find((m) => m.id === memberId);

  const handleOpenDialog = (
    type: "deposit" | "withdrawal" | "statement",
    account: SavingsAccount
  ) => {
    setDialogState((prev) => ({ ...prev, [type]: { open: true, account } }));
  };

  const handleCloseDialog = (type: "deposit" | "withdrawal" | "statement") => {
    setDialogState((prev) => ({
      ...prev,
      [type]: { open: false, account: null },
    }));
  };

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, account no, or member ID…"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member Name</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead>Account No.</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Open Date</TableHead>
            <TableHead className="hidden lg:table-cell">Balance Bar</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No accounts match &quot;{query}&quot;
              </td>
            </tr>
          )}
          {filtered.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">
                {account.memberName || <span className="text-muted-foreground">Organization</span>}
              </TableCell>
              <TableCell>{account.accountName || "-"}</TableCell>
              <TableCell>{account.accountNumber}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{account.type}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {new Date(account.openDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="hidden lg:table-cell w-36">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] text-muted-foreground">
                    {Math.round((account.balance / maxBalance) * 100)}% of top
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.round((account.balance / maxBalance) * 100)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                RWF {account.balance.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => handleOpenDialog("statement", account)}
                    >
                      View Statement
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleOpenDialog("deposit", account)}
                    >
                      Make Deposit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleOpenDialog("withdrawal", account)}
                    >
                      Make Withdrawal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {dialogState.deposit.account && (
        <NewDepositDialog
          members={members.filter(
            (m) => m.id === dialogState.deposit.account?.memberId
          )}
          selectedMemberId={dialogState.deposit.account.memberId}
          open={dialogState.deposit.open}
          onOpenChange={(open) => !open && handleCloseDialog("deposit")}
        />
      )}

      {dialogState.withdrawal.account && (
        <NewWithdrawalDialog
          members={members.filter(
            (m) => m.id === dialogState.withdrawal.account?.memberId
          )}
          selectedMemberId={dialogState.withdrawal.account.memberId}
          open={dialogState.withdrawal.open}
          onOpenChange={(open) => !open && handleCloseDialog("withdrawal")}
        />
      )}

      {dialogState.statement.account && (
        <ViewStatementDialog
          account={dialogState.statement.account}
          open={dialogState.statement.open}
          onOpenChange={(open) => !open && handleCloseDialog("statement")}
        />
      )}
    </>
  );
}
