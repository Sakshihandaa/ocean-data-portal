import Header from "@/components/Header";

export default function UpdatesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header className="sticky top-0 z-40" />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Updates</h1>
        <p className="mt-2 text-muted-foreground">Product updates, release notes, and maintenance schedules.</p>

        <div className="mt-6 space-y-4">
          <article className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Coming soon</h2>
            <p className="text-sm text-muted-foreground mt-1">We will list recent changes and announcements here.</p>
          </article>
        </div>
      </main>
    </div>
  );
}