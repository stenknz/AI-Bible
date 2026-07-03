import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Admin</h1>
        <nav className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Dashboard</Link>
          <Link href="/admin/bible-import" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Bible Import</Link>
          <Link href="/admin/translations" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Translations</Link>
          <Link href="/admin/features" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">Features</Link>
          <Link href="/admin/ai-config" className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white">AI Config</Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
