'use client'

import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onSelect, placeholder = 'Pick a date', className }: Props) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined
  const displayDate = selected && isValid(selected) ? format(selected, 'MMM d, yyyy') : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'justify-start text-left font-normal',
          !displayDate && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {displayDate ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onSelect(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
