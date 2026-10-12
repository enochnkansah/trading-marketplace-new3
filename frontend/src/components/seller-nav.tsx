"use client";

import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  Package,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function SellerNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/seller/dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      href: "/seller",
      label: "Products",
      icon: Package,
    },
    {
      href: "/seller/orders",
      label: "Orders",
      icon: ClipboardList,
    },
    {
      href: "/seller/sales",
      label: "Sales",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;

            const active =
              pathname === link.href ||
              (link.href !== "/seller" &&
                pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex shrink-0 items-center gap-2 px-5 py-4 text-sm font-semibold transition ${
                  active
                    ? "text-green-700"
                    : "text-slate-600 hover:text-green-700"
                }`}
              >
                <Icon className="h-4 w-4" />

                {link.label}

                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}