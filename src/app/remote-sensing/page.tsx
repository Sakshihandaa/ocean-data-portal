import Header from "@/components/Header";

export default function RemoteSensingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header className="sticky top-0 z-40" />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Remote Sensing</h1>
        <p className="mt-2 text-muted-foreground">Explore satellite and radar products like SST, altimetry, ocean color, and HF radar.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: Replace with actual remote sensing catalog */}
          <div className="rounded-lg border border-border bg-card p-4">Sea Surface Temperature</div>
          <div className="rounded-lg border border-border bg-card p-4">Altimetry</div>
          <div className="rounded-lg border border-border bg-card p-4">Ocean Color</div>
          <div className="rounded-lg border border-border bg-card p-4">Scatterometry (Winds)</div>
          <div className="rounded-lg border border-border bg-card p-4">SAR</div>
          <div className="rounded-lg border border-border bg-card p-4">HF Radar</div>
        </div>
      </main>
    </div>
  );
}