"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FeatureCollection, Feature, Point } from "geojson"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  Map as MapIcon,
  MapPin,
  MapPinMinus,
  ZoomOut,
  MapPinPlus,
  MapPinCheck,
  ZoomIn,
  Maximize2,
  CircleDot,
} from "lucide-react"

type InstrumentType = "buoy" | "tide_gauge" | "weather_station"
type InstrumentStatus = "active" | "maintenance" | "offline"

type InstrumentProperties = {
  id: string
  name: string
  type: InstrumentType
  status: InstrumentStatus
  lastReadingAt: string
  readings: Record<string, string | number | null>
}

type StationFeature = Feature<Point, InstrumentProperties>

export type InteractiveMapProps = {
  className?: string
  style?: React.CSSProperties
  // Optional pre-fetched data; if omitted, a small demo dataset is used.
  data?: FeatureCollection<Point, InstrumentProperties>
  // Default map center [lng, lat]
  defaultCenter?: [number, number]
  // Default zoom level
  defaultZoom?: number
  // Called when user clicks "View Details" inside popup
  onViewDetails?: (instrumentId: string) => void
}

type MapStyleKey = "ocean" | "terrain" | "satellite"

const STYLE_MAP: Record<MapStyleKey, string> = {
  // Publicly accessible demo styles; in production provide your own keys/styles
  ocean: "https://demotiles.maplibre.org/style.json",
  // Using the same fallback style for terrain/satellite to avoid key requirements.
  terrain: "https://demotiles.maplibre.org/style.json",
  satellite: "https://demotiles.maplibre.org/style.json",
}

// Color tokens aligned to globals.css
const TYPE_COLORS: Record<InstrumentType, string> = {
  buoy: "#06b6d4", // chart-3 teal
  tide_gauge: "#0ea5a5", // chart-2 teal
  weather_station: "#2dd4bf", // chart-1 teal
}

const STATUS_COLORS: Record<InstrumentStatus, string> = {
  active: "#22c55e",
  maintenance: "#f59e0b",
  offline: "#ef4444",
}

const STATUS_LABEL: Record<InstrumentStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  offline: "Offline",
}

const TYPE_LABEL: Record<InstrumentType, string> = {
  buoy: "Buoy",
  tide_gauge: "Tide Gauge",
  weather_station: "Weather Station",
}

// Demo dataset if none provided
const demoData: FeatureCollection<Point, InstrumentProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "STN-001",
        name: "Pacific Buoy A1",
        type: "buoy",
        status: "active",
        lastReadingAt: new Date().toISOString(),
        readings: { SST: 18.4, Salinity: 34.5, Wind: "6.2 m/s" },
      },
      geometry: { type: "Point", coordinates: [-122.6765, 45.5231] },
    },
    {
      type: "Feature",
      properties: {
        id: "STN-002",
        name: "Harbor Tide Gauge",
        type: "tide_gauge",
        status: "maintenance",
        lastReadingAt: new Date(Date.now() - 3600e3).toISOString(),
        readings: { Tide: "1.4 m", Surge: "0.2 m" },
      },
      geometry: { type: "Point", coordinates: [-123.262, 44.5646] },
    },
    {
      type: "Feature",
      properties: {
        id: "STN-003",
        name: "Cape Weather Station",
        type: "weather_station",
        status: "offline",
        lastReadingAt: new Date(Date.now() - 48 * 3600e3).toISOString(),
        readings: { Temp: "12°C", Humidity: "80%" },
      },
      geometry: { type: "Point", coordinates: [-124.1637, 43.3665] },
    },
  ],
}

