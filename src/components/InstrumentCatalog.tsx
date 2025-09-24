"use client";

import * as React from "react";
import {
  Satellite,
  ListFilter,
  Grid3x2,
  ListFilterPlus,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Grid2x2Check,
  SearchX,
  SearchSlash,
  ChevronsUpDown,
  Funnel,
  SquareMinus,
  CircleDot } from
"lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem } from
"@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetContent,
  SheetTrigger } from
"@/components/ui/sheet";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type InstrumentStatus = "active" | "maintenance" | "offline";

type Instrument = {
  id: string;
  name: string;
  type: string;
  category: string;
  tab: "in-situ" | "remote-sensing";
  location: string;
  status: InstrumentStatus;
  dateInstalled: string; // ISO Date string
  imageUrl: string;
  specs: string[];
};

type SortKey = "name" | "location" | "status" | "dateInstalled";
type ViewMode = "grid" | "list";

export interface InstrumentCatalogProps {
  className?: string;
  instruments?: Instrument[];
  isLoading?: boolean;
  initialView?: ViewMode;
  pageSize?: number;
  onSelectInstrument?: (instrument: Instrument) => void;
}

const DEFAULT_INSTRUMENTS: Instrument[] = [
{
  id: "ins-001",
  name: "Pacific Buoy A12",
  type: "Buoy",
  category: "Buoys",
  tab: "in-situ",
  location: "North Pacific, 35.6°N 150.1°W",
  status: "active",
  dateInstalled: "2023-03-21",
  imageUrl:
  "https://images.unsplash.com/photo-1574782090829-6bf2a0d1c5f2?q=80&w=1200&auto=format&fit=crop",
  specs: ["Wave Height", "SST", "Wind Speed"]
},
{
  id: "ins-002",
  name: "Harbor Tide Gauge T7",
  type: "Tide Gauge",
  category: "Tide Gauges",
  tab: "in-situ",
  location: "Seattle, WA",
  status: "maintenance",
  dateInstalled: "2021-06-12",
  imageUrl:
  "https://images.unsplash.com/photo-1520697222862-96ddf2e4f3f0?q=80&w=1200&auto=format&fit=crop",
  specs: ["Sea Level", "Barometric Pressure"]
},
{
  id: "ins-003",
  name: "Coastal Weather WS-9",
  type: "Weather Station",
  category: "Weather Stations",
  tab: "in-situ",
  location: "Outer Banks, NC",
  status: "active",
  dateInstalled: "2022-10-05",
  imageUrl:
  "https://images.unsplash.com/photo-1519680772-8b3a3b0363f0?q=80&w=1200&auto=format&fit=crop",
  specs: ["Temp", "Humidity", "Wind Dir."]
},
{
  id: "ins-004",
  name: "OceanSat-3A",
  type: "Satellite",
  category: "Satellites",
  tab: "remote-sensing",
  location: "Sun-synchronous Orbit",
  status: "active",
  dateInstalled: "2020-02-14",
  imageUrl:
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop",
  specs: ["Altimetry", "SST", "Ocean Color"]
},
{
  id: "ins-005",
  name: "SAR Constellation S2",
  type: "Satellite",
  category: "Satellites",
  tab: "remote-sensing",
  location: "Polar Orbit",
  status: "offline",
  dateInstalled: "2018-08-09",
  imageUrl:
  "https://images.unsplash.com/photo-1457364887197-9150188c107b?q=80&w=1200&auto=format&fit=crop",
  specs: ["SAR Imaging", "Surface Roughness"]
},
{
  id: "ins-006",
  name: "Deepwater Buoy D44",
  type: "Buoy",
  category: "Buoys",
  tab: "in-situ",
  location: "Gulf of Mexico, 26.5°N 91.1°W",
  status: "active",
  dateInstalled: "2024-01-18",
  imageUrl:
  "https://images.unsplash.com/photo-1502564683645-42a2ab48ec2b?q=80&w=1200&auto=format&fit=crop",
  specs: ["Current", "Salinity", "SST"]
},
{
  id: "ins-007",
  name: "Coastal Radar R11",
  type: "HF Radar",
  category: "Coastal Radars",
  tab: "remote-sensing",
  location: "Monterey Bay, CA",
  status: "maintenance",
  dateInstalled: "2019-11-29",
  imageUrl:
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  specs: ["Surface Currents", "Wave Period"]
}];


