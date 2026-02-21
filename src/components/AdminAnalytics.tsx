"use client";

import { useState, useEffect } from "react";

interface DailyPlayer {
  date: string;
  count: number;
}

interface AnalyticsData {
  dailyPlayers: DailyPlayer[];
  todayScoreHistogram: Record<string, number> | null;
  todayTopic: string | null;
  todayPlayers: number;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function DailyPlayersChart({ data }: { data: DailyPlayer[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalPlayers = data.reduce((sum, d) => sum + d.count, 0);

  // SVG dimensions
  const width = 600;
  const height = 200;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 32;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - (d.count / maxCount) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = Math.round((maxCount / 4) * i);
    const y = padTop + chartH - (val / maxCount) * chartH;
    return { val, y };
  });

  // X-axis labels (show ~6 evenly spaced)
  const xLabelCount = 6;
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1));
    return { idx, label: formatDateLabel(data[idx].date), x: points[idx].x };
  });

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-extrabold text-warm-brown">Daily Players (Last 30 Days)</h3>
        <span className="text-xs font-bold text-warm-brown/50">{totalPlayers} total</span>
      </div>
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
          {yTicks.map((t) => (
            <line
              key={t.val}
              x1={padLeft}
              y1={t.y}
              x2={width - padRight}
              y2={t.y}
              stroke="currentColor"
              className="text-border"
              strokeDasharray="4 4"
              strokeWidth={0.5}
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map((t) => (
            <text
              key={t.val}
              x={padLeft - 6}
              y={t.y + 3}
              textAnchor="end"
              className="fill-warm-brown/40"
              fontSize={10}
              fontWeight={600}
            >
              {t.val}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map((l) => (
            <text
              key={l.idx}
              x={l.x}
              y={height - 6}
              textAnchor="middle"
              className="fill-warm-brown/40"
              fontSize={10}
              fontWeight={600}
            >
              {l.label}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} className="fill-accent/10" />

          {/* Line */}
          <path d={linePath} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" />

          {/* Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 5 : 2.5}
              className={hoverIndex === i ? "fill-accent" : "fill-accent/60"}
            />
          ))}

          {/* Hover zones */}
          {points.map((p, i) => (
            <rect
              key={`hover-${i}`}
              x={p.x - chartW / data.length / 2}
              y={padTop}
              width={chartW / data.length}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {/* Tooltip */}
          {hovered && (
            <>
              <line
                x1={hovered.x}
                y1={padTop}
                x2={hovered.x}
                y2={padTop + chartH}
                className="stroke-accent/30"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <rect
                x={Math.min(hovered.x - 50, width - padRight - 100)}
                y={Math.max(hovered.y - 36, padTop)}
                width={100}
                height={28}
                rx={8}
                className="fill-foreground"
                opacity={0.9}
              />
              <text
                x={Math.min(hovered.x, width - padRight - 50)}
                y={Math.max(hovered.y - 18, padTop + 14)}
                textAnchor="middle"
                className="fill-surface"
                fontSize={11}
                fontWeight={700}
              >
                {formatDateLabel(hovered.date)}: {hovered.count}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function ScoreDistribution({
  histogram,
  topic,
  totalPlayers,
}: {
  histogram: Record<string, number>;
  topic: string;
  totalPlayers: number;
}) {
  const buckets = Array.from({ length: 11 }, (_, i) => ({
    score: i,
    count: (histogram[String(i)] ?? 0) as number,
  }));

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-extrabold text-warm-brown">Today&apos;s Score Distribution</h3>
        <span className="text-xs font-bold text-warm-brown/50">{totalPlayers} players</span>
      </div>
      <div className="text-xs font-semibold text-warm-brown/50 mb-1">{topic}</div>
      <div className="flex items-end gap-[3px] sm:gap-1.5 h-28 px-1">
        {buckets.map(({ score, count }) => {
          const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={score} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="text-[10px] font-bold text-warm-brown/50 leading-none">
                {count > 0 ? count : ""}
              </div>
              <div className="w-full relative" style={{ height: "80px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t bg-accent/70 transition-all duration-500"
                  style={{ height: `${Math.max(heightPct, count > 0 ? 3 : 0)}%` }}
                />
              </div>
              <div className="text-xs font-bold text-warm-brown/40 leading-none">
                {score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-warm-brown/50 font-bold animate-pulse text-sm py-8 text-center">
        Loading analytics...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-warm-brown">Analytics</h2>

      {/* Daily Players Line Chart */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
        <DailyPlayersChart data={data.dailyPlayers} />
      </div>

      {/* Today's Score Distribution */}
      {data.todayScoreHistogram && data.todayTopic ? (
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <ScoreDistribution
            histogram={data.todayScoreHistogram}
            topic={data.todayTopic}
            totalPlayers={data.todayPlayers}
          />
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <h3 className="text-sm font-extrabold text-warm-brown">Today&apos;s Score Distribution</h3>
          <p className="text-sm text-warm-brown/50 font-semibold mt-2">No puzzle published for today.</p>
        </div>
      )}
    </div>
  );
}
