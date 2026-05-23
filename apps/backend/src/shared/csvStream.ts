import type { Response } from 'express'
import { stringify } from 'csv-stringify'

export function streamCsv<T extends Record<string, unknown>>(
  res: Response,
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>,
  filename: string,
) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`)
  // BOM required for Excel to detect UTF-8 (Bangla names render correctly)
  res.write('﻿')

  const stringifier = stringify({
    header: true,
    columns: columns.map((c) => ({ key: c.key as string, header: c.header })),
  })

  stringifier.pipe(res)
  rows.forEach((row) => stringifier.write(row))
  stringifier.end()
}
