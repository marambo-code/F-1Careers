import fs from 'fs'
import path from 'path'

// Loads a legal Markdown document from /legal and strips parts that are
// internal working notes (not for public display): the H1 title and
// "Last updated" line (the page renders its own header), and the
// "> **Status:**" / "> **Adopted positions:**" reviewer notes.
// The public-facing "> **The short version.**" callout is kept.
export function loadLegalMarkdown(file: string): string {
  const full = path.join(process.cwd(), 'legal', file)
  const raw = fs.readFileSync(full, 'utf8')

  const kept = raw
    .replace(/\r/g, '')
    .split('\n')
    .filter(line => {
      if (line.startsWith('# ')) return false
      if (/^\*\*Last updated/.test(line)) return false
      if (line.startsWith('> **Status:**')) return false
      if (line.startsWith('> **Adopted positions:**')) return false
      return true
    })
    .join('\n')

  return kept.trim()
}
