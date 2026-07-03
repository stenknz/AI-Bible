import { BibleImportForm } from "@/modules/admin/components/BibleImportForm"

export default function BibleImportPage() {
  return (
    <div className="max-w-lg animate-fade-in">
      <h2 className="mb-6 text-lg font-medium text-foreground">Import Bible Translation</h2>
      <div className="rounded-xl bg-card p-6 shadow-sm">
        <BibleImportForm />
      </div>
    </div>
  )
}
