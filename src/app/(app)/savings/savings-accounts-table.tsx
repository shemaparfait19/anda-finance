"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member Name</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead>Account No.</TableHead>
            <TableHead className="hidden md:table-cell">Account Type</TableHead>
            <TableHead className="hidden md:table-cell">Open Date</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">
                {account.memberName || <span className="text-muted-foreground">Organization</span>}
              </TableCell>
              <TableCell>{account.accountName || "-"}</TableCell>
              <TableCell>{account.accountNumber}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{account.type}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {new Date(account.openDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
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
