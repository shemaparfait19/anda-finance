import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ListFilter, Search } from 'lucide-react';
import { auditLogs } from '@/lib/data';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export default function AuditPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>
          A chronological log of all actions and events in the system.
        </CardDescription>
        <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-8" />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                    </span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                    <DropdownMenuItem>User Login</DropdownMenuItem>
                    <DropdownMenuItem>Loan Approval</DropdownMenuItem>
                    <DropdownMenuItem>New Deposit</DropdownMenuItem>
                    <DropdownMenuItem>Update System Settings</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Timestamp</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => {
              const image = getPlaceholderImage(log.user.avatarId);
              return (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Image
                      alt={`Avatar of ${log.user.name}`}
                      className="aspect-square rounded-full object-cover"
                      height="32"
                      width="32"
                      src={image.imageUrl}
                      data-ai-hint={image.imageHint}
                    />
                    <span className="font-medium">{log.user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.timestamp}
                </TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
