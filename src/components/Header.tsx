"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ChevronDown, Radar, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandSeparator,
  CommandInput,
} from "@/components/ui/command";

type HeaderProps = {
  className?: string;
  alertsCount?: number;
  recentSearches?: string[];
  suggestedCategories?: { label: string; href: string }[];
  onSearchSubmit?: (query: string) => void;
};

const NAV = [
  { label: "In Situ", href: "/in-situ" },
  { label: "Remote Sensing", href: "/remote-sensing" },
  { label: "Advisories", href: "/advisories" },
  { label: "Real-time Data", href: "/realtime" },
];

export default function Header({
  className,
  alertsCount = 3,
  recentSearches = ["wave height", "salinity 10m", "Sea surface temp", "tide forecast"],
  suggestedCategories = [
    { label: "Buoys", href: "/in-situ#buoys" },
    { label: "Gliders", href: "/in-situ#gliders" },
    { label: "Satellites", href: "/remote-sensing#satellite" },
    { label: "Radar", href: "/remote-sensing#radar" },
  ],
  onSearchSubmit,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [openSuggest, setOpenSuggest] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");

  const onSubmit = (q: string) => {
    const value = q.trim();
    if (!value) return;
    setOpenSuggest(false);
    if (onSearchSubmit) onSearchSubmit(value);
    else router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSuggest(false);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onEsc);
      return () => window.removeEventListener("keydown", onEsc);
    }
  }, []);

  // init theme from storage or system
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      const next = stored as "dark" | "light";
      setTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return;
    }
    // No stored preference: respect current document state (set by layout pre-hydration script)
    const hasDark = document.documentElement.classList.contains("dark");
    setTheme(hasDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
    }
  };

  return (
    <header
      className={cn(
        "w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border",
        className
      )}
      role="banner"
    >
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex md:hidden">
              <MobileNav
                nav={NAV}
                recentSearches={recentSearches}
                suggestedCategories={suggestedCategories}
                onSearchSubmit={onSubmit}
              />
            </div>

            <Link
              href="/"
              className="group relative flex items-center gap-2 rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Ocean Observation Network - Home"
            >
              <LogoMark />
              <div className="flex flex-col -space-y-0.5">
                <span className="text-base sm:text-lg font-semibold text-foreground leading-none">
                  Ocean Network
                </span>
                <span className="text-xs text-muted-foreground leading-none">
                  Observation & Insights
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Primary Nav (Desktop) */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Primary"
          >
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "text-foreground/80 hover:text-foreground hover:bg-accent",
                    active && "text-foreground"
                  )}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search, Alerts, User */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="hidden md:block min-w-0">
              <SearchBox
                value={query}
                onValueChange={setQuery}
                open={openSuggest}
                setOpen={setOpenSuggest}
                onSubmit={onSubmit}
                recent={recentSearches}
                suggestions={suggestedCategories}
              />
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden />
              ) : (
                <Moon className="h-5 w-5" aria-hidden />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label="View alerts and notifications"
              asChild
            >
              <Link href="/alerts" className="relative">
                <Radar className="h-5 w-5 text-foreground/80" aria-hidden />
                {alertsCount > 0 && (
                  <span
                    aria-label={`${alertsCount} alerts`}
                    className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow"
                  >
                    {alertsCount > 9 ? "9+" : alertsCount}
                  </span>
                )}
              </Link>
            </Button>

            <UserMenu />
          </div>
        </div>

        {/* Mobile Search under header */}
        <div className="md:hidden pb-3">
          <SearchBox
            value={query}
            onValueChange={setQuery}
            open={openSuggest}
            setOpen={setOpenSuggest}
            onSubmit={onSubmit}
            recent={recentSearches}
            suggestions={suggestedCategories}
            mobile
          />
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-accent ring-1 ring-border"
      aria-hidden
    >
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full"
          role="img"
          aria-label="Logo"
        >
          <defs>
            <linearGradient id="oceanGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="64" height="64" fill="url(#oceanGradient)" opacity="0.15" />
          <path
            d="M6 42c6 0 6-6 12-6s6 6 12 6 6-6 12-6 6 6 12 6"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M6 30c6 0 6-6 12-6s6 6 12 6 6-6 12-6 6 6 12 6"
            fill="none"
            stroke="var(--chart-3)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx="50" cy="16" r="4" fill="var(--chart-2)" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

type SearchBoxProps = {
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSubmit: (q: string) => void;
  recent: string[];
  suggestions: { label: string; href: string }[];
  mobile?: boolean;
};

function SearchBox({
  value,
  onValueChange,
  open,
  setOpen,
  onSubmit,
  recent,
  suggestions,
  mobile = false,
}: SearchBoxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (v: string) => {
    onValueChange(v);
    onSubmit(v);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "group relative flex items-center",
            mobile ? "w-full" : "w-[220px] lg:w-[320px]"
          )}
        >
          <Input
            ref={inputRef}
            type="search"
            inputMode="search"
            aria-label="Search ocean data"
            placeholder="Search ocean data..."
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit(value);
              }
            }}
            className={cn(
              "peer w-full rounded-full bg-secondary placeholder:text-muted-foreground/70",
              "border border-input focus-visible:ring-2 focus-visible:ring-ring",
              "transition-all duration-200",
              mobile
                ? "h-10"
                : "h-9 md:focus:w-[380px] lg:focus:w-[440px]"
            )}
          />
          <span className="pointer-events-none absolute right-3 text-muted-foreground/70 text-xs">
            ↵
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          "w-[min(92vw,560px)] p-0 overflow-hidden rounded-lg border border-border bg-popover",
          "shadow-lg"
        )}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Try “sea surface temperature”"
            value={value}
            onValueChange={onValueChange}
          />
          <CommandList className="max-h-72">
            {value.length > 0 ? (
              <>
                <CommandGroup heading="Results">
                  {/* In a real app, these would map from async data */}
                  <CommandItem
                    value={value}
                    onSelect={() => handleSelect(value)}
                  >
                    Search “{value}”
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            ) : null}
            <CommandGroup heading="Recent">
              {recent.length === 0 && (
                <CommandEmpty>No recent searches.</CommandEmpty>
              )}
              {recent.map((r) => (
                <CommandItem key={r} value={r} onSelect={() => handleSelect(r)}>
                  {r}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Suggested categories">
              {suggestions.map((s) => (
                <CommandItem
                  key={s.href}
                  value={s.label}
                  onSelect={() => {
                    onValueChange(s.label);
                    setOpen(false);
                    // Navigate to category
                    window.location.assign(s.href);
                  }}
                >
                  {s.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-full bg-secondary px-2 py-1.5",
            "border border-border transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="Open user menu"
        >
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold"
          >
            OC
          </span>
          <span className="hidden sm:inline text-sm font-medium text-foreground/90">
            Ocean Crew
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/70" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/alerts">Alerts</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            type="button"
            className="w-full text-left"
            onClick={() => {
              // Implement sign out in your app
            }}
          >
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type MobileNavProps = {
  nav: { label: string; href: string }[];
  recentSearches: string[];
  suggestedCategories: { label: string; href: string }[];
  onSearchSubmit: (q: string) => void;
};

function MobileNav({
  nav,
  recentSearches,
  suggestedCategories,
  onSearchSubmit,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="rounded-lg"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] sm:w-[420px] p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <LogoMark />
            <span className="text-base">Ocean Network</span>
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-4">
          <SearchBox
            value={""}
            onValueChange={() => {}}
            open={false}
            setOpen={() => {}}
            onSubmit={(q) => {
              onSearchSubmit(q);
              setOpen(false);
            }}
            recent={recentSearches}
            suggestions={suggestedCategories}
            mobile
          />

          <div className="space-y-1" role="navigation" aria-label="Mobile Primary">
            {nav.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block w-full rounded-md px-3 py-2 text-foreground/90 hover:bg-accent transition-colors",
                    "text-base font-medium"
                  )}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <div className="mt-2 rounded-lg border border-border bg-secondary">
            <div className="px-3 py-2 text-sm font-semibold text-foreground">
              Quick links
            </div>
            <div className="px-2 pb-2 grid grid-cols-2 gap-2">
              {suggestedCategories.slice(0, 4).map((s) => (
                <SheetClose asChild key={s.href}>
                  <Link
                    href={s.href}
                    className="rounded-md px-3 py-2 text-sm bg-card border border-border hover:bg-accent transition-colors"
                  >
                    {s.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}