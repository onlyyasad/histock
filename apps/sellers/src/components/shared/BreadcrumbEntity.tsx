'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface BreadcrumbEntityValue {
  entity: string | null
  setEntity: (v: string | null) => void
}

const Ctx = createContext<BreadcrumbEntityValue>({ entity: null, setEntity: () => {} })

export function BreadcrumbEntityProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState<string | null>(null)
  const value = useMemo(() => ({ entity, setEntity }), [entity])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBreadcrumbEntity() {
  return useContext(Ctx).entity
}

/** Detail pages call this with the entity title once loaded; clears on unmount. */
export function useSetBreadcrumbEntity(title: string | null | undefined) {
  const { setEntity } = useContext(Ctx)
  useEffect(() => {
    setEntity(title ?? null)
    return () => setEntity(null)
  }, [title, setEntity])
}
