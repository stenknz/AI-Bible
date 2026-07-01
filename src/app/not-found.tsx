import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link href="/bible/1/1" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Go to Bible
        </Link>
      </div>
    </div>
  )
}
