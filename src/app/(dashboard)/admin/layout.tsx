import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4 border-b pb-4">
        <h1 className="text-xl font-semibold">Admin</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link href="/admin/bible-import" className="text-muted-foreground hover:text-foreground">Bible Import</Link>
          <Link href="/admin/translations" className="text-muted-foreground hover:text-foreground">Translations</Link>
          <Link href="/admin/features" className="text-muted-foreground hover:text-foreground">Features</Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
