"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SavingsAccount } from "@/lib/types";
import ViewStatementDialog from "@/app/(app)/savings/view-statement-dialog";

export default function MemberSavingsAccounts({
  accounts,
}: {
  accounts: SavingsAccount[];
}) {
  const [selected, setSelected] = useState<SavingsAccount | null>(null);

  if (accounts.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No savings accounts found.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex justify-between items-center p-3 rounded-md border"
          >
            <div>
              <p className="font-semibold">
                {account.accountNumber}{" "}
                <span className="text-muted-foreground font-normal">
                  - {account.type}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Balance: RWF {account.balance.toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(account)}
            >
              View Statement
            </Button>
          </li>
        ))}
      </ul>

      {selected && (
        <ViewStatementDialog
          account={selected}
          open={!!selected}
          onOpenChange={(open) => { if (!open) setSelected(null); }}
        />
      )}
    </>
  );
}
