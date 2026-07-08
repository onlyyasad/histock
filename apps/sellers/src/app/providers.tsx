'use client'

import { Provider } from 'react-redux'
import { Toaster } from 'sonner'
import { store } from '@/core/store/store'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <TooltipProvider>
        {children}
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </Provider>
  )
}
