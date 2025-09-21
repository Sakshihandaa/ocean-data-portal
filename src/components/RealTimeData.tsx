"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChartSpline,
  ChartPie,
  TrendingUp,
  Gauge,
  LayoutGrid,
  Dot,
  Columns2,
  Columns3,
  Columns4,
  Layers2,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Station = {
  id: string;
  name: string;
};

type MetricKey = "sst" | "wave" | "wind" | "tide";

type Thresholds = {
  sst: number; // Sea Surface Temperature alert threshold (°C)
  wave: number; // Wave height alert threshold (m)
  wind: number; // Wind speed alert threshold (m/s)
  tide: number; // Tide level alert threshold (m)
};

type Reading = {
  ts: number;
  sst: number;
  wave: number;
  wind: number;
  tide: number;
};

type Props = {
  className?: string;
  style?: React.CSSProperties;
  stations: Station[];
  initialStationId?: string;
  comparisonEnabled?: boolean;
  thresholds?: Partial<Thresholds>;
  onDownloadCSV?: (primary: string, comparison: string | null, range: TimeRange, data: Reading[]) => void;
  onDownloadJSON?: (primary: string, comparison: string | null, range: TimeRange, data: Reading[]) => void;
  pollingMs?: number;
};

type TimeRange = "1H" | "6H" | "24H" | "7D";

const DEFAULT_THRESHOLDS: Thresholds = {
  sst: 28,
  wave: 2.5,
  wind: 12,
  tide: 1.5,
};

const RANGE_TO_POINTS: Record<TimeRange, number> = {
  "1H": 60,
  "6H": 60 * 6,
  "24H": 60 * 24,
  "7D": 60 * 24 * 7,
};

const METRIC_META: Record<
  MetricKey,
  { label: string; unit: string; color: string; accent: string; icon: React.ReactNode }
> = {
  sst: {
    label: "Sea Surface Temp",
    unit: "°C",
    color: "var(--chart-1)",
    accent: "text-[color:var(--chart-1)]",
    icon: <Gauge className="h-4 w-4 text-[color:var(--chart-1)]" aria-hidden />,
  },
  wave: {
    label: "Wave Height",
    unit: "m",
    color: "var(--chart-2)",
    accent: "text-[color:var(--chart-2)]",
    icon: <ChartSpline className="h-4 w-4 text-[color:var(--chart-2)]" aria-hidden />,
  },
  wind: {
    label: "Wind Speed",
    unit: "m/s",
    color: "var(--chart-3)",
    accent: "text-[color:var(--chart-3)]",
    icon: <TrendingUp className="h-4 w-4 text-[color:var(--chart-3)]" aria-hidden />,
  },
  tide: {
    label: "Tide Level",
    unit: "m",
    color: "var(--chart-4)",
    accent: "text-[color:var(--chart-4)]",
    icon: <ChartPie className="h-4 w-4 text-[color:var(--chart-4)]" aria-hidden />,
  },
};

function useSimulatedData(
  stationId: string | null,
  range: TimeRange,
  pollingMs: number,
  live: boolean
) {
  const [data, setData] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const seedRef = useRef<number>(Math.random() * 1000);

  // Generate baseline series with smooth noise
  const generateSeries = (points: number, startTs: number) => {
    const series: Reading[] = [];
    let t = seedRef.current;
    for (let i = points - 1; i >= 0; i--) {
      const ts = startTs - i * 60_000; // min resolution
      t += 0.15;
      const sst = 22 + 3 * Math.sin(t / 10) + noise(t, 0.6);
      const wave = 1.2 + 0.8 * Math.abs(Math.sin(t / 8)) + Math.max(0, noise(t + 20, 0.3));
      const wind = 6 + 4 * Math.abs(Math.sin(t / 6)) + noise(t + 40, 0.8);
      const tide = 0.8 + 0.6 * Math.sin(t / 20) + noise(t + 60, 0.2);
      series.push({
        ts,
        sst: round1(sst),
        wave: round2(wave),
        wind: round1(wind),
        tide: round2(tide),
      });
    }
    return series;
  };

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const points = Math.min(RANGE_TO_POINTS[range], 600); // cap for perf
    const now = Date.now();
    const series = generateSeries(points, now);
    if (!cancelled) {
      setData(series);
      // small delay to let skeleton show less flickery
      const id = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(id);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, stationId]);

  // Live polling mutation (append new point)
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const t = (last?.ts ?? Date.now()) / 1000 + Math.random() * 0.5;
        const next: Reading = {
          ts: (last?.ts ?? Date.now()) + 60_000,
          sst: round1((last?.sst ?? 22) + noise(t, 0.3)),
          wave: round2(Math.max(0, (last?.wave ?? 1.2) + noise(t + 20, 0.1))),
          wind: round1(Math.max(0, (last?.wind ?? 6) + noise(t + 40, 0.2))),
          tide: round2((last?.tide ?? 0.8) + noise(t + 60, 0.05)),
        };
        const max = Math.min(RANGE_TO_POINTS[range], 600);
        const nextArr = [...prev, next];
        if (nextArr.length > max) nextArr.shift();
        return nextArr;
      });
    }, pollingMs);
    return () => clearInterval(id);
  }, [pollingMs, live, range]);

  return { data, loading };
}

