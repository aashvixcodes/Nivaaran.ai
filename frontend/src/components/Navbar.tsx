'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, TrendingUp, ScanEye, History, Cpu } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/insights', label: 'Insights', icon: TrendingUp },
    { href: '/predict', label: 'Predict', icon: ScanEye },
    { href: '/history', label: 'History', icon: History },
    { href: '/model', label: 'Model', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2 h-2 rounded-full bg-[#111111] group-hover:scale-125 transition-transform" />
          <span className="text-sm font-bold tracking-[0.12em] text-[#111111]">NIVAARAN.AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-[#111111] bg-bg-neutral'
                    : 'text-[#9CA3AF] hover:text-[#111111] hover:bg-bg-neutral'
                }`}
              >
                <Icon size={13} strokeWidth={1.5} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
