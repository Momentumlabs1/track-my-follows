import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { mockChartData } from "@/lib/mockData";

export function StatsChart() {
  return (
    <div className="bento-card">
      <div className="flex items-center justify-between mb-6 relative">
        <h3 className="text-sm font-bold">Aktivität / 7 Tage 📊</h3>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full gradient-bg" /> Follows
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Unfollows
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockChartData} barGap={4} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(300 10% 12%)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'hsl(300 8% 50%)', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(300 8% 50%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(300 12% 7%)',
              border: '1px solid hsl(300 10% 15%)',
              borderRadius: '1rem',
              fontSize: '12px',
              boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
            }}
          />
          <Bar dataKey="follows" fill="hsl(330 100% 71%)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="unfollows" fill="hsl(270 80% 75%)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
