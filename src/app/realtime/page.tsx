import Header from "@/components/Header";
import RealTimeData from "@/components/RealTimeData";

export default function RealtimePage() {
  const stations = [
    { id: "STN-001", name: "Pacific Buoy A1" },
    { id: "STN-002", name: "Harbor Tide Gauge" },
    { id: "STN-003", name: "Cape Weather Station" },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header className="sticky top-0 z-40" />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Real-time Data</h1>
        <p className="mt-2 text-muted-foreground">Live measurements from buoys, gauges, and stations.</p>
        <div className="mt-6">
          <RealTimeData stations={stations} comparisonEnabled />
        </div>
      </main>
    </div>
  );
}