import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Edit,
  Phone,
  Mail,
  Home,
  PiggyBank,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberActionsClient } from "@/components/member-actions-client";
import { getMemberById, getLoans, getSavingsAccounts } from "@/lib/data-service";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { MemberAccountStatement } from "@/components/member-account-statement";
import { MemberExitStatementDialog } from "@/components/member-exit-statement-dialog";
import { buildStatementData, buildFinalBalanceData } from "@/lib/statement-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

function FinancialSummaryCard({
  title,
  amount,
  icon: Icon,
  colorClass,
}: {
  title: string;
  amount: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>
          RWF {amount.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberById(id);

  if (!member) {
    notFound();
  }

  const memberLoans = (await getLoans()).filter((loan) => loan.memberId === id);
  const memberSavings = (await getSavingsAccounts()).filter(
    (account) => account.memberId === id
  );

  const image = getPlaceholderImage(member.avatarId);

  const statementData = buildStatementData(member, memberLoans);
  const finalBalanceData = buildFinalBalanceData(member, memberLoans);


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/members/${member.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <MemberExitStatementDialog
            memberName={member.name}
            data={finalBalanceData}
          />
          <MemberActionsClient member={{
            id: member.id,
            name: member.name || '',
            memberId: member.memberId || '',
            joinDate: member.joinDate,
            status: member.status || 'Active',
            savingsBalance: member.savingsBalance,
            email: member.email
          }} />
        </div>
        <h1 className="text-2xl font-bold">Member Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center pb-2">
              <Avatar className="h-24 w-24 mb-3">
                <AvatarImage
                  src={image.imageUrl}
                  alt={member.name}
                  data-ai-hint={image.imageHint}
                />
                <AvatarFallback>
                  {member.firstName?.[0]}
                  {member.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Badge
                variant={member.status === "Active" ? "default" : "secondary"}
              >
                {member.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 4-field identity block */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Member Name</p>
                  <p className="font-medium mt-0.5">{member.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Member ID</p>
                  <p className="font-medium mt-0.5">{member.memberId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Joining Date</p>
                  <p className="font-medium mt-0.5">
                    {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Current Date</p>
                  <p className="font-medium mt-0.5">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <InfoField
                icon={Phone}
                label="Phone"
                value={member.phoneNumber}
              />
              <InfoField icon={Mail} label="Email" value={member.email} />
              <InfoField icon={Home} label="Address" value={member.address} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financials and Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FinancialSummaryCard
              title="Total Savings (incl. Interest)"
              amount={statementData.total}
              icon={PiggyBank}
              colorClass="text-green-600"
            />
            <FinancialSummaryCard
              title="Outstanding Loan"
              amount={member.loanBalance}
              icon={Landmark}
              colorClass="text-red-600"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary Account Statement</CardTitle>
              <CardDescription>
                Savings breakdown, shares, loan eligibility and debt summary for {member.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberAccountStatement data={statementData} memberEmail={member.email} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savings Accounts</CardTitle>
              <CardDescription>
                All savings accounts for {member.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberSavings.length > 0 ? (
                <ul className="space-y-4">
                  {memberSavings.map((account) => (
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
                      <Button variant="ghost" size="sm">
                        View Statement
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No savings accounts found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
