import { Suspense } from "react";
import { File, ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getMembers } from "@/lib/data-service";
import AddMemberDialog from "./add-member-dialog";
import MembersTable from "./members-table";

// Force dynamic rendering to access environment variables
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();
  const activeMembers = members.filter((m) => m.status === "Active");
  const inactiveMembers = members.filter((m) => m.status === "Inactive");
  const temporaryInactiveMembers = members.filter(
    (m) => m.status === "Temporary Inactive"
  );
  const dormantMembers = members.filter((m) => m.status === "Dormant");
  const closedMembers = members.filter((m) => m.status === "Closed");

  return (
    <Tabs defaultValue="all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="temporary-inactive" className="hidden sm:inline-flex">Temp. Inactive</TabsTrigger>
            <TabsTrigger value="dormant">Dormant</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Has Loan</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>No Loan</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
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
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <MembersTable members={members} />
            </Suspense>
          </CardContent>
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
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <MembersTable members={activeMembers} />
            </Suspense>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="temporary-inactive">
        <Card>
          <CardHeader>
            <CardTitle>Temporary Inactive Members</CardTitle>
            <CardDescription>
              Members who have been manually set to temporarily inactive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <MembersTable members={temporaryInactiveMembers} />
            </Suspense>
          </CardContent>
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
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <MembersTable members={inactiveMembers} />
            </Suspense>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="dormant">
        <Tabs defaultValue="all-dormant">
          <div className="flex items-center mb-4">
            <TabsList>
              <TabsTrigger value="all-dormant">All</TabsTrigger>
              <TabsTrigger value="active-dormant">Active</TabsTrigger>
              <TabsTrigger value="inactive-dormant">Inactive</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all-dormant">
            <Card>
              <CardHeader>
                <CardTitle>Dormant Members - All</CardTitle>
                <CardDescription>All dormant members in the group.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <MembersTable members={dormantMembers} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="active-dormant">
            <Card>
              <CardHeader>
                <CardTitle>Dormant Members - Active</CardTitle>
                <CardDescription>Active dormant members.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <MembersTable members={dormantMembers.filter(m => m.status === "Active")} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inactive-dormant">
            <Card>
              <CardHeader>
                <CardTitle>Dormant Members - Inactive</CardTitle>
                <CardDescription>Inactive dormant members.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <MembersTable members={dormantMembers.filter(m => m.status === "Inactive")} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </TabsContent>
      <TabsContent value="closed">
        <Tabs defaultValue="all-closed">
          <div className="flex items-center mb-4">
            <TabsList>
              <TabsTrigger value="all-closed">All</TabsTrigger>
              <TabsTrigger value="active-closed">Active</TabsTrigger>
              <TabsTrigger value="inactive-closed">Inactive</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all-closed">
            <Card>
              <CardHeader>
                <CardTitle>Closed Members - All</CardTitle>
                <CardDescription>All closed members in the group.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <MembersTable members={closedMembers} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="active-closed">
            <Card>
              <CardHeader>
                <CardTitle>Closed Members - Active</CardTitle>
                <CardDescription>Active closed members.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <MembersTable members={closedMembers.filter(m => m.status === "Active")} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inactive-closed">
            <Card>
              <CardHeader>
                <CardTitle>Closed Members - Inactive</CardTitle>
                <CardDescription>Inactive closed members.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <MembersTable members={closedMembers.filter(m => m.status === "Inactive")} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
