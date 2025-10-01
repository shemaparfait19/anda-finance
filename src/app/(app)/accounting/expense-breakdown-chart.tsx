
'use client';

import { Pie, PieChart, Cell, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent } from '@/components/ui/card';
import type { CashbookEntry } from '@/lib/types';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface ExpenseBreakdownChartProps {
    expenses: CashbookEntry[];
}

export default function ExpenseBreakdownChart({ expenses }: ExpenseBreakdownChartProps) {
    
    if (expenses.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No expense data to display.
            </div>
        )
    }

    const dataByCategory = expenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
            acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(dataByCategory).map(([name, value]) => ({
        name,
        value,
    }));

    const chartConfig = chartData.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length],
        };
        return acc;
    }, {} as ChartConfig);


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={5}
                labelLine={false}
            >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
             <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
        </PieChart>
    </ChartContainer>
  );
}
