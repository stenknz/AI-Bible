import Link from "next/link"
import { APP_NAME } from "@/lib/constants"

const navItems = [
  { label: "Bible", href: "/bible" },
  { label: "Notes", href: "/notes" },
  { label: "Search", href: "/search" },
  { label: "Admin", href: "/admin" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="flex w-56 flex-col border-r px-4 py-6">
        <Link href="/bible" className="mb-8 text-lg font-semibold">{APP_NAME}</Link>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
