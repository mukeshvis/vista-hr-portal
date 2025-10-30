

"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({
  children
}: {
  children: React.ReactNode
}) {
  console.log('🎁 [PROVIDERS] SessionProvider initializing (client-side fetch mode)')

  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}