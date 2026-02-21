import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { mockChartData } from "@/lib/mockData";

export function StatsChart() {
  return (
    <div className="rounded-xl surface-elevated border border-border/40 p-5 noise overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-semibold">Activity / 7 days</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> Follows</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-rose" /> Unfollows</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockChartData} barGap={2} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 12%)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'hsl(220 10% 45%)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(220 10% 45%)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220 20% 7%)',
              border: '1px solid hsl(220 15% 12%)',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono',
            }}
          />
          <Bar dataKey="follows" fill="hsl(160 80% 55%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="unfollows" fill="hsl(350 80% 60%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
