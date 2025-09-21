"use client"

import React, { useEffect, useMemo, useState } from "react"
import { TriangleAlert, Radar, BellMinus, CircleAlert, PanelTopOpen, MessageSquareWarning, Siren, Webhook, BellPlus, BellRing, Bell, MessageCircleWarning, CloudSnow, Flame, ClockAlert, Slack } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Severity = "critical" | "high" | "medium" | "low"
type AlertType = "weather" | "ocean" | "navigation" | "tsunami"

export interface AlertItem {
  id: string
  title: string
  description: string
  severity: Severity
  type: AlertType
  regions: string[]
  issuedAt: string // ISO
  expiresAt?: string // ISO
  emergency?: boolean // emergency alerts get prominent styling
  priority?: boolean // pinned to top
}

interface AdvisoriesAlertsProps {
  className?: string
  style?: React.CSSProperties
  alerts?: AlertItem[]
  pageSize?: number
  autoRefreshIntervalMs?: number
  onRefresh?: () => Promise<AlertItem[]> | AlertItem[] | void
}

const severityMeta: Record<
  Severity,
  { label: string; bg: string; text: string; ring: string; chip: string; icon: React.ReactNode }
> = {
  critical: {
    label: "Critical",
    bg: "bg-destructive/10",
    text: "text-destructive",
    ring: "ring-2 ring-destructive/40",
    chip: "bg-destructive text-destructive-foreground",
    icon: <TriangleAlert className="size-4" aria-hidden="true" />,
  },
  high: {
    label: "High",
    bg: "bg-chart-4/10",
    text: "text-chart-4",
    ring: "ring-2 ring-chart-4/30",
    chip: "bg-chart-4 text-primary-foreground",
    icon: <Flame className="size-4" aria-hidden="true" />,
  },
  medium: {
    label: "Medium",
    bg: "bg-chart-2/10",
    text: "text-chart-2",
    ring: "ring-2 ring-chart-2/30",
    chip: "bg-chart-2 text-primary-foreground",
    icon: <ClockAlert className="size-4" aria-hidden="true" />,
  },
  low: {
    label: "Low",
    bg: "bg-chart-3/10",
    text: "text-chart-3",
    ring: "ring-2 ring-chart-3/30",
    chip: "bg-chart-3 text-primary-foreground",
    icon: <Radar className="size-4" aria-hidden="true" />,
  },
}

const typeMeta: Record<
  AlertType,
  { label: string; icon: React.ReactNode }
> = {
  weather: { label: "Weather Warnings", icon: <CloudSnow className="size-4" aria-hidden="true" /> },
  ocean: { label: "Ocean Conditions", icon: <Radar className="size-4" aria-hidden="true" /> },
  navigation: { label: "Navigation Hazards", icon: <MessageSquareWarning className="size-4" aria-hidden="true" /> },
  tsunami: { label: "Tsunami Alerts", icon: <Siren className="size-4" aria-hidden="true" /> },
}

