"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { APP_NAME } from "@/lib/constants"
import { AIPanel } from "@/modules/ai/components/AIPanel"

function BibleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="14" height="16" rx="1" />
      <line x1="10" y1="7" x2="10" y2="13" />
      <line x1="7" y1="10" x2="13" y2="10" />
    </svg>
  )
}

function DailyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="5" />
      <line x1="13" y1="13" x2="17" y2="17" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h6l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M11 3v4h4" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="7" y1="13" x2="12" y2="13" />
    </svg>
  )
}

function StudyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h7a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2V4z" />
      <path d="M18 4h-7a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7V4z" />
      <line x1="10" y1="8" x2="10" y2="12" />
    </svg>
  )
}

function MapsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="2" />
      <path d="M10 17c3-3 5-5.5 5-9a5 5 0 0 0-10 0c0 3.5 2 6 5 9z" />
    </svg>
  )
}

function TimelineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <polyline points="10,6 10,10 13,12" />
    </svg>
  )
}

function GraphIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="14" cy="8" r="1.5" />
      <circle cx="10" cy="14" r="1.5" />
      <line x1="6" y1="6" x2="14" y2="8" />
      <line x1="6" y1="6" x2="10" y2="14" />
      <line x1="14" y1="8" x2="10" y2="14" />
    </svg>
  )
}

function AudioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h3l4-4v12l-4-4H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <path d="M15 8a4 4 0 0 1 0 4" />
      <path d="M17 5a7 7 0 0 1 0 10" />
    </svg>
  )
}

function PrayerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17l-5-5a3.5 3.5 0 0 1 1-5.7 3.5 3.5 0 0 1 4 1L10 7.5l.5-.4a3.5 3.5 0 0 1 4 5L10 17z" />
    </svg>
  )
}

function PlansIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h6a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M9 2h2" />
      <path d="M8 9l2 2 3-3" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4" />
    </svg>
  )
}

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="14" height="16" rx="1" />
      <line x1="10" y1="6" x2="10" y2="14" />
      <line x1="6" y1="10" x2="14" y2="10" />
    </svg>
  )
}

interface NavItem {
  label: string
  href: string
  icon: () => React.ReactNode
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Read",
    items: [
      { label: "Bible", href: "/bible", icon: BibleIcon },
      { label: "Daily", href: "/daily", icon: DailyIcon },
    ],
  },
  {
    label: "Study",
    items: [
      { label: "Search", href: "/search", icon: SearchIcon },
      { label: "Notes", href: "/notes", icon: NotesIcon },
      { label: "Study", href: "/study", icon: StudyIcon },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "Maps", href: "/maps", icon: MapsIcon },
      { label: "Timeline", href: "/timeline", icon: TimelineIcon },
      { label: "Graph", href: "/graph", icon: GraphIcon },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Audio", href: "/audio", icon: AudioIcon },
      { label: "Prayer", href: "/prayer", icon: PrayerIcon },
      { label: "Plans", href: "/reading-plans", icon: PlansIcon },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Admin", href: "/admin", icon: AdminIcon },
    ],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <aside className="flex w-60 flex-col bg-sidebar text-sidebar-foreground" data-od-id="sidebar">
        <div className="flex items-center gap-3 px-4 pt-6 pb-5" data-od-id="sidebar-brand">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active text-white">
            <LogoIcon />
          </div>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3" data-od-id="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5" data-od-id={`nav-group-${group.label.toLowerCase()}`}>
              <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-od-id={`nav-item-${item.label.toLowerCase()}`}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
                        isActive
                          ? "bg-sidebar-active text-white font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                      }`}
                    >
                      <span className="flex-shrink-0">
                        <Icon />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4" data-od-id="sidebar-footer">
          <div className="text-[10px] text-sidebar-foreground/30">v1.0.0</div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
        <AIPanel />
      </main>
    </div>
  )
}
