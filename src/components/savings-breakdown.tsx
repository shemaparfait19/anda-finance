'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type SavingsBreakdownProps = {
  principal: number;
  interest: number;
  principalShares: number;
  interestShares: number;
};

export function SavingsBreakdown({ principal, interest, principalShares, interestShares }: SavingsBreakdownProps) {
  const totalAmount = principal + interest;
  const totalShares = principalShares + interestShares;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Breakdown</CardTitle>
        <CardDescription>Detailed view of your savings and shares</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Principal Savings</h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span>{formatCurrency(principal)} RWF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares:</span>
            <span>{principalShares.toFixed(2)} shares</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Interest Earned</h3>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span>{formatCurrency(interest)} RWF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares:</span>
            <span>{interestShares.toFixed(2)} shares</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)} RWF</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total Shares:</span>
            <span>{totalShares.toFixed(2)} shares</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
