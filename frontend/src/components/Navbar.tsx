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
    <div className="navbar-container">
      <header className="navbar" style={{ maxWidth: '1080px' }}>
        <Link href="/" className="brand">
          <span className="brand-dot"></span>
          <span>NIVAARAN.AI</span>
        </Link>
        <nav className="nav-links">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ padding: '6px 12px' }}
              >
                <Icon size={13} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
    </div>
  );
}
