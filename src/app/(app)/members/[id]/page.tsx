import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Home,
  PiggyBank,
  Landmark,
  UserCheck,
  FileText,
} from "lucide-react";
import {
  getMemberById,
  getLoans,
  getSavingsAccounts,
} from "@/lib/data-service";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Member Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
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
              <CardTitle className="text-2xl">{member.name}</CardTitle>
              <CardDescription>
                <Badge
                  variant={member.status === "Active" ? "default" : "secondary"}
                >
                  {member.status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />

              <InfoField
                icon={Calendar}
                label="Joined Date"
                value={member.joinDate}
              />
              <InfoField
                icon={UserCheck}
                label="Member ID"
                value={member.memberId}
              />
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
              title="Total Savings"
              amount={member.savingsBalance}
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
              <CardTitle>Loan History</CardTitle>
              <CardDescription>
                A summary of all loans taken by {member.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberLoans.length > 0 ? (
                <ul className="space-y-4">
                  {memberLoans.map((loan) => (
                    <li
                      key={loan.id}
                      className="flex justify-between items-center p-3 rounded-md border"
                    >
                      <div>
                        <p className="font-semibold">
                          RWF {loan.principal.toLocaleString()}{" "}
                          <span className="text-muted-foreground font-normal">
                            - {loan.loanPurpose}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Issued:{" "}
                          {new Date(loan.issueDate).toLocaleDateString()} | Due:{" "}
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          loan.status === "Overdue" ? "destructive" : "outline"
                        }
                      >
                        {loan.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No loan history found.
                </p>
              )}
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
