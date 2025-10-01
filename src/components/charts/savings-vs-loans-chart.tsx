'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { chartData } from '@/lib/data';

const chartConfig = {
  savings: {
    label: 'Savings',
    color: 'hsl(var(--chart-1))',
  },
  loans: {
    label: 'Loans',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function SavingsVsLoansChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="savings" fill="var(--color-savings)" radius={4} />
        <Bar dataKey="loans" fill="var(--color-loans)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
