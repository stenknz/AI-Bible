"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"

type Props = {
  initialContent?: any
  onSave?: (content: any) => void
  placeholder?: string
}

export function NoteEditor({ initialContent, onSave, placeholder = "Write your notes..." }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: { class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px]" },
    },
  })

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <EditorContent editor={editor} />
    </div>
  )
}