const IN_SITU_CATEGORIES = ["Buoys", "Tide Gauges", "Weather Stations", "Gliders", "Argo Floats"];
const REMOTE_CATEGORIES = ["Satellites", "Coastal Radars", "Altimeters", "Scatterometers"];

const STATUS_OPTIONS: {label: string;value: InstrumentStatus;tone: string;}[] = [
{ label: "Active", value: "active", tone: "bg-chart-1" },
{ label: "Maintenance", value: "maintenance", tone: "bg-chart-4" },
{ label: "Offline", value: "offline", tone: "bg-destructive" }];


function statusColor(status: InstrumentStatus) {
  switch (status) {
    case "active":
      return "text-chart-1";
    case "maintenance":
      return "text-chart-4";
    case "offline":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

function StatusDot({ status, className = "" }: {status: InstrumentStatus;className?: string;}) {
  return (
    <CircleDot
      aria-hidden="true"
      className={`h-3 w-3 ${statusColor(status)} ${className}`}
      strokeWidth={3} />);


}

export default function InstrumentCatalog({
  className,
  instruments = DEFAULT_INSTRUMENTS,
  isLoading = false,
  initialView = "grid",
  pageSize = 12,
  onSelectInstrument
}: InstrumentCatalogProps) {
  const [tab, setTab] = React.useState<"in-situ" | "remote-sensing">("in-situ");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<ViewMode>(initialView);
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = React.useState<Set<InstrumentStatus>>(new Set());
  const [locationFilter, setLocationFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const categories = tab === "in-situ" ? IN_SITU_CATEGORIES : REMOTE_CATEGORIES;

  React.useEffect(() => {
    // reset when tab changes
    setSelectedCategories(new Set());
    setPage(1);
  }, [tab]);

  const appliedChips = React.useMemo(() => {
    const chips: {type: "category" | "status" | "location" | "search";label: string;value: string;}[] = [];
    if (query.trim()) chips.push({ type: "search", label: `“${query.trim()}”`, value: query });
    if (locationFilter.trim())
    chips.push({ type: "location", label: locationFilter.trim(), value: locationFilter });
    selectedCategories.forEach((c) => chips.push({ type: "category", label: c, value: c }));
    selectedStatuses.forEach((s) =>
    chips.push({
      type: "status",
      label: STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
      value: s
    })
    );
    return chips;
  }, [query, locationFilter, selectedCategories, selectedStatuses]);

  const filtered = React.useMemo(() => {
    let list = instruments.filter((i) => i.tab === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
        i.name.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    if (selectedCategories.size) {
      list = list.filter((i) => selectedCategories.has(i.category));
    }
    if (selectedStatuses.size) {
      list = list.filter((i) => selectedStatuses.has(i.status));
    }
    if (locationFilter.trim()) {
      const lq = locationFilter.toLowerCase();
      list = list.filter((i) => i.location.toLowerCase().includes(lq));
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "dateInstalled") {
        cmp = new Date(a.dateInstalled).getTime() - new Date(b.dateInstalled).getTime();
      } else {
        // @ts-expect-error indexer
        const av = (a[sortKey] as string).toString().toLowerCase();
        // @ts-expect-error indexer
        const bv = (b[sortKey] as string).toString().toLowerCase();
        cmp = av.localeCompare(bv);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [
  instruments,
  tab,
  query,
  selectedCategories,
  selectedStatuses,
  locationFilter,
  sortKey,
  sortDir]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pageItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);else
      next.add(cat);
      setPage(1);
      return next;
    });
  }

  function toggleStatus(st: InstrumentStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(st)) next.delete(st);else
      next.add(st);
      setPage(1);
      return next;
    });
  }

  function clearAll() {
    setQuery("");
    setSelectedCategories(new Set());
    setSelectedStatuses(new Set());
    setLocationFilter("");
    setPage(1);
  }

  function removeChip(chip: {type: string;value: string;}) {
    if (chip.type === "search") setQuery("");else
    if (chip.type === "location") setLocationFilter("");else
    if (chip.type === "category") {
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        next.delete(chip.value);
        return next;
      });
    } else if (chip.type === "status") {
      setSelectedStatuses((prev) => {
        const next = new Set(prev);
        next.delete(chip.value as InstrumentStatus);
        return next;
      });
    }
  }

  const isEmpty = !isLoading && filtered.length === 0;

  return (
    <section
      className={`w-full max-w-full bg-card rounded-xl shadow-sm border border-border ${className ?? ""}`}
      aria-labelledby="instrument-catalog-heading">

      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="instrument-catalog-heading" className="text-xl sm:text-2xl font-semibold">
              Instrument Catalog
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "in-situ" | "remote-sensing")}
              className="min-w-[260px]">

              <TabsList className="bg-secondary">
                <TabsTrigger value="in-situ" className="data-[state=active]:bg-accent">
                  In Situ
                </TabsTrigger>
                <TabsTrigger value="remote-sensing" className="data-[state=active]:bg-accent">
                  Remote Sensing
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, type, or location"
                aria-label="Search instruments"
                className="pl-3 pr-10 bg-secondary focus-visible:ring-ring" />

              {query ?
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground">

                  <SearchX className="h-4 w-4" />
                </Button> :

              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-2.5 text-muted-foreground">

                  <SearchSlash className="h-4 w-4" />
                </div>
              }
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}>

                <SelectTrigger className="w-[180px] bg-secondary">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="dateInstalled">Date installed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                className="bg-card">

                {sortDir === "asc" ?
                <ArrowDownNarrowWide className="h-4 w-4 mr-2" /> :

                <ArrowUpNarrowWide className="h-4 w-4 mr-2" />
                }
                {sortDir === "asc" ? "Asc" : "Desc"}
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <div className="inline-flex rounded-md shadow-sm" role="group" aria-label="View mode">
                <Button
                  type="button"
                  variant={view === "grid" ? "default" : "outline"}
                  className={`rounded-r-none ${view === "grid" ? "" : "bg-card"}`}
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}>

                  <Grid3x2 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  type="button"
                  variant={view === "list" ? "default" : "outline"}
                  className={`rounded-l-none ${view === "list" ? "" : "bg-card"}`}
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}>

                  <ListFilterPlus className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>

            <div className="md:hidden ml-auto">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="bg-card">
                    <ListFilter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:max-w-sm p-0">
                  <SheetHeader className="p-4">
                    <SheetTitle className="flex items-center gap-2">
                      <Funnel className="h-4 w-4 text-primary" />
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <Separator />
                  <ScrollArea className="h-[calc(100vh-6rem)]">
                    <div className="p-4 space-y-6">
                      <FilterSections
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onToggleCategory={toggleCategory}
                        selectedStatuses={selectedStatuses}
                        onToggleStatus={toggleStatus}
                        locationFilter={locationFilter}
                        setLocationFilter={(v) => {
                          setLocationFilter(v);
                          setPage(1);
                        }} />

                    </div>
                  </ScrollArea>
                  <div className="p-4 flex items-center justify-between gap-2 border-t">
                    <Button variant="ghost" onClick={clearAll}>
                      Clear all
                    </Button>
                    <Button onClick={() => setMobileFiltersOpen(false)}>Apply</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Applied filter chips */}
          {appliedChips.length > 0 &&
          <div className="flex flex-wrap items-center gap-2">
              {appliedChips.map((chip) =>
            <Badge
              key={`${chip.type}-${chip.value}`}
              variant="secondary"
              className="gap-1 bg-accent text-accent-foreground">

                  {chip.label}
                  <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${chip.type} ${chip.value}`}
                onClick={() => removeChip(chip)}
                className="h-6 w-6 text-accent-foreground hover:text-foreground">

                    <SquareMinus className="h-3.5 w-3.5" />
                  </Button>
                </Badge>
            )}
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                Clear filters
              </Button>
            </div>
          }
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block">
            <Card className="bg-secondary border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ChevronsUpDown className="h-4 w-4 text-primary" />
                  Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <FilterSections
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onToggleCategory={toggleCategory}
                  selectedStatuses={selectedStatuses}
                  onToggleStatus={toggleStatus}
                  locationFilter={locationFilter}
                  setLocationFilter={(v) => {
                    setLocationFilter(v);
                    setPage(1);
                  }} />

              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={clearAll}>
                  Reset
                </Button>
                <Button
                  variant="outline"
                  className="bg-card"
                  onClick={() => toast("Filters applied")}>

                  Apply
                </Button>
              </CardFooter>
            </Card>
          </aside>

          {/* Results area */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 md:hidden">
              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}>

                <SelectTrigger className="w-full bg-secondary">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="dateInstalled">Date installed</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                  aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                  className="bg-card">

                  {sortDir === "asc" ?
                  <ArrowDownWideNarrow className="h-4 w-4" /> :

                  <ArrowUpNarrowWide className="h-4 w-4" />
                  }
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`bg-card ${view === "grid" ? "ring-1 ring-ring" : ""}`}
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}>

                  <Grid2x2Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`bg-card ${view === "list" ? "ring-1 ring-ring" : ""}`}
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}>

                  <ListFilterPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Skeletons */}
            {isLoading ?
            <ResultsSkeleton view={view} /> :
            isEmpty ?
            <EmptyState onReset={clearAll} /> :

            <>
                {view === "grid" ?
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pageItems.map((item) =>
                <InstrumentCard
                  key={item.id}
                  instrument={item}
                  onClick={() => {
                    if (onSelectInstrument) onSelectInstrument(item);else
                    toast(item.name, { description: "Open details" });
                  }} />

                )}
                  </div> :

              <div className="space-y-3">
                    {pageItems.map((item) =>
                <InstrumentRow
                  key={item.id}
                  instrument={item}
                  onClick={() => {
                    if (onSelectInstrument) onSelectInstrument(item);else
                    toast(item.name, { description: "Open details" });
                  }} />

                )}
                  </div>
              }

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}-
                    {Math.min(filtered.length, page * pageSize)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                    variant="outline"
                    className="bg-card"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}>

                      Prev
                    </Button>
                    <div className="px-3 py-1 rounded-md bg-secondary text-sm">
                      Page {page} / {totalPages}
                    </div>
                    <Button
                    variant="outline"
                    className="bg-card"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}>

                      Next
                    </Button>
                  </div>
                </div>
              </>
            }
          </div>
        </div>
      </div>
    </section>);

}

function FilterSections({
  categories,
  selectedCategories,
  onToggleCategory,
  selectedStatuses,
  onToggleStatus,
  locationFilter,
  setLocationFilter








}: {categories: string[];selectedCategories: Set<string>;onToggleCategory: (cat: string) => void;selectedStatuses: Set<InstrumentStatus>;onToggleStatus: (s: InstrumentStatus) => void;locationFilter: string;setLocationFilter: (v: string) => void;}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Categories</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((c) => {
            const checked = selectedCategories.has(c);
            return (
              <label
                key={c}
                className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer w-full min-w-0 overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent/60 ${
                checked ? "bg-accent/80 border-primary" : "bg-card border-border"}`
                }>

                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggleCategory(c)}
                  aria-label={c}
                  className="shrink-0" />

                <span className="text-sm flex-1 min-w-0 break-words whitespace-normal hyphens-auto leading-snug text-foreground !w-[47px] !h-[58px]">{c}</span>
              </label>);

          })}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Status</Label>
        <div className="flex flex-col gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const checked = selectedStatuses.has(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer w-full min-w-0 overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent/60 ${
                checked ? "bg-accent/80 border-primary" : "bg-card border-border"}`
                }>

                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggleStatus(opt.value)}
                  aria-label={opt.label}
                  className="shrink-0" />

                <span className="inline-flex flex-1 min-w-0 items-center gap-2 text-sm leading-snug text-foreground whitespace-normal break-words hyphens-auto">
                  <span className={`h-2.5 w-2.5 rounded-full ${opt.tone}`} />
                  {opt.label}
                </span>
              </label>);

          })}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="location-input" className="text-sm font-semibold">
          Location
        </Label>
        <Input
          id="location-input"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="e.g., Pacific, Seattle, 35°N"
          aria-label="Filter by location"
          className="bg-card" />

      </div>
    </div>);

}

function InstrumentCard({
  instrument,
  onClick



}: {instrument: Instrument;onClick?: () => void;}) {
  return (
    <Card
      className="group overflow-hidden border-border bg-card hover:shadow-md transition-shadow"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${instrument.name} details`}>

      {/* remove image cover — text-only card */}
      <CardHeader className="space-y-1">
        <CardTitle className="text-base leading-tight break-words">{instrument.name}</CardTitle>
        <div className="grid gap-0.5 text-sm">
          <div className="text-muted-foreground">
            <span className="text-foreground/80 font-medium">Type: </span>
            <span className="break-words">{instrument.type}</span>
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground/80 font-medium">Location: </span>
            <span className="break-words">{instrument.location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm">
            <StatusDot status={instrument.status} />
            <span className="capitalize">{instrument.status}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Installed {new Date(instrument.dateInstalled).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {instrument.specs.slice(0, 3).map((s) =>
          <Badge key={s} variant="secondary" className="bg-secondary">
              {s}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" className="bg-card">
          View details
        </Button>
      </CardFooter>
    </Card>);

}

function InstrumentRow({
  instrument,
  onClick



}: {instrument: Instrument;onClick?: () => void;}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="flex items-stretch gap-4 rounded-xl border bg-card border-border hover:shadow-sm transition-shadow"
      aria-label={`${instrument.name} details`}>

      {/* remove thumbnail — text-only row */}
      <div className="flex-1 min-w-0 px-3 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold leading-tight break-words">{instrument.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {instrument.category}
            </Badge>
            <div className="inline-flex items-center gap-1.5 text-sm">
              <StatusDot status={instrument.status} />
              <span className="capitalize text-muted-foreground">{instrument.status}</span>
            </div>
          </div>
        </div>
        <div className="mt-1 text-sm text-muted-foreground break-words">
          {instrument.type} • {instrument.location}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {instrument.specs.map((s) =>
          <Badge key={s} variant="secondary" className="bg-secondary">
              {s}
            </Badge>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Installed {new Date(instrument.dateInstalled).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" className="bg-card">
            View details
          </Button>
        </div>
      </div>
    </div>);

}

function ResultsSkeleton({ view }: {view: ViewMode;}) {
  if (view === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) =>
        <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        )}
      </div>);

  }
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) =>
      <div key={i} className="flex items-stretch gap-4 rounded-xl border border-border overflow-hidden">
          <div className="w-40 h-28 bg-muted animate-pulse" />
          <div className="flex-1 p-4 space-y-3">
            <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      )}
    </div>);

}

function EmptyState({ onReset }: {onReset: () => void;}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-border p-10 bg-secondary">
      <div className="rounded-full bg-accent/60 p-3">
        <SearchX className="h-6 w-6 text-accent-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No instruments match your filters</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Try adjusting your search or filters. You can also reset all filters to see every instrument.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Button onClick={onReset}>Reset filters</Button>
        <Button variant="outline" className="bg-card">
          <Funnel className="h-4 w-4 mr-2" />
          Adjust filters
        </Button>
      </div>
    </div>);

}