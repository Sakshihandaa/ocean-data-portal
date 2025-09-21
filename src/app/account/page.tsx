import Header from "@/components/Header";

export default function AccountPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header className="sticky top-0 z-40" />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-2 text-muted-foreground">Manage your profile information.</p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Basic Info</h2>
            <p className="text-sm text-muted-foreground mt-1">Name, email, organization (coming soon).</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">Units, timezone, and display settings (coming soon).</p>
          </div>
        </div>
      </main>
    </div>
  );
}