"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Gauge, Hexagon, Menu } from "lucide-react";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { href: "/", label: "Strategy Recommender", index: "01", icon: Gauge },
    { href: "/knowledge", label: "Failure Knowledge", index: "02", icon: BookOpenText },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="ECUTestIQ home"><span className="brand-mark"><Hexagon /><i /></span><span><strong>ECUTest<span>IQ</span></strong><small>Intelligent validation research</small></span></Link>
        <nav className={menuOpen ? "open" : ""} aria-label="Primary navigation">
          {nav.map((item) => {
            const active = path === item.href;
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setMenuOpen(false)}><Icon /><span>{item.index}</span>{item.label}</Link>;
          })}
        </nav>
        <div className="header-meta"><span className="synthetic-badge">SYNTHETIC DATA</span><button aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button></div>
      </header>
      <div className="topline"><span /></div>
      <div className="site-body">{children}</div>
      <footer><p>Independent research prototype. All ECU designs, failure cases and performance values are synthetic and are not Magna proprietary data.</p><span>ECUTestIQ · Methodology demonstrator</span></footer>
    </div>
  );
}
