import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopNavigation } from "@/components/top-navigation"
import { auth } from "@/lib/auth/auth"
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  UserCheck,
  UserX,
  CalendarDays,
  Banknote
} from "lucide-react"

// Enhanced Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  description,
  urgent = false
}: {
  title: string
  value: string | number
  icon: any
  trend?: string
  trendUp?: boolean
  description?: string
  urgent?: boolean
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
            </div>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`h-3 w-3 ${trendUp ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {trend}
                </span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { label: "Add Employee", icon: Users, color: "default" },
    { label: "Mark Attendance", icon: Clock, color: "default" },
    { label: "Process Payroll", icon: DollarSign, color: "default" },
    { label: "Approve Leaves", icon: Calendar, color: "destructive" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Today's Overview Component
function TodaysOverview() {
  const data = [
    { label: "On Time", value: 1089, icon: CheckCircle, color: "text-green-600" },
    { label: "Late Arrivals", value: 67, icon: AlertCircle, color: "text-yellow-600" },
    { label: "Absent", value: 91, icon: XCircle, color: "text-red-600" },
    { label: "On Leave", value: 23, icon: CalendarDays, color: "text-blue-600" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today's Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Activities Component
function RecentActivities() {
  const activities = [
    {
      action: "New employee onboarded",
      user: "Sarah Johnson",
      time: "2 hours ago",
      type: "success"
    },
    {
      action: "Leave request submitted",
      user: "Mike Chen",
      time: "4 hours ago",
      type: "pending"
    },
    {
      action: "Payroll processed",
      user: "System",
      time: "6 hours ago",
      type: "success"
    },
    {
      action: "Training session completed",
      user: "Alex Kumar",
      time: "1 day ago",
      type: "info"
    },
    {
      action: "Policy updated",
      user: "HR Team",
      time: "2 days ago",
      type: "info"
    }
  ]

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.type)}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.user}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Pending Items Component
function PendingItems() {
  const pendingItems = [
    { type: "Leave Requests", count: 12, priority: "high" },
    { type: "Document Reviews", count: 8, priority: "medium" },
    { type: "Performance Reviews", count: 15, priority: "medium" },
    { type: "Policy Approvals", count: 3, priority: "low" }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pending Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{item.type}</span>
                <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                  {item.priority}
                </Badge>
              </div>
              <span className="text-sm font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNavigation session={session} />

      {/* Dashboard Content */}
      <main className="container mx-auto px-6 py-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Employees"
              value="1,247"
              icon={Users}
              trend="+12% from last month"
              description="Active workforce"
            />
            <StatsCard
              title="Present Today"
              value="1,156"
              icon={UserCheck}
              trend="92.7% attendance"
              description="Out of 1,247 employees"
            />
            <StatsCard
              title="Pending Leaves"
              value={23}
              icon={Calendar}
              trend="5 urgent approvals"
              urgent={true}
              description="Requires immediate attention"
            />
            <StatsCard
              title="Payroll Status"
              value="₹4.2M"
              icon={Banknote}
              trend="Ready for processing"
              description="Due in 3 days"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Departments</p>
                  <p className="text-lg font-bold">12</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Absent</p>
                  <p className="text-lg font-bold">91</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Late Today</p>
                  <p className="text-lg font-bold">67</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">On Leave</p>
                  <p className="text-lg font-bold">23</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">On Time</p>
                  <p className="text-lg font-bold">1,089</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activities */}
            <div className="lg:col-span-2 space-y-6">
              <RecentActivities />
            </div>

            {/* Right Column - Quick Info */}
            <div className="space-y-6">
              <QuickActions />
              <TodaysOverview />
              <PendingItems />
            </div>
          </div>
      </main>
    </div>
  )
}