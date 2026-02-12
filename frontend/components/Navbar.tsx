"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap, LayoutDashboard, Home, ChevronDown, BookOpen, Target, Layers, Shield } from "lucide-react";

type IconComponent = React.ComponentType<{ className?: string }>;
type NavItemLink = { href: string; label: string; icon: IconComponent };
type NavItemDropdown = { label: string; icon: IconComponent; children: NavItemLink[] };
type NavItem = NavItemLink | NavItemDropdown;

function isNavLink(item: NavItem): item is NavItemLink {
  return "href" in item && typeof (item as NavItemLink).href === "string";
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    label: "Demos",
    icon: Zap,
    children: [
      { href: "/demo/sniper", label: "Quantum Sniper", icon: Target },
      { href: "/demo/batch-exit", label: "Quantum Batching", icon: Layers },
      { href: "/demo/hedge-finder", label: "Quantum Hedge Finder", icon: Shield },
    ],
  },
  { href: "/documentation", label: "Documentation", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#3B82F6] text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setDemosOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-memequbit-dark/95 backdrop-blur transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/20">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white transition hover:opacity-90">
          <Target className="h-6 w-6 text-[#3B82F6] transition-transform hover:scale-110" />
          <span className="gradient-text animate-shimmer text-lg">MemeQubit</span>
          <span className="hidden text-slate-400 sm:inline">Quantum-AI Copilot for Pump.fun</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            if (isNavLink(item)) {
              const link = item as NavItemLink;
              const href: string = link.href ?? "/";
              return (
                <NavLink
                  key={href}
                  href={href}
                  label={link.label}
                  icon={link.icon}
                  active={pathname === href}
                />
              );
            }
            return (
              <div key={item.label} className="relative group">
                <button
                  onClick={() => setDemosOpen(!demosOpen)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pathname.startsWith("/demo")
                      ? "bg-[#3B82F6] text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition ${demosOpen ? "rotate-180" : ""}`} />
                </button>
                {demosOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDemosOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setDemosOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition ${
                            pathname === child.href
                              ? "bg-[#3B82F6] text-white"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-900/98 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink
              href="/"
              label="Home"
              icon={Home}
              active={pathname === "/"}
            />
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-2">
              <p className="mb-2 px-2 text-xs font-medium uppercase text-slate-500">Demos</p>
              {navItems.find((i) => i.label === "Demos")?.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    pathname === child.href
                      ? "bg-[#3B82F6] text-white"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <child.icon className="h-4 w-4" />
                  {child.label}
                </Link>
              ))}
            </div>
            <NavLink
              href="/documentation"
              label="Documentation"
              icon={BookOpen}
              active={pathname === "/documentation"}
            />
            <NavLink
              href="/dashboard"
              label="Dashboard"
              icon={LayoutDashboard}
              active={pathname === "/dashboard"}
            />
          </div>
        </div>
      )}
    </header>
  );
}