export default function InteractiveMap({
  className,
  style,
  data,
  defaultCenter = [-122.9, 44.5],
  defaultZoom = 5,
  onViewDetails,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null) // maplibre.Map | null (typed lazily to avoid type deps)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>("ocean")
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Filters
  const [typeFilters, setTypeFilters] = useState<Record<InstrumentType, boolean>>({
    buoy: true,
    tide_gauge: true,
    weather_station: true,
  })
  const [statusFilters, setStatusFilters] = useState<Record<InstrumentStatus, boolean>>({
    active: true,
    maintenance: true,
    offline: true,
  })
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Prepare dataset
  const sourceData = useMemo<FeatureCollection<Point, InstrumentProperties>>(
    () => data || demoData,
    [data]
  )

  const filteredData = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() : null

    const features = sourceData.features.filter((f) => {
      const p = f.properties
      if (!p) return false
      if (!typeFilters[p.type]) return false
      if (!statusFilters[p.status]) return false
      if (from || to) {
        const t = new Date(p.lastReadingAt).getTime()
        if (from && t < from) return false
        if (to && t > to + 24 * 3600e3 - 1) return false
      }
      return true
    })
    return { type: "FeatureCollection", features } as FeatureCollection<
      Point,
      InstrumentProperties
    >
  }, [sourceData, typeFilters, statusFilters, dateFrom, dateTo])

  // Initialize map
  useEffect(() => {
    let isMounted = true
    async function init() {
      if (!containerRef.current) return
      setIsLoading(true)
      setMapError(null)
      try {
        const maplibregl = await import("maplibre-gl")
        if (!isMounted) return

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: STYLE_MAP[mapStyleKey],
          center: defaultCenter,
          zoom: defaultZoom,
          attributionControl: true,
        })
        mapRef.current = map

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

        map.on("load", () => {
          if (!isMounted) return
          // Add data source with clustering
          addOrUpdateSource(map, filteredData)
          addLayers(map)
          setIsLoading(false)
        })

        // Click handlers for showing popup
        map.on("click", "clusters", (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })
          const clusterId = features[0].properties.cluster_id
          const source = map.getSource("instruments") as any
          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return
            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom,
            })
          })
        })

        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = ""
        })

        map.on("click", "unclustered-point", (e: any) => {
          const feature = e.features[0] as StationFeature
          const coordinates = (feature.geometry as any).coordinates.slice()
          const props = feature.properties
          const html = renderPopupHTML(props)
          new maplibregl.Popup({ closeButton: true, closeOnClick: true })
            .setLngLat(coordinates)
            .setHTML(html)
            .addTo(map)
        })

        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = ""
        })
      } catch (err: any) {
        console.error(err)
        setMapError(
          "We couldn't load the map. Please check your connection or try again later."
        )
        setIsLoading(false)
      }
    }
    init()
    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCenter?.[0], defaultCenter?.[1], defaultZoom, mapStyleKey])

  // Update source when filters/data change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource("instruments")
    if (src) {
      ;(src as any).setData(filteredData)
    }
  }, [filteredData])

  // Helpers to add source and layers
  const addOrUpdateSource = (map: any, fc: FeatureCollection<Point, InstrumentProperties>) => {
    if (map.getSource("instruments")) {
      ;(map.getSource("instruments") as any).setData(fc)
      return
    }
    map.addSource("instruments", {
      type: "geojson",
      data: fc,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 40,
    })
  }

  const addLayers = (map: any) => {
    if (!map.getLayer("clusters")) {
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "instruments",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#99f6e4",
            10,
            "#5eead4",
            30,
            "#2dd4bf",
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      })
    }

    if (!map.getLayer("cluster-count")) {
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "instruments",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#0f1b2d",
        },
      })
    }

    if (!map.getLayer("unclustered-point")) {
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "instruments",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "type"],
            "buoy",
            TYPE_COLORS.buoy,
            "tide_gauge",
            TYPE_COLORS.tide_gauge,
            "weather_station",
            TYPE_COLORS.weather_station,
            "#0ea5a5",
          ],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "match",
            ["get", "status"],
            "active",
            STATUS_COLORS.active,
            "maintenance",
            STATUS_COLORS.maintenance,
            "offline",
            STATUS_COLORS.offline,
            "#0f766e",
          ],
        },
      })
    }
  }

  // Controls
  const handleLocate = useCallback(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      toast.error("Geolocation is not available in your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const map = mapRef.current
        if (map) {
          map.easeTo({ center: [longitude, latitude], zoom: 10 })
          toast.success("Centered on your location.")
        }
      },
      () => {
        toast.error("Unable to access your location.")
      },
      { enableHighAccuracy: true, maximumAge: 20_000, timeout: 10_000 }
    )
  }, [])

  const handleZoom = useCallback((delta: number) => {
    const map = mapRef.current
    if (!map) return
    const z = map.getZoom?.() ?? defaultZoom
    map.easeTo({ zoom: z + delta })
  }, [defaultZoom])

  const handleFullscreenToggle = useCallback(() => {
    const el = containerWrapperRef.current
    if (!el) return
    if (typeof document === "undefined") return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])
  const containerWrapperRef = useRef<HTMLDivElement | null>(null)

  // Update popup View Details clicks via event delegation
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target) return
      const btn = target.closest("[data-view-details]") as HTMLElement | null
      if (btn) {
        const id = btn.getAttribute("data-id") || ""
        if (onViewDetails) {
          onViewDetails(id)
        } else {
          // Fallback navigation
          window.location.href = `/stations/${encodeURIComponent(id)}`
        }
      }
    }
    document.addEventListener("click", onClick)
    return () => {
      document.removeEventListener("click", onClick)
    }
  }, [onViewDetails])

  // UI handlers for filters
  const toggleType = (key: InstrumentType) =>
    setTypeFilters((s) => ({ ...s, [key]: !s[key] }))
  const toggleStatus = (key: InstrumentStatus) =>
    setStatusFilters((s) => ({ ...s, [key]: !s[key] }))

  return (
    <section
      className={cn(
        "w-full max-w-full bg-card rounded-[var(--radius)] shadow-sm border border-border",
        "relative overflow-hidden",
        className
      )}
      style={style}
      aria-label="Interactive oceanographic instruments map"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">Observation Map</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Explore stations, filter by type, status, and date range.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Tabs
            value={mapStyleKey}
            onValueChange={(v) => setMapStyleKey(v as MapStyleKey)}
            aria-label="Map style switcher"
          >
            <TabsList className="bg-secondary">
              <TabsTrigger value="ocean" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapIcon className="h-4 w-4 mr-1" aria-hidden />
                Ocean
              </TabsTrigger>
              <TabsTrigger value="terrain" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapIcon className="h-4 w-4 mr-1" aria-hidden />
                Terrain
              </TabsTrigger>
              <TabsTrigger value="satellite" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapIcon className="h-4 w-4 mr-1" aria-hidden />
                Satellite
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div
        ref={containerWrapperRef}
        className={cn(
          "relative",
          "w-full max-w-full",
          "min-h-[420px] sm:min-h-[520px]"
        )}
      >
        {/* Map container */}
        <div
          ref={containerRef}
          className={cn(
            "w-full h-[420px] sm:h-[520px]",
            "bg-muted"
          )}
          aria-busy={isLoading}
          aria-live="polite"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-card/90 border border-border px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-primary animate-pulse" aria-hidden />
                <span className="text-sm">Loading map…</span>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="rounded-xl bg-destructive text-destructive-foreground px-4 py-3 shadow-sm">
              <p className="text-sm">{mapError}</p>
            </div>
          </div>
        )}

        {/* Filter panel */}
        <div
          className={cn(
            "absolute left-3 top-3 sm:left-4 sm:top-4",
            "w-[calc(100%-1.5rem-1.5rem)] max-w-[320px]",
            "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75",
            "border border-border rounded-lg shadow-sm",
            "p-3 sm:p-4"
          )}
          role="region"
          aria-label="Filters"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-primary flex-none" aria-hidden />
              <h3 className="text-sm font-semibold truncate">Filters</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredData.features.length} shown
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Instrument Types
              </p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(TYPE_LABEL) as InstrumentType[]).map((t) => (
                  <label key={t} className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={typeFilters[t]}
                      onCheckedChange={() => toggleType(t)}
                      aria-label={`Toggle ${TYPE_LABEL[t]}`}
                    />
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[t] }}
                        aria-hidden
                      />
                      {TYPE_LABEL[t]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(STATUS_LABEL) as InstrumentStatus[]).map((s) => (
                  <label key={s} className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={statusFilters[s]}
                      onCheckedChange={() => toggleStatus(s)}
                      aria-label={`Toggle ${STATUS_LABEL[s]}`}
                    />
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[s] }}
                        aria-hidden
                      />
                      {STATUS_LABEL[s]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right-side controls (style switcher for mobile + zoom + actions) */}
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex flex-col items-end gap-2">
          <div className="md:hidden">
            <Tabs
              value={mapStyleKey}
              onValueChange={(v) => setMapStyleKey(v as MapStyleKey)}
              aria-label="Map style switcher"
            >
              <TabsList className="bg-secondary">
                <TabsTrigger value="ocean" className="px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Oc
                </TabsTrigger>
                <TabsTrigger value="terrain" className="px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Te
                </TabsTrigger>
                <TabsTrigger value="satellite" className="px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sa
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div
            className={cn(
              "flex flex-col gap-2 p-2 rounded-lg border border-border",
              "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75",
              "shadow-sm"
            )}
            role="toolbar"
            aria-label="Map controls"
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={() => handleZoom(1)}
              aria-label="Zoom in"
            >
              <MapPinPlus className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={() => handleZoom(-1)}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={handleLocate}
              aria-label="Current location"
            >
              <CircleDot className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={handleFullscreenToggle}
              aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div
          className={cn(
            "absolute left-3 bottom-3 sm:left-4 sm:bottom-4",
            "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75",
            "border border-border rounded-lg shadow-sm",
            "px-3 py-2"
          )}
          role="note"
          aria-label="Map legend"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="font-semibold col-span-2 text-muted-foreground">Types</div>
            {(Object.keys(TYPE_LABEL) as InstrumentType[]).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[t] }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{TYPE_LABEL[t]}</span>
              </div>
            ))}
            <div className="font-semibold col-span-2 text-muted-foreground mt-2">Status</div>
            {(Object.keys(STATUS_LABEL) as InstrumentStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s] }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Popup renderer using Tailwind classes (applies from global stylesheet)
