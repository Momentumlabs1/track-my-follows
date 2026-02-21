import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { mockChartData } from "@/lib/mockData";

export function StatsChart() {
  return (
    <div className="rounded-2xl surface-elevated border border-border/30 p-5 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-semibold">Aktivität / 7 Tage 📊</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Follows</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-lavender" /> Unfollows</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockChartData} barGap={3} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 12% 14%)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'hsl(280 8% 48%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(280 8% 48%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(280 18% 8%)',
              border: '1px solid hsl(280 12% 14%)',
              borderRadius: '1rem',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="follows" fill="hsl(335 78% 65%)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="unfollows" fill="hsl(280 60% 70%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
