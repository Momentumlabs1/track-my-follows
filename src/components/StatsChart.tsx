import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { mockChartData } from "@/lib/mockData";

export function StatsChart() {
  return (
    <div className="rounded-xl bg-card border border-border/50 p-5">
      <h3 className="text-sm font-semibold mb-4">Follow-Aktivität (letzte 7 Tage)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={mockChartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
          <XAxis
            dataKey="day"
            tick={{ fill: 'hsl(240 5% 55%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(240 5% 55%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(240 17% 7%)',
              border: '1px solid hsl(240 10% 14%)',
              borderRadius: '0.75rem',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="follows" fill="hsl(263 70% 58%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="unfollows" fill="hsl(330 80% 60%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