function noise(t: number, scale: number) {
  return (Math.sin(t) + Math.sin(t / 2) * 0.5 + Math.sin(t / 4) * 0.25) * 0.1 * scale;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatNumber(n: number, decimals = 1) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function toCSV(rows: Reading[]) {
  const header = ["ts", "sst", "wave", "wind", "tide"].join(",");
  const lines = rows.map((r) => [new Date(r.ts).toISOString(), r.sst, r.wave, r.wind, r.tide].join(","));
  return [header, ...lines].join("\n");
}

function download(filename: string, data: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function useConnectionIndicator(live: boolean) {
  const [status, setStatus] = useState<"connecting" | "live" | "paused">("connecting");
  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | null = null;
    setStatus("connecting");
    id = setTimeout(() => {
      setStatus(live ? "live" : "paused");
    }, 500);
    return () => {
      if (id) clearTimeout(id);
    };
  }, [live]);
  return status;
}

function Sparkline({
  series,
  color,
  altSeries,
  height = 120,
  strokeWidth = 2,
  ariaLabel,
}: {
  series: number[];
  color: string;
  altSeries?: { values: number[]; color: string } | null;
  height?: number;
  strokeWidth?: number;
  ariaLabel?: string;
}) {
  // Responsive SVG path computation
  const width = 500; // virtual width; will scale to parent
  const padding = 8;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const domain = extent(series);
  const scaleX = (i: number) => (i / Math.max(series.length - 1, 1)) * w + padding;
  const scaleY = (v: number) => {
    if (domain[0] === domain[1]) return h / 2 + padding;
    // invert y for SVG
    return padding + h - ((v - domain[0]) / (domain[1] - domain[0])) * h;
  };

  const path = toPath(series, scaleX, scaleY);
  const altPath =
    altSeries && altSeries.values.length ? toPath(altSeries.values, scaleX, (v) => {
      const d = extent(altSeries.values);
      if (d[0] === d[1]) return h / 2 + padding;
      return padding + h - ((v - d[0]) / (d[1] - d[0])) * h;
    }) : null;

  return (
    <div className="w-full max-w-full">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        className="h-28 w-full overflow-visible"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area under main line */}
        {series.length > 1 && (
          <path
            d={`${path} L ${padding + w} ${padding + h} L ${padding} ${padding + h} Z`}
            fill="url(#areaFill)"
            className="transition-all duration-500 ease-out"
          />
        )}
        {/* Alt/compare line */}
        {altPath && (
          <path
            d={altPath}
            fill="none"
            stroke={altSeries?.color}
            strokeWidth={strokeWidth}
            strokeDasharray="4 3"
            className="opacity-80 transition-all duration-500 ease-out"
          />
        )}
        {/* Main line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          className="transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function extent(arr: number[]): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of arr) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  // guard for flat lines
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

function toPath(
  values: number[],
  sx: (i: number) => number,
  sy: (v: number) => number
) {
  if (!values.length) return "";
  let d = `M ${sx(0)} ${sy(values[0])}`;
  for (let i = 1; i < values.length; i++) {
    const x = sx(i);
    const y = sy(values[i]);
    d += ` L ${x} ${y}`;
  }
  return d;
}

function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  severity,
  colorClass,
  icon,
}: {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  trend: number | null;
  severity: "ok" | "warn";
  colorClass: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card text-card-foreground border-border">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
            <span className={cn("inline-flex items-center justify-center rounded-md bg-accent px-2 py-1 text-xs font-medium", colorClass)}>
              {icon}
            </span>
            <span className="min-w-0 truncate">{title}</span>
          </CardTitle>
          <CardDescription className="mt-1 text-muted-foreground">{subtitle}</CardDescription>
        </div>
        <Badge
          variant={severity === "ok" ? "secondary" : "destructive"}
          className={cn(
            "shrink-0",
            severity === "ok" ? "bg-accent text-accent-foreground" : ""
          )}
        >
          {severity === "ok" ? "Normal" : "Alert"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="text-muted-foreground text-sm font-medium">{unit}</div>
          {typeof trend === "number" && (
            <div
              className={cn(
                "ml-auto text-xs font-medium inline-flex items-center gap-1",
                trend >= 0 ? "text-[color:var(--chart-3)]" : "text-muted-foreground"
              )}
              aria-label="Trend"
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              {trend >= 0 ? "+" : ""}
              {formatNumber(trend, 1)}
              {unit}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RealTimeData({
  className,
  style,
  stations,
  initialStationId,
  comparisonEnabled = true,
  thresholds,
  onDownloadCSV,
  onDownloadJSON,
  pollingMs = 3000,
}: Props) {
  const [range, setRange] = useState<TimeRange>("6H");
  const [primary, setPrimary] = useState<string | undefined>(
    stations?.[0]?.id ?? undefined
  );
  const [compare, setCompare] = useState<string | undefined>(undefined);
  const [live, setLive] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState(0); // manual refresh
  const effThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  useEffect(() => {
    if (initialStationId && stations.some((s) => s.id === initialStationId)) {
      setPrimary(initialStationId);
    }
  }, [initialStationId, stations]);

  const { data: primaryData, loading: loadingPrimary } = useSimulatedData(
    primary ?? null,
    range,
    pollingMs,
    live
  );
  const { data: compareData, loading: loadingCompare } = useSimulatedData(
    compare ?? null,
    range,
    pollingMs,
    live
  );

  // force reload data when manual refresh triggered
  useEffect(() => {
    // by toggling live off/on quickly we re-seed loading and data
    setLive((l) => !l);
    const id = setTimeout(() => setLive(true), 50);
    toast.success("Data refreshed");
    return () => clearTimeout(id);
  }, [refreshKey]);

  const status = useConnectionIndicator(live);

  const current = useMemo(() => primaryData[primaryData.length - 1], [primaryData]);
  const previous = useMemo(
    () => primaryData[primaryData.length - 2],
    [primaryData]
  );

  const compareCurrent = useMemo(
    () => compareData[compareData.length - 1],
    [compareData]
  );

  const metrics: MetricKey[] = ["sst", "wave", "wind", "tide"];

  const alertMap = {
    sst: current ? current.sst > effThresholds.sst : false,
    wave: current ? current.wave > effThresholds.wave : false,
    wind: current ? current.wind > effThresholds.wind : false,
    tide: current ? Math.abs(current.tide) > effThresholds.tide : false,
  };

  const trendMap = {
    sst: current && previous ? current.sst - previous.sst : null,
    wave: current && previous ? current.wave - previous.wave : null,
    wind: current && previous ? current.wind - previous.wind : null,
    tide: current && previous ? current.tide - previous.tide : null,
  };

  const handleDownloadCSV = () => {
    const filename = `ocean-data_${primary ?? "station"}_${range}.csv`;
    if (onDownloadCSV) {
      onDownloadCSV(primary ?? "", compare ?? null, range, primaryData);
    } else {
      const csv = toCSV(primaryData);
      download(filename, csv, "text/csv;charset=utf-8;");
    }
    toast.success("CSV download started");
  };

  const handleDownloadJSON = () => {
    const filename = `ocean-data_${primary ?? "station"}_${range}.json`;
    if (onDownloadJSON) {
      onDownloadJSON(primary ?? "", compare ?? null, range, primaryData);
    } else {
      const json = JSON.stringify(primaryData, null, 2);
      download(filename, json, "application/json;charset=utf-8;");
    }
    toast.success("JSON download started");
  };

  return (
    <section
      className={cn(
        "w-full max-w-full bg-card text-card-foreground rounded-lg border border-border p-4 sm:p-6",
        className
      )}
      style={style}
      aria-label="Real-time data dashboard"
    >
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="text-base sm:text-lg font-semibold">Real-time Observations</h2>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Dot
              className={cn(
                "h-5 w-5",
                status === "live" ? "text-[color:var(--chart-3)]" : status === "connecting" ? "text-amber-500" : "text-muted-foreground"
              )}
              aria-hidden
            />
            <span className="text-xs font-medium text-muted-foreground">
              {status === "live" ? "Live" : status === "connecting" ? "Connecting..." : "Paused"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Label htmlFor="live-toggle" className="text-xs text-muted-foreground">
              Auto-refresh
            </Label>
            <Switch
              id="live-toggle"
              checked={live}
              onCheckedChange={setLive}
              aria-label="Toggle auto-refresh"
            />
          </div>

          <Button
            variant="secondary"
            className="bg-secondary text-secondary-foreground hover:bg-muted"
            onClick={() => setRefreshKey((k) => k + 1)}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <Webhook className="mr-2 h-4 w-4" aria-hidden />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-primary text-primary-foreground hover:opacity-90">
                <Layers2 className="mr-2 h-4 w-4" aria-hidden />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuLabel>Download</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadCSV}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadJSON}>
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stations and range */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Station</CardTitle>
            <CardDescription>Select a primary station</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Select
              value={primary}
              onValueChange={(v) => setPrimary(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose station" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                {stations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {comparisonEnabled && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Compare Station</CardTitle>
              <CardDescription>Overlay a second station</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Select
                value={compare}
                onValueChange={(v) => setCompare(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {stations
                    .filter((s) => s.id !== primary)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary metrics */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const meta = METRIC_META[m];
          const v = current ? current[m] : null;
          const trend = trendMap[m];
          const severity = (alertMap as any)[m] ? "warn" : "ok";
          const valueStr =
            v === null || v === undefined ? "—" : formatNumber(v, m === "wave" || m === "tide" ? 2 : 1);
          return loadingPrimary ? (
            <Card key={m} className="bg-card border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-40 bg-muted" />
                <Skeleton className="mt-2 h-3 w-24 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-muted" />
              </CardContent>
            </Card>
          ) : (
            <MetricCard
              key={m}
              title={meta.label}
              value={valueStr}
              unit={meta.unit}
              subtitle="Current conditions"
              trend={trend}
              severity={severity as "ok" | "warn"}
              colorClass={meta.accent}
              icon={meta.icon}
            />
          );
        })}
      </div>

      {/* Charts with range tabs */}
      <div className="mt-6">
        <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
          <div className="flex items-center justify-between gap-3">
            <TabsList className="bg-secondary text-secondary-foreground">
              <TabsTrigger value="1H" aria-label="1 Hour">
                <Columns2 className="mr-2 h-3.5 w-3.5" aria-hidden />
                1H
              </TabsTrigger>
              <TabsTrigger value="6H" aria-label="6 Hours">
                <Columns3 className="mr-2 h-3.5 w-3.5" aria-hidden />
                6H
              </TabsTrigger>
              <TabsTrigger value="24H" aria-label="24 Hours">
                <Columns4 className="mr-2 h-3.5 w-3.5" aria-hidden />
                24H
              </TabsTrigger>
              <TabsTrigger value="7D" aria-label="7 Days">
                <Layers2 className="mr-2 h-3.5 w-3.5" aria-hidden />
                7D
              </TabsTrigger>
            </TabsList>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Dot className="h-4 w-4 text-[color:var(--chart-1)]" aria-hidden />
              Temp
              <Dot className="h-4 w-4 text-[color:var(--chart-2)]" aria-hidden />
              Wave
              <Dot className="h-4 w-4 text-[color:var(--chart-3)]" aria-hidden />
              Wind
              <Dot className="h-4 w-4 text-[color:var(--chart-4)]" aria-hidden />
              Tide
            </div>
          </div>

          {(["1H", "6H", "24H", "7D"] as TimeRange[]).map((r) => (
            <TabsContent key={r} value={r} className="mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {metrics.map((m) => {
                  const meta = METRIC_META[m];
                  const series = primaryData.map((d) => d[m]);
                  const compareSeries =
                    compare && compareData.length
                      ? {
                          values: compareData.map((d) => d[m]),
                          color: "var(--muted-foreground)",
                        }
                      : null;
                  return (
                    <Card key={`${r}-${m}`} className="bg-card border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn("rounded-md bg-accent px-2 py-1 text-xs font-medium", meta.accent)}>
                              {meta.icon}
                            </span>
                            <CardTitle className="text-sm font-semibold truncate">{meta.label}</CardTitle>
                          </div>
                          {(alertMap as any)[m] ? (
                            <Badge variant="destructive" className="shrink-0">
                              Threshold {meta.unit} &gt; {effThresholds[m]}!
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-accent text-accent-foreground shrink-0">
                              Stable
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {primary ? stations.find((s) => s.id === primary)?.name : "—"}
                          {compare && (
                            <span className="ml-2 text-muted-foreground">
                              vs {stations.find((s) => s.id === compare)?.name}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingPrimary ? (
                          <div className="space-y-3">
                            <Skeleton className="h-6 w-24 bg-muted" />
                            <Skeleton className="h-28 w-full bg-muted" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-baseline gap-2">
                              <div className="text-lg font-semibold">
                                {current ? formatNumber(current[m], m === "wave" || m === "tide" ? 2 : 1) : "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">{meta.unit}</div>
                              {typeof trendMap[m] === "number" && (
                                <div
                                  className={cn(
                                    "ml-auto text-xs inline-flex items-center gap-1",
                                    (trendMap[m] ?? 0) >= 0
                                      ? "text-[color:var(--chart-3)]"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                                  {trendMap[m]! >= 0 ? "+" : ""}
                                  {formatNumber(trendMap[m] ?? 0, 1)}
                                  {meta.unit}
                                </div>
                              )}
                            </div>
                            <Sparkline
                              series={series}
                              color={meta.color}
                              altSeries={compareSeries}
                              ariaLabel={`${meta.label} trend ${r}`}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}