import Header from "@/components/Header";

export default function InSituPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header className="sticky top-0 z-40" />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">In Situ Instruments</h1>
        <p className="mt-2 text-muted-foreground">Browse moorings, buoys, tide gauges, CTDs, gliders and more.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: Replace with actual in-situ catalog listing */}
          <div className="rounded-lg border border-border bg-card p-4">Moorings</div>
          <div className="rounded-lg border border-border bg-card p-4">Buoys</div>
          <div className="rounded-lg border border-border bg-card p-4">Tide Gauges</div>
          <div className="rounded-lg border border-border bg-card p-4">Gliders</div>
          <div className="rounded-lg border border-border bg-card p-4">ADCP</div>
          <div className="rounded-lg border border-border bg-card p-4">CTD</div>
        </div>
      </main>
    </div>
  );
}