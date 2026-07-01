import { BibleImportForm } from "@/modules/admin/components/BibleImportForm"

export default function BibleImportPage() {
  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-lg font-medium">Import Bible Translation</h2>
      <BibleImportForm />
    </div>
  )
}
