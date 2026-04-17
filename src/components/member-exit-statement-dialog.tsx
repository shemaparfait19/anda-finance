"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut } from "lucide-react";
import { MemberFinalBalance } from "@/components/member-final-balance";
import type { FinalBalanceData } from "@/lib/statement-utils";

interface Props {
  memberName: string;
  data: FinalBalanceData;
}

export function MemberExitStatementDialog({ memberName, data }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
          <LogOut className="h-4 w-4 mr-2" />
          Exit Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-700">Member Exit — Final Balance</DialogTitle>
          <DialogDescription>
            Final settlement calculation for {memberName}. This shows the total amount to be refunded on exit.
          </DialogDescription>
        </DialogHeader>
        <MemberFinalBalance data={data} />
      </DialogContent>
    </Dialog>
  );
}
