import type { ValidationError } from "./types"

export function validateJSON(raw: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  if (typeof raw !== "object" || raw === null) {
    errors.push({ field: "root", message: "Expected a JSON object or array" })
  }
  return errors
}

export function validateCSV(headers: string[], requiredColumns: string[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      errors.push({ field: col, message: `Missing required column: ${col}` })
    }
  }
  return errors
}

export function validateXML(xml: string): ValidationError[] {
  const errors: ValidationError[] = []
  if (!xml.trim().startsWith("<")) {
    errors.push({ field: "root", message: "Expected XML content" })
  }
  return errors
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
