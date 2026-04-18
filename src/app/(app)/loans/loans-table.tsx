"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MoreHorizontal, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardFooter } from "@/components/ui/card";
import type { Loan } from "@/lib/types";
import { AppConfirmationDialog } from "@/components/ui/app-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { approveLoan } from "./actions";
import RecordRepaymentDialog from "./record-repayment-dialog";
import ViewLoanDetailsDialog from "./view-loan-details-dialog";
import LoanAmortizationDialog from "./loan-amortization-dialog";

type BadgeVariant = "success" | "secondary" | "destructive" | "warning" | "outline";

const getStatusBadgeVariant = (status: Loan["status"]): BadgeVariant => {
  switch (status) {
    case "Active":    return "success";
    case "Paid":      return "secondary";
    case "Overdue":   return "destructive";
    case "Defaulted": return "destructive";
    case "Pending":   return "warning";
    default:          return "outline";
  }
};

interface LoansTableProps {
  loans: Loan[];
}

export default function LoansTable({ loans }: LoansTableProps) {
  const { toast } = useToast();
  const [isApproving, startApproveTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = searchParams.get("q") ?? "";
  const setQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filtered = query.trim()
    ? loans.filter((l) => {
        const q = query.toLowerCase();
        return (
          (l.memberName ?? "").toLowerCase().includes(q) ||
          (l.loanId ?? "").toLowerCase().includes(q) ||
          (l.status ?? "").toLowerCase().includes(q)
        );
      })
    : loans;

  const [dialogState, setDialogState] = useState({
    approve: { open: false, loan: null as Loan | null },
    repayment: { open: false, loan: null as Loan | null },
    details: { open: false, loan: null as Loan | null },
    amortization: { open: false, loan: null as Loan | null },
  });

  const handleOpenDialog = (
    type: "approve" | "repayment" | "details" | "amortization",
    loan: Loan
  ) => {
    setDialogState((prev) => ({ ...prev, [type]: { open: true, loan } }));
  };

  const handleCloseDialog = (type: "approve" | "repayment" | "details" | "amortization") => {
    setDialogState((prev) => ({
      ...prev,
      [type]: { open: false, loan: null },
    }));
  };

  const handleApprove = async (loanId: string) => {
    startApproveTransition(async () => {
      const result = await approveLoan(loanId);
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      handleCloseDialog("approve");
    });
  };

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by member, loan ID, or status…"
          className="pl-9 pr-9"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member Name</TableHead>
            <TableHead>Loan ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Repayment</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
            <TableHead className="hidden md:table-cell text-right">Principal</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <tr><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No loans match &quot;{query}&quot;</td></tr>
          )}
          {filtered.map((loan) => {
            const paid = loan.principal - loan.balance;
            const pct = loan.principal > 0 ? Math.round((paid / loan.principal) * 100) : 0;
            const barColor =
              loan.status === "Paid" ? "bg-green-500" :
              loan.status === "Overdue" || loan.status === "Defaulted" ? "bg-red-500" :
              "bg-primary";
            return (
            <TableRow key={loan.id}>
              <TableCell className="font-medium">{loan.memberName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{loan.loanId}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(loan.status)}>
                  {loan.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell w-36">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{pct}% repaid</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {new Date(loan.dueDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="hidden md:table-cell text-right text-sm">
                RWF {loan.principal.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-medium text-sm">
                RWF {loan.balance.toLocaleString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {loan.status === "Pending" && (
                      <DropdownMenuItem
                        onSelect={() => handleOpenDialog("approve", loan)}
                      >
                        Approve Loan
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => handleOpenDialog("details", loan)}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleOpenDialog("amortization", loan)}
                    >
                      View Amortization
                    </DropdownMenuItem>
                    {loan.status === "Active" || loan.status === "Overdue" ? (
                      <DropdownMenuItem
                        onSelect={() => handleOpenDialog("repayment", loan)}
                      >
                        Record Repayment
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{loans.length}</strong> of{" "}
          <strong>{loans.length}</strong> loans
        </div>
      </CardFooter>

      {/* Dialogs for actions */}
      {dialogState.approve.loan && (
        <AppConfirmationDialog
          open={dialogState.approve.open}
          onOpenChange={(open) => !open && handleCloseDialog("approve")}
          title="Approve Loan"
          description={`Are you sure you want to approve this RWF ${dialogState.approve.loan.principal.toLocaleString()} loan for ${
            dialogState.approve.loan.memberName
          }? This will mark it as Active and update the member's loan balance.`}
          onConfirm={() => handleApprove(dialogState.approve.loan!.id)}
          isPending={isApproving}
          confirmText="Yes, Approve"
        />
      )}

      {dialogState.repayment.loan && (
        <RecordRepaymentDialog
          loan={dialogState.repayment.loan}
          open={dialogState.repayment.open}
          onOpenChange={(open) => !open && handleCloseDialog("repayment")}
        />
      )}

      {dialogState.details.loan && (
        <ViewLoanDetailsDialog
          loan={dialogState.details.loan}
          open={dialogState.details.open}
          onOpenChange={(open) => !open && handleCloseDialog("details")}
        />
      )}

      {dialogState.amortization.loan && (
        <LoanAmortizationDialog
          loan={dialogState.amortization.loan}
          open={dialogState.amortization.open}
          onOpenChange={(open) => !open && handleCloseDialog("amortization")}
        />
      )}
    </>
  );
}