function renderPopupHTML(p: InstrumentProperties) {
  const rows = Object.entries(p.readings || {}).slice(0, 4)
  const readingsHTML =
    rows.length > 0
      ? rows
          .map(
            ([k, v]) => `
        <div class="flex items-center justify-between gap-4 text-xs">
          <span class="text-muted-foreground">${escapeHTML(k)}</span>
          <span class="font-medium">${escapeHTML(String(v ?? "—"))}</span>
        </div>
      `
          )
          .join("")
      : '<div class="text-xs text-muted-foreground">No recent readings</div>'

  const typeBadgeColor = TYPE_COLORS[p.type]
  const statusColor = STATUS_COLORS[p.status]
  const statusLabel = STATUS_LABEL[p.status]

  return `
    <div class="w-[280px] max-w-[80vw]">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-sm font-semibold leading-tight break-words">${escapeHTML(
            p.name
          )}</div>
          <div class="mt-1 flex items-center gap-2">
            <span class="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground" style="--tw-ring-color: var(--ring)">
              <span class="inline-block h-2 w-2 rounded-full" style="background:${typeBadgeColor}"></span>
              ${TYPE_LABEL[p.type]}
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border" style="border-color:${statusColor}; color:${statusColor}">
              <span class="inline-block h-2 w-2 rounded-full" style="background:${statusColor}"></span>
              ${statusLabel}
            </span>
          </div>
        </div>
        <div class="shrink-0 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"></path>
            <circle cx="12" cy="11" r="3"></circle>
          </svg>
        </div>
      </div>
      <div class="mt-3 space-y-1.5">
        ${readingsHTML}
      </div>
      <div class="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>ID: ${escapeHTML(p.id)}</span>
        <span>${new Date(p.lastReadingAt).toLocaleString()}</span>
      </div>
      <div class="mt-3">
        <a href="/stations/${encodeURIComponent(
          p.id
        )}" data-view-details data-id="${escapeHTML(
    p.id
  )}" class="inline-flex items-center justify-center w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] transition">
          View Details
        </a>
      </div>
    </div>
  `
}

function escapeHTML(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}