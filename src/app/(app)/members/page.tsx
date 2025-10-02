import { File, ListFilter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getMembers } from "@/lib/data-service";
import AddMemberDialog from "./add-member-dialog";
import MemberActions from "./member-actions";
import type { Member } from "@/lib/types";

export default async function MembersPage() {
  const members = await getMembers();
  const activeMembers = members.filter((m) => m.status === "Active");
  const inactiveMembers = members.filter((m) => m.status === "Inactive");

  const MemberTable = ({ members }: { members: Member[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Image</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Member ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Savings</TableHead>
          <TableHead className="hidden md:table-cell">Loan Balance</TableHead>
          <TableHead className="hidden md:table-cell">Joined At</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <MemberActions member={member} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Has Loan
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>No Loan</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <AddMemberDialog />
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Manage your group members and view their details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberTable members={members} />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{members.length}</strong> of{" "}
              <strong>{members.length}</strong> members
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="active">
        <Card>
          <CardHeader>
            <CardTitle>Active Members</CardTitle>
            <CardDescription>
              Members who are currently active in the group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberTable members={activeMembers} />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{activeMembers.length}</strong> of{" "}
              <strong>{activeMembers.length}</strong> active members
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="inactive">
        <Card>
          <CardHeader>
            <CardTitle>Inactive Members</CardTitle>
            <CardDescription>
              Members who are no longer active in the group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberTable members={inactiveMembers} />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{inactiveMembers.length}</strong> of{" "}
              <strong>{inactiveMembers.length}</strong> inactive members
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
