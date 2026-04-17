"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Exit Statement
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-red-700">Member Exit — Final Balance</SheetTitle>
          <SheetDescription>
            Final settlement calculation for {memberName}. Shows the total amount to be refunded on exit.
          </SheetDescription>
        </SheetHeader>
        <MemberFinalBalance data={data} />
      </SheetContent>
    </Sheet>
  );
}