const defaultAlerts: AlertItem[] = [
  {
    id: "a-1001",
    title: "Tsunami Warning for Northern Coast",
    description:
      "A strong undersea earthquake has generated potential tsunami waves. Immediate evacuation advised for low-lying coastal areas.",
    severity: "critical",
    type: "tsunami",
    regions: ["Northern Coast", "Bay of Cascadia"],
    issuedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    emergency: true,
    priority: true,
  },
  {
    id: "a-1002",
    title: "Gale Warning - Offshore Waters",
    description:
      "Sustained winds 35–45 knots with higher gusts expected beyond 20nm offshore. Small craft should remain in port.",
    severity: "high",
    type: "weather",
    regions: ["Offshore Zone 3", "Outer Banks"],
    issuedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    priority: true,
  },
  {
    id: "a-1003",
    title: "Strong Swell Advisory",
    description:
      "Long-period swell 3–4m impacting west-facing beaches. Dangerous shore break and strong rip currents likely.",
    severity: "medium",
    type: "ocean",
    regions: ["West Shores"],
    issuedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a-1004",
    title: "Harbor Dredging Operations",
    description:
      "Partial channel closure between markers 12–16. Reduced clearance and floating debris possible. Proceed at no-wake speed.",
    severity: "low",
    type: "navigation",
    regions: ["Harbor Channel A"],
    issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a-1005",
    title: "Heat Advisory - Inland Valleys",
    description:
      "Daytime highs up to 41°C (106°F). Hydrate and avoid strenuous activity during peak heat hours.",
    severity: "medium",
    type: "weather",
    regions: ["Inland Valleys"],
    issuedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a-1006",
    title: "Drifting Container Reported",
    description:
      "Large container reported adrift near 36.8N, 122.3W. All vessels maintain lookout and report sightings.",
    severity: "high",
    type: "navigation",
    regions: ["Shipping Lane B"],
    issuedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
]

function formatTimeRel(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ${diff > 0 ? "ago" : "from now"}`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ${diff > 0 ? "ago" : "from now"}`
  const days = Math.round(hrs / 24)
  return `${days}d ${diff > 0 ? "ago" : "from now"}`
}

function AlertIcon({ type }: { type: AlertType }) {
  switch (type) {
    case "tsunami":
      return <Siren className="size-4" aria-hidden="true" />
    case "ocean":
      return <Radar className="size-4" aria-hidden="true" />
    case "navigation":
      return <MessageSquareWarning className="size-4" aria-hidden="true" />
    case "weather":
    default:
      return <CloudSnow className="size-4" aria-hidden="true" />
  }
}

export default function AdvisoriesAlerts({
  className,
  style,
  alerts: incomingAlerts,
  pageSize = 6,
  autoRefreshIntervalMs = 30_000,
  onRefresh,
}: AdvisoriesAlertsProps) {
  const [query, setQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all")
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all")
  const [regionFilter, setRegionFilter] = useState<string | "all">("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date())
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AlertItem[]>(incomingAlerts ?? defaultAlerts)

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(async () => {
      try {
        let updated = incomingAlerts
        if (onRefresh) {
          const res = await onRefresh()
          if (Array.isArray(res)) updated = res
        }
        if (updated) setData(updated)
        setLastUpdatedAt(new Date())
      } catch {
        // non-blocking
      }
    }, autoRefreshIntervalMs)
    return () => clearInterval(id)
  }, [autoRefresh, autoRefreshIntervalMs, onRefresh, incomingAlerts])

  // Regions list
  const allRegions = useMemo(() => {
    const set = new Set<string>()
    ;(data ?? []).forEach((a) => a.regions.forEach((r) => set.add(r)))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (data ?? []).filter((a) => {
      if (severityFilter !== "all" && a.severity !== severityFilter) return false
      if (typeFilter !== "all" && a.type !== typeFilter) return false
      if (regionFilter !== "all" && !a.regions.includes(regionFilter)) return false
      if (q) {
        const hay = `${a.title} ${a.description} ${a.regions.join(" ")}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    // Priority pinned, then severity order, then recency
    const weight: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return list.sort((a, b) => {
      if (a.priority && !b.priority) return -1
      if (!a.priority && b.priority) return 1
      const sv = weight[a.severity] - weight[b.severity]
      if (sv !== 0) return sv
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    })
  }, [data, severityFilter, typeFilter, regionFilter, query])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => setPage(1), [severityFilter, typeFilter, regionFilter, query, pageSize, data])
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleSubscribe() {
    toast.success("Notifications enabled", {
      description: "You will receive alerts for selected severities.",
    })
  }
  function handleMute(id: string) {
    toast("Alert muted", {
      description: `You won't receive notifications for this alert (${id}).`,
      action: { label: "Undo", onClick: () => toast.success("Mute undone") },
    })
  }
  function handleAcknowledge(id: string) {
    toast.success("Acknowledged", { description: `Marked alert ${id} as acknowledged.` })
  }

  function SectionHeader() {
    return (
      <div className="w-full max-w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
              Advisories & Alerts
            </h2>
            <p className="text-muted-foreground text-sm">
              Real-time oceanographic updates for safe navigation and coastal awareness.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={handleSubscribe} aria-label="Enable notifications">
              <BellRing className="size-4" aria-hidden="true" />
              Enable notifications
            </Button>
            <Button variant="ghost" className="gap-2" asChild>
              <a href="/archive/alerts" aria-label="Open alerts archive">
                <PanelTopOpen className="size-4" aria-hidden="true" />
                Archive
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="alert-search" className="sr-only">Search alerts</Label>
            <div className="relative">
              <Input
                id="alert-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search alerts, regions, or keywords"
                className="pl-9 bg-card"
                aria-label="Search alerts"
              />
              <CircleAlert className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>

          <div>
            <Label className="sr-only" htmlFor="severity-filter">Severity</Label>
            <Select onValueChange={(v: Severity | "all") => setSeverityFilter(v)} value={severityFilter}>
              <SelectTrigger id="severity-filter" className="bg-card">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <Label className="sr-only" htmlFor="type-filter">Type</Label>
              <Select onValueChange={(v: AlertType | "all") => setTypeFilter(v)} value={typeFilter}>
                <SelectTrigger id="type-filter" className="bg-card">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="ocean">Ocean</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="tsunami">Tsunami</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1">
              <Label className="sr-only" htmlFor="region-filter">Region</Label>
              <Select onValueChange={(v: string | "all") => setRegionFilter(v)} value={regionFilter}>
                <SelectTrigger id="region-filter" className="bg-card">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {allRegions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              aria-label="Toggle auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
          </div>
          <div className="text-xs text-muted-foreground">
            <span aria-live="polite">Updated {formatTimeRel(lastUpdatedAt.toISOString())}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Slack className="size-3.5" aria-hidden="true" />
            <span className="truncate">Oceanographic Observation Network</span>
          </div>
        </div>
      </div>
    )
  }

  const categories: { key: AlertType; label: string; icon: React.ReactNode }[] = [
    { key: "weather", label: typeMeta.weather.label, icon: typeMeta.weather.icon },
    { key: "ocean", label: typeMeta.ocean.label, icon: typeMeta.ocean.icon },
    { key: "navigation", label: typeMeta.navigation.label, icon: typeMeta.navigation.icon },
    { key: "tsunami", label: typeMeta.tsunami.label, icon: typeMeta.tsunami.icon },
  ]

  function AlertCard({ alert }: { alert: AlertItem }) {
    const meta = severityMeta[alert.severity]
    const isExpired = alert.expiresAt ? new Date(alert.expiresAt).getTime() < Date.now() : false

    return (
      <Card
        className={cn(
          "bg-card w-full max-w-full overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-ring",
          "border border-border",
          alert.emergency
            ? "relative ring-2 ring-destructive/60 shadow-lg animate-pulse [animation-duration:2.4s]"
            : "hover:shadow-md"
        )}
        role="article"
        aria-labelledby={`alert-${alert.id}-title`}
      >
        <CardHeader className="space-y-2">
          <div className={cn("flex items-center gap-2 w-full")}>
            <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium", meta.chip)}>
              {meta.icon}
              {meta.label}
            </span>
            <Badge variant="secondary" className="gap-1">
              <AlertIcon type={alert.type} />
              {typeMeta[alert.type].label}
            </Badge>
            {alert.priority && (
              <Badge className="bg-accent text-accent-foreground">Pinned</Badge>
            )}
            {isExpired && <Badge variant="outline">Expired</Badge>}
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Webhook className="size-3.5" aria-hidden="true" />
              Issued {formatTimeRel(alert.issuedAt)}
            </span>
          </div>

          <CardTitle id={`alert-${alert.id}-title`} className="text-base sm:text-lg break-words">
            {alert.title}
          </CardTitle>

          <p className={cn("text-sm leading-relaxed text-foreground/90 break-words")}>
            {alert.description}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {alert.regions.map((r) => (
              <Badge key={r} variant="outline" className="text-xs">
                {r}
              </Badge>
            ))}
          </div>

          <div className={cn("mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2")}>
            <div className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", meta.bg, meta.text, meta.ring)}>
              <CircleAlert className="size-4" aria-hidden="true" />
              <span className="text-xs">
                Severity: <strong className="font-semibold">{meta.label}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 text-foreground rounded-md px-2 py-1.5">
              <ClockAlert className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs">
                Expires {alert.expiresAt ? formatTimeRel(alert.expiresAt) : "—"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => toast("Details", { description: alert.title })}
              aria-label={`View details for ${alert.title}`}
            >
              <PanelTopOpen className="size-4" aria-hidden="true" />
              Details
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={() => handleAcknowledge(alert.id)}
              aria-label={`Acknowledge ${alert.title}`}
            >
              <BellPlus className="size-4" aria-hidden="true" />
              Acknowledge
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMute(alert.id)}
            aria-label={`Mute ${alert.title}`}
          >
            <BellMinus className="size-4" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <section className={cn("w-full max-w-full", className)} style={style} aria-label="Advisories and alerts">
      <div className="w-full max-w-full">
        <SectionHeader />

        <Tabs defaultValue="all" className="mt-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="all" className="gap-2">
              <Bell className="size-4" aria-hidden="true" /> All
            </TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.key} value={c.key} className="gap-2">
                {c.icon}
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {pageItems.length === 0 ? (
              <Card className="bg-card border-dashed">
                <CardContent className="py-10 text-center">
                  <div className="mx-auto mb-3 h-10 w-10 grid place-items-center rounded-full bg-accent text-accent-foreground">
                    <BellRing className="size-5" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">No alerts match your filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pageItems.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {pageItems.length} of {filtered.length} alerts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          {categories.map((c) => {
            const items = filtered.filter((a) => a.type === c.key).slice(0, pageSize)
            return (
              <TabsContent key={c.key} value={c.key} className="mt-4">
                {items.length === 0 ? (
                  <Card className="bg-card border-dashed">
                    <CardContent className="py-10 text-center">
                      <div className="mx-auto mb-3 h-10 w-10 grid place-items-center rounded-full bg-accent text-accent-foreground">
                        <Bell className="size-5" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-muted-foreground">No {typeMeta[c.key].label.toLowerCase()} right now.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}