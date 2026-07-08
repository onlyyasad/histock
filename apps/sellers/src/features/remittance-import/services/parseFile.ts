import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedRow {
  [key: string]: string
}

export async function parseFile(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (result) => resolve({ headers: result.meta.fields ?? [], rows: result.data }),
        error: reject,
      })
    })
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { raw: false, defval: '' })
    const headers = json.length > 0 ? Object.keys(json[0]) : []
    return { headers, rows: json }
  }

  throw new Error(`Unsupported file type: .${ext}. Upload a .csv or .xlsx file.`)
}
