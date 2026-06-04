import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Prisma Decimal fields serialize to string in JSON. Always use this instead of .toFixed(2).
export function fmtMoney(amount: number | string | null | undefined): string {
  return Number(amount ?? 0).toFixed(2)
}
