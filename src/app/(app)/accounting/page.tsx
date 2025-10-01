import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { income, expenses } from '@/lib/data';
import type { CashbookEntry } from '@/lib/types';

function CashbookTable({ data, type }: { data: CashbookEntry[], type: 'Income' | 'Expenses' }) {
  const total = data.reduce((acc, entry) => acc + entry.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type}</CardTitle>
        <CardDescription>All {type.toLowerCase()} recorded in the cashbook.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className='hidden md:table-cell'>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.date}</TableCell>
                <TableCell className="font-medium">{entry.description}</TableCell>
                <TableCell className='hidden md:table-cell'>{entry.category}</TableCell>
                <TableCell className="text-right">RWF {entry.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow className='bg-muted/50 font-bold'>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className='text-right'>RWF {total.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AccountingPage() {
    const totalIncome = income.reduce((acc, entry) => acc + entry.amount, 0);
    const totalExpenses = expenses.reduce((acc, entry) => acc + entry.amount, 0);
    const netBalance = totalIncome - totalExpenses;

  return (
    <div className='space-y-6'>
         <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Total Income</CardDescription>
                    <CardTitle className="text-4xl font-headline text-green-600">RWF {totalIncome.toLocaleString()}</CardTitle>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Total Expenses</CardDescription>
                    <CardTitle className="text-4xl font-headline text-red-600">RWF {totalExpenses.toLocaleString()}</CardTitle>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Net Balance</CardDescription>
                    <CardTitle className={`text-4xl font-headline ${netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>RWF {netBalance.toLocaleString()}</CardTitle>
                </CardHeader>
            </Card>
        </div>

        <Tabs defaultValue="income">
        <div className="flex items-center">
            <TabsList>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Entry
                </span>
            </Button>
            </div>
        </div>
        <TabsContent value="income">
            <CashbookTable data={income} type="Income" />
        </TabsContent>
        <TabsContent value="expenses">
            <CashbookTable data={expenses} type="Expenses" />
        </TabsContent>
        </Tabs>
    </div>
  );
}
