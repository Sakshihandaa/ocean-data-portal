import Header from "@/components/Header";
import AdvisoriesAlerts from "@/components/AdvisoriesAlerts";

export default function AlertsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header className="sticky top-0 z-40" />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="mt-2 text-muted-foreground">System alerts and critical notices.</p>
        <div className="mt-6">
          <AdvisoriesAlerts />
        </div>
      </main>
    </div>
  );
}