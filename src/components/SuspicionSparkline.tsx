interface SuspicionSparklineProps {
  weeklyScores: number[];
}

export function SuspicionSparkline({ weeklyScores }: SuspicionSparklineProps) {
  if (weeklyScores.length < 2) return null;

  const max = Math.max(...weeklyScores, 1);
  const points = weeklyScores
    .map((score, i) => `${i * 30 + 5},${40 - (score / max) * 35}`)
    .join(" ");

  const getColor = (score: number) => {
    if (score <= 20) return "#22C55E";
    if (score <= 50) return "#EAB308";
    return "#EF4444";
  };

  return (
    <svg width="100" height="45" className="flex-shrink-0">
      <polyline fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" points={points} strokeLinejoin="round" />
      {weeklyScores.map((score, i) => (
        <circle key={i} cx={i * 30 + 5} cy={40 - (score / max) * 35} r="3" fill={getColor(score)} />
      ))}
    </svg>
  );
}
