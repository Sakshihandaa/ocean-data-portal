"use client";

import React, { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Gauge,
  TableOfContents,
  SquareArrowOutUpRight,
  RectangleEllipsis,
  MapPin,
  TabletSmartphone,
  FolderClock,
  ChartPie,
  FoldHorizontal,
  ExternalLink,
  Nfc,
} from "lucide-react";
import { toast } from "sonner";

type Trend = "up" | "down" | null;

type Metric = {
  label: string;
  value: string;
  helper?: string;
  trend?: Trend;
};

type Spec = {
  label: string;
  value: string;
};

type MaintenanceRecord = {
  date: string;
  type: string;
  notes?: string;
};

type Contact = {
  name: string;
  role: string;
  email?: string;
  phone?: string;
};

type RelatedInstrument = {
  id: string;
  name: string;
  category?: string;
};

type Location = {
  lat: number;
  lon: number;
  stationName?: string;
};

type ChartSeries = {
  name: string;
  color?: string;
  points: number[];
};

export type InstrumentDetailProps = {
  id: string;
  name: string;
  category?: string;
  status?: "online" | "offline" | "maintenance" | "degraded";
  installedAt?: string;
  images?: string[];
  description?: string;
  metrics?: Metric[];
  specs?: Spec[];
  sensors?: Spec[];
  capabilities?: string[];
  chartRealtime?: ChartSeries[];
  chartHistorical?: ChartSeries[];
  serviceHistory?: MaintenanceRecord[];
  upcomingService?: {
    date: string;
    task: string;
  } | null;
  contacts?: Contact[];
  location?: Location;
  surroundingStations?: { id: string; name: string; distanceKm: number }[];
  related?: RelatedInstrument[];
  className?: string;
  style?: React.CSSProperties;
  defaultTab?: "overview" | "specs" | "data" | "maintenance" | "location";
  onShare?: (id: string) => void;
  onBookmarkChange?: (id: string, bookmarked: boolean) => void;
};

function Badge({
  children,
  intent = "default",
  title,
}: {
  children: React.ReactNode;
  intent?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  title?: string;
}) {
  const styles =
    intent === "success"
      ? "bg-accent text-accent-foreground"
      : intent === "warning"
      ? "bg-amber-100 text-amber-900"
      : intent === "danger"
      ? "bg-destructive text-destructive-foreground"
      : intent === "info"
      ? "bg-chart-3/15 text-chart-3"
      : intent === "muted"
      ? "bg-muted text-muted-foreground"
      : "bg-secondary text-secondary-foreground";
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles} border border-border`}
    >
      {children}
    </span>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  pressed,
  ariaPressedLabel,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  pressed?: boolean;
  ariaPressedLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] ${pressed ? "bg-accent/60" : ""}`}
    >
      {icon}
      <span className="hidden sm:inline">{ariaPressedLabel ?? label}</span>
    </button>
  );
}

function Section({
  title,
  icon,
  actions,
  children,
  collapsibleOnMobile = false,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  collapsibleOnMobile?: boolean;
  defaultOpen?: boolean;
}) {
  if (collapsibleOnMobile) {
    return (
      <details
        className="group rounded-lg border border-border bg-card"
        open={defaultOpen}
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-4 py-3 sm:px-5 sm:py-4">
          {icon}
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold">
            {title}
          </h3>
          <div className="hidden gap-2 sm:flex">{actions}</div>
          <FoldHorizontal className="size-4 text-muted-foreground transition-transform group-open:rotate-180 sm:hidden" />
        </summary>
        <div className="border-t border-border px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      </details>
    );
  }
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 px-5 py-4">
        {icon}
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold">
          {title}
        </h3>
        <div className="flex gap-2">{actions}</div>
      </div>
      <div className="border-t border-border px-5 py-5">{children}</div>
    </section>
  );
}

