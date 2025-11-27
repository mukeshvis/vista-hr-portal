"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { TopNavigation } from "@/components/top-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Rocket } from "lucide-react"

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <TopNavigation session={session} />
      </Suspense>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full">
                  <Rocket className="h-8 w-8 text-amber-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Coming Soon
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    We're working hard to bring you a comprehensive reports and analytics system.
                    This feature will be available soon.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 max-w-lg mx-auto">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-red-500" />
                    Upcoming Features
                  </h3>
                  <ul className="text-left text-gray-600 space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                      <span>Employee attendance and leave reports</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                      <span>Payroll and salary analytics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                      <span>Department-wise performance metrics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                      <span>Export reports to PDF and Excel</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-gray-500">
                  Stay tuned for updates!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
