const CHART_HEIGHT = 160;

export function MonthlyBarChart({
  data,
  color,
  formatValue = (value: number) => value.toLocaleString("es-DO"),
}: {
  data: { label: string; value: number }[];
  color: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex items-end gap-2 border-b border-border" style={{ height: CHART_HEIGHT }}>
        {data.map((d, i) => {
          const barHeight = d.value > 0 ? Math.max((d.value / max) * (CHART_HEIGHT - 24), 4) : 0;
          const isLast = i === data.length - 1;
          return (
            <div
              key={d.label}
              title={`${d.label}: ${formatValue(d.value)}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              {isLast && d.value > 0 && (
                <span className="text-[10px] font-medium whitespace-nowrap text-foreground">{formatValue(d.value)}</span>
              )}
              <div
                className="w-full max-w-6 rounded-t-sm transition-opacity hover:opacity-75"
                style={{ height: barHeight, backgroundColor: color }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center text-[10px] text-muted-foreground">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StackedStatusBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="space-y-2">
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.value > 0 ? s.color : "transparent" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} <span className="font-medium text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
