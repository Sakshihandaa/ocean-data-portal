"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import InstrumentCatalog from "@/components/InstrumentCatalog";
import InteractiveMap from "@/components/InteractiveMap";
import AdvisoriesAlerts from "@/components/AdvisoriesAlerts";
import RealTimeData from "@/components/RealTimeData";
import InstrumentDetail from "@/components/InstrumentDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, Compass, ListTree } from "lucide-react";

type SelectedInstrument =
  | { id: string; name?: string; source: "map" | "catalog" }
  | null;

export default function Page() {
  const [selectedInstrument, setSelectedInstrument] =
    useState<SelectedInstrument>(null);

  const catalogRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);

  const stations = useMemo(
    () => [
      { id: "STN-001", name: "Pacific Buoy A1" },
      { id: "STN-002", name: "Harbor Tide Gauge" },
      { id: "STN-003", name: "Cape Weather Station" },
      { id: "STN-004", name: "Deepwater Buoy D44" },
      { id: "STN-005", name: "Coastal Radar R11" },
    ],
    []
  );

  const handleMapViewDetails = useCallback((instrumentId: string) => {
    setSelectedInstrument({
      id: instrumentId,
      name: `Station ${instrumentId}`,
      source: "map",
    });
    // Smoothly scroll to details
    requestAnimationFrame(() => {
      const el = document.getElementById("instrument-detail-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleCatalogSelect = useCallback((instrument: any) => {
    setSelectedInstrument({
      id: instrument?.id ?? "unknown",
      name: instrument?.name ?? "Instrument",
      source: "catalog",
    });
    requestAnimationFrame(() => {
      const el = document.getElementById("instrument-detail-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const scrollToCatalog = useCallback(() => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToMap = useCallback(() => {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header
        className="sticky top-0 z-40"
        onSearchSubmit={() => {
          // Focus the catalog on searches from header
          scrollToCatalog();
        }}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        {/* Quick jump actions */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={scrollToCatalog}
            aria-label="Jump to instrument catalog"
          >
            <ListTree className="h-4 w-4" aria-hidden="true" />
            Catalog
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={scrollToMap}
            aria-label="Jump to observation map"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Map
          </Button>
        </div>

        {/* Instruments Catalog */}
        <section
          ref={catalogRef as React.RefObject<HTMLElement>}
          id="catalog"
          className="scroll-mt-24"
        >
          <InstrumentCatalog onSelectInstrument={handleCatalogSelect} />
        </section>

        {/* Interactive Map + Real-time data */}
        <div
          ref={mapRef as React.RefObject<HTMLDivElement>}
          id="map"
          className="mt-8 scroll-mt-24"
        >
          <InteractiveMap onViewDetails={handleMapViewDetails} />
        </div>

        <div className="mt-6">
          <RealTimeData stations={stations} comparisonEnabled />
        </div>

        {/* Advisories & Alerts */}
        <div id="advisories-alerts" className="mt-8">
          <AdvisoriesAlerts />
        </div>

        {/* Instrument Detail Drawer-like section */}
        {selectedInstrument && (
          <section
            id="instrument-detail-section"
            className="mt-8 scroll-mt-24"
            aria-label="Instrument details"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing details from{" "}
                <span className="font-medium">
                  {selectedInstrument.source === "map" ? "Observation Map" : "Catalog"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInstrument(null)}
                className="gap-2"
                aria-label="Close instrument details"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Close
              </Button>
            </div>
            <Card className={cn("p-4 sm:p-6")}>
              <InstrumentDetail
                id={selectedInstrument.id}
                name={selectedInstrument.name ?? `Instrument ${selectedInstrument.id}`}
                defaultTab="overview"
              />
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}