function Sparkline({
  series,
  height = 120,
  strokeWidth = 2,
}: {
  series: ChartSeries[];
  height?: number;
  strokeWidth?: number;
}) {
  const maxLen = Math.max(...series.map((s) => s.points.length));
  const viewBoxWidth = Math.max(100, maxLen * 10);
  const paths = useMemo(() => {
    return series.map((s) => {
      const pts = s.points;
      const maxY = Math.max(...pts);
      const minY = Math.min(...pts);
      const spanY = maxY - minY || 1;
      const stepX = viewBoxWidth / Math.max(pts.length - 1, 1);
      const d = pts
        .map((y, i) => {
          const x = i * stepX;
          const ny = height - ((y - minY) / spanY) * (height - 8) - 4; // padding 4
          return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ny.toFixed(2)}`;
        })
        .join(" ");
      return { name: s.name, d, color: s.color || "var(--chart-3)" };
    });
  }, [series, height, viewBoxWidth]);
  return (
    <div className="w-full overflow-x-auto">
      <svg
        className="block max-w-full"
        width={viewBoxWidth}
        height={height}
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        role="img"
        aria-label="Data chart"
      >
        <rect width="100%" height="100%" fill="transparent" />
        {paths.map((p, idx) => (
          <path
            key={idx}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="sm:col-span-2 min-w-0 break-words text-sm">{value}</div>
    </div>
  );
}

export default function InstrumentDetail({
  id,
  name,
  category = "In Situ",
  status = "online",
  installedAt,
  images = [
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520095972714-909e91b038e5?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1200&auto=format&fit=crop",
  ],
  description = "Autonomous oceanographic instrument for continuous in-situ monitoring, capturing temperature, salinity, dissolved oxygen, and wave characteristics with real-time telemetry.",
  metrics = [
    { label: "Uptime", value: "99.7%", trend: "up" },
    { label: "Battery", value: "78%", helper: "est. 21 days", trend: "down" },
    { label: "Signal", value: "-72 dBm", trend: null },
    { label: "Data Rate", value: "5.2 KB/s", trend: "up" },
  ],
  specs = [
    { label: "Model", value: "AquaSense X200" },
    { label: "Manufacturer", value: "Pelagia Systems" },
    { label: "Ingress Protection", value: "IP68 (100m)" },
    { label: "Materials", value: "316L SS, Delrin, Sapphire window" },
    { label: "Power", value: "Lithium primary pack, 12V 18Ah" },
  ],
  sensors = [
    { label: "Temperature", value: "±0.01°C, 0.001°C resolution" },
    { label: "Conductivity", value: "±0.003 mS/cm" },
    { label: "Dissolved Oxygen", value: "±1% of reading" },
    { label: "Pressure", value: "0–50 dbar, ±0.1%" },
  ],
  capabilities = [
    "Real-time telemetry via LTE/NB-IoT",
    "Onboard storage (64GB)",
    "Over-the-air firmware updates",
    "Edge QC with flagged anomalies",
  ],
  chartRealtime = [
    { name: "Temperature", color: "var(--chart-3)", points: [12.3, 12.4, 12.6, 12.5, 12.7, 12.9, 13.1] },
    { name: "Salinity", color: "var(--chart-2)", points: [35.1, 35.0, 34.9, 35.2, 35.3, 35.2, 35.1] },
  ],
  chartHistorical = [
    { name: "Wave Height", color: "var(--chart-1)", points: [0.6, 0.8, 1.1, 0.9, 0.7, 1.2, 1.4, 1.0, 0.8, 1.3] },
  ],
  serviceHistory = [
    { date: "2025-03-18", type: "Calibration", notes: "CTD recalibrated; DO sensor membrane replaced." },
    { date: "2025-01-07", type: "Battery Swap", notes: "Installed new 18Ah pack." },
  ],
  upcomingService = { date: "2025-10-02", task: "Mid-season inspection & cleaning" },
  contacts = [
    { name: "Dr. Lina Ortega", role: "Field Ops Lead", email: "l.ortega@ocean.net" },
    { name: "Support Desk", role: "24/7 Support", email: "support@ocean.net", phone: "+1 (555) 555-2929" },
  ],
  location = { lat: 36.7783, lon: -122.417, stationName: "Monterey Shelf Buoy" },
  surroundingStations = [
    { id: "STN-009", name: "Harbor Tide Gauge", distanceKm: 12.4 },
    { id: "STN-014", name: "Coastal Weather Tower", distanceKm: 18.1 },
  ],
  related = [
    { id: "INS-204", name: "Wave Rider MkII", category: "In Situ" },
    { id: "INS-351", name: "Lidar Surface Scanner", category: "Remote" },
  ],
  className,
  style,
  defaultTab = "overview",
  onShare,
  onBookmarkChange,
}: InstrumentDetailProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");

  const statusColor: { [k in NonNullable<InstrumentDetailProps["status"]>]: string } = {
    online: "bg-emerald-100 text-emerald-800",
    offline: "bg-destructive text-destructive-foreground",
    maintenance: "bg-amber-100 text-amber-900",
    degraded: "bg-rose-100 text-rose-800",
  };

  const handleShare = () => {
    if (onShare) onShare(id);
    toast.success("Share link copied");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${typeof window !== "undefined" ? window.location.origin : ""}/instruments/${id}`).catch(() => null);
    }
  };

  const handleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    onBookmarkChange?.(id, next);
    toast.message(next ? "Added to bookmarks" : "Removed from bookmarks");
  };

  const exportData = () => {
    toast.success("Data export started");
  };

  const mainImage = images[Math.min(activeImg, images.length - 1)];

  return (
    <section className={className} style={style}>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex w-full items-center gap-2 text-sm text-muted-foreground"
      >
        <a href="/" className="hover:underline">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/instruments" className="hover:underline">Instruments</a>
        <span aria-hidden="true">/</span>
        <span className="text-foreground font-medium truncate">{name}</span>
      </nav>

      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">{name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge intent="muted">
              <TableOfContents className="mr-1 size-3.5" />
              {category}
            </Badge>
            <Badge intent={status === "online" ? "success" : status === "maintenance" ? "warning" : status === "offline" ? "danger" : "info"}>
              <Gauge className="mr-1 size-3.5" />
              {status[0].toUpperCase() + status.slice(1)}
            </Badge>
            {installedAt && (
              <span className="text-xs text-muted-foreground">
                Installed {new Date(installedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            label={bookmarked ? "Bookmarked" : "Bookmark"}
            ariaPressedLabel={bookmarked ? "Bookmarked" : "Bookmark"}
            icon={<RectangleEllipsis className="size-4" />}
            onClick={handleBookmark}
            pressed={bookmarked}
          />
          <IconButton
            label="Share"
            icon={<SquareArrowOutUpRight className="size-4" />}
            onClick={handleShare}
          />
        </div>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-secondary">
            {mainImage && (
              <img
                src={mainImage}
                alt={`${name} image ${activeImg + 1}`}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImg(idx)}
                  aria-label={`Select image ${idx + 1}`}
                  className={`relative size-16 shrink-0 overflow-hidden rounded-md border ${idx === activeImg ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "border-border"}`}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-1 space-y-4">
          <Section
            title="Overview"
            icon={<TabletSmartphone className="size-4 text-muted-foreground" />}
            collapsibleOnMobile
          >
            <p className="text-sm leading-relaxed">
              {description}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-border bg-secondary p-3"
                >
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="text-base font-semibold">{m.value}</div>
                    {m.helper && (
                      <span className="text-xs text-muted-foreground">{m.helper}</span>
                    )}
                    {typeof m.trend !== "undefined" && m.trend !== null && (
                      <span
                        className={`ml-auto text-[11px] font-medium ${m.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}
                        aria-label={`Trend ${m.trend}`}
                      >
                        {m.trend === "up" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Quick actions"
            icon={<Nfc className="size-4 text-muted-foreground" />}
            collapsibleOnMobile
          >
            <div className="flex flex-wrap gap-2">
              <a
                href={`/instruments/${id}`}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ExternalLink className="size-4" />
                Open details
              </a>
              <button
                type="button"
                onClick={exportData}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ChartPie className="size-4" />
                Export data
              </button>
            </div>
          </Section>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto rounded-lg border border-border bg-card p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Section
              title="Description"
              icon={<TableOfContents className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <p className="text-sm leading-relaxed">{description}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <KeyValue label="ID" value={<code className="break-words text-xs">{id}</code>} />
                <KeyValue label="Category" value={category} />
                <KeyValue label="Status" value={<Badge intent={status === "online" ? "success" : status === "maintenance" ? "warning" : status === "offline" ? "danger" : "info"}>{status}</Badge>} />
                {installedAt && <KeyValue label="Installed" value={new Date(installedAt).toLocaleString()} />}
              </div>
            </Section>

            <Section
              title="Key metrics"
              icon={<Gauge className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metrics.map((m, idx) => (
                  <div key={idx} className="rounded-md border border-border bg-secondary px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      {m.helper && <span className="ml-auto text-xs text-muted-foreground">{m.helper}</span>}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{m.value}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Related instruments"
              icon={<RectangleEllipsis className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <ul className="space-y-3">
                {related?.map((r) => (
                  <li key={r.id} className="min-w-0">
                    <a
                      href={`/instruments/${r.id}`}
                      className="group flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:bg-secondary"
                    >
                      <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <TabletSmartphone className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium group-hover:underline">
                          {r.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.category}</div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section
              title="Technical details"
              icon={<TableOfContents className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <div className="space-y-3">
                {specs.map((s, idx) => (
                  <KeyValue key={idx} label={s.label} value={s.value} />
                ))}
              </div>
            </Section>
            <Section
              title="Sensors"
              icon={<Gauge className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <div className="space-y-3">
                {sensors.map((s, idx) => (
                  <KeyValue key={idx} label={s.label} value={s.value} />
                ))}
              </div>
            </Section>
            <Section
              title="Capabilities"
              icon={<ChartPie className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <ul className="grid list-disc grid-cols-1 gap-2 pl-5">
                {capabilities.map((c, idx) => (
                  <li key={idx} className="text-sm">{c}</li>
                ))}
              </ul>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <Section
            title="Charts"
            icon={<ChartPie className="size-4 text-muted-foreground" />}
            actions={
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select time range"
                  value={range}
                  onChange={(e) => setRange(e.target.value as typeof range)}
                  className="h-9 rounded-md border border-border bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <button
                  type="button"
                  onClick={exportData}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <SquareArrowOutUpRight className="size-4" />
                  Export
                </button>
              </div>
            }
            collapsibleOnMobile
            defaultOpen
          >
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">Real-time</div>
                  <div className="flex flex-wrap gap-2">
                    {chartRealtime.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: s.color || "var(--chart-3)" }}
                          aria-hidden
                        />
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
                  <Sparkline series={chartRealtime} height={140} />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">Historical</div>
                  <div className="flex flex-wrap gap-2">
                    {chartHistorical.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: s.color || "var(--chart-1)" }}
                          aria-hidden
                        />
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
                  <Sparkline series={chartHistorical} height={160} />
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Data table"
            icon={<TableOfContents className="size-4 text-muted-foreground" />}
            collapsibleOnMobile
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="whitespace-nowrap border border-border px-3 py-2">Timestamp</th>
                    <th className="whitespace-nowrap border border-border px-3 py-2">Temperature (°C)</th>
                    <th className="whitespace-nowrap border border-border px-3 py-2">Salinity (PSU)</th>
                    <th className="whitespace-nowrap border border-border px-3 py-2">Wave H (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="odd:bg-card even:bg-secondary/40">
                      <td className="border border-border px-3 py-2">
                        {new Date(Date.now() - i * 3600_000).toLocaleString()}
                      </td>
                      <td className="border border-border px-3 py-2">{
                        (12.5 + Math.sin(i) * 0.4).toFixed(2)
                      }</td>
                      <td className="border border-border px-3 py-2">{
                        (35 + Math.cos(i) * 0.3).toFixed(2)
                      }</td>
                      <td className="border border-border px-3 py-2">{
                        (0.9 + Math.sin(i * 0.7) * 0.3).toFixed(2)
                      }</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section
              title="Service history"
              icon={<FolderClock className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <ul className="space-y-3">
                {serviceHistory?.map((h, idx) => (
                  <li key={idx} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{h.type}</div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(h.date).toLocaleDateString()}
                      </span>
                    </div>
                    {h.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{h.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
            <Section
              title="Scheduled maintenance"
              icon={<Gauge className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              {upcomingService ? (
                <div className="rounded-md border border-border bg-secondary p-4">
                  <div className="text-sm font-medium">{upcomingService.task}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Due {new Date(upcomingService.date).toLocaleString()}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toast.message("Reminder set")}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Set reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.message("Ticket created")}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Create ticket
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming maintenance scheduled.</p>
              )}
            </Section>
            <Section
              title="Contacts"
              icon={<TabletSmartphone className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <ul className="space-y-3">
                {contacts?.map((c, idx) => (
                  <li key={idx} className="rounded-md border border-border bg-card p-3">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.role}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm">
                      {c.email && (
                        <a className="hover:underline" href={`mailto:${c.email}`}>
                          {c.email}
                        </a>
                      )}
                      {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="location" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Section
              title="Map"
              icon={<MapPin className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <div className="relative h-72 w-full overflow-hidden rounded-md border border-border bg-secondary">
                <img
                  src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1400&auto=format&fit=crop"
                  alt="Ocean map context"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 rounded-md bg-card/90 px-3 py-2 shadow">
                      <MapPin className="size-4 text-primary" />
                      <div className="text-sm font-medium">
                        {location?.stationName || "Station"}
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary"></div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KeyValue label="Latitude" value={location?.lat.toFixed(5)} />
                <KeyValue label="Longitude" value={location?.lon.toFixed(5)} />
                <KeyValue label="Station" value={location?.stationName || "—"} />
              </div>
            </Section>

            <Section
              title="Nearby stations"
              icon={<MapPin className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <ul className="space-y-3">
                {surroundingStations?.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.distanceKm.toFixed(1)} km</div>
                    </div>
                    <a
                      href={`/stations/${s.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium hover:bg-secondary/70"
                    >
                      View
                      <SquareArrowOutUpRight className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              title="Quick info"
              icon={<TableOfContents className="size-4 text-muted-foreground" />}
              collapsibleOnMobile
              defaultOpen
            >
              <div className="space-y-3">
                <KeyValue label="ID" value={<code className="text-xs break-words">{id}</code>} />
                <KeyValue label="Category" value={category} />
                <KeyValue label="Status" value={<Badge intent={status === "online" ? "success" : status === "maintenance" ? "warning" : status === "offline" ? "danger" : "info"}>{status}</Badge>} />
              </div>
            </Section>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}