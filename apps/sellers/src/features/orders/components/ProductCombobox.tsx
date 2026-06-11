'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import type { ProductResponse } from '@histock/shared'
import { buttonVariants } from '@/components/ui/button'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, fmtMoney } from '@/lib/utils'

interface Props {
  products: ProductResponse[]
  value: string
  onSelect: (productId: string) => void
}

export function ProductCombobox({ products, value, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const selected = products.find((p) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full justify-between font-normal',
          !selected && 'text-muted-foreground',
        )}
        role="combobox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected ? selected.name : 'Select product…'}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or SKU…" />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.sku ?? ''}`}
                  onSelect={() => { onSelect(p.id); setOpen(false) }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="ml-2 font-mono tabular-nums text-xs">৳{fmtMoney(p.price)}</span>
                  <span className={cn('ml-2 text-xs', p.currentStock === 0 ? 'text-destructive' : 'text-muted-foreground')}>
                    {p.currentStock} left
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
