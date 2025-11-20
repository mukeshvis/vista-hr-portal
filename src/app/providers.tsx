
"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import type { Session } from "next-auth"

export function Providers({
  children,
  session
}: {
  children: React.ReactNode
  session: Session | null
}) {
  console.log('🎁 [PROVIDERS] SessionProvider initializing with server session:', session ? `User: ${session.user?.username}` : 'No session')

  // Create QueryClient instance inside the component to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests once
        retry: 1,
        // Don't refetch on window focus by default (can be overridden per query)
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        session={session}
        basePath="/api/auth"
        refetchInterval={5 * 60}
        refetchOnWindowFocus={true}
      >
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}