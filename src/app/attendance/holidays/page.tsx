"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TopNavigation } from "@/components/top-navigation"
import {
  Calendar,
  Plus,
  ArrowLeft,
  Trash2,
  CalendarDays,
  Edit,
  Search,
  X
} from "lucide-react"

interface Holiday {
  id?: number
  holiday_date: string
  holiday_name: string
  holiday_type: 'national' | 'company'
  description?: string
  is_recurring?: boolean
  status?: number
}

export default function HolidayManagementPage() {
  const { data: session } = useSession()

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [editingHoliday, setEditingHoliday] = useState<{index: number, holiday: Holiday} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load holidays from database
  const fetchHolidays = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/holidays')

      if (!response.ok) {
        throw new Error('Failed to fetch holidays')
      }

      const data = await response.json()
      if (data.success) {
        setHolidays(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch holidays')
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
      setError(error instanceof Error ? error.message : 'Failed to load holidays')
    } finally {
      setLoading(false)
    }
  }

  // Load holidays on component mount
  useEffect(() => {
    fetchHolidays()
  }, [])

  const addHoliday = async () => {
    const date = (document.getElementById('modalHolidayDate') as HTMLInputElement)?.value
    const name = (document.getElementById('modalHolidayName') as HTMLInputElement)?.value
    const type = (document.getElementById('modalHolidayType') as HTMLSelectElement)?.value as 'national' | 'company'
    const description = (document.getElementById('modalHolidayDescription') as HTMLInputElement)?.value

    if (date && name) {
      try {
        const response = await fetch('/api/holidays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            holiday_name: name,
            holiday_date: date,
            holiday_type: type,
            description: description || null,
            created_by: session?.user?.name || 'user'
          })
        })

        const data = await response.json()

        if (data.success) {
          // Refresh holidays list
          await fetchHolidays()

          // Clear inputs and close modal
          ;(document.getElementById('modalHolidayDate') as HTMLInputElement).value = ''
          ;(document.getElementById('modalHolidayName') as HTMLInputElement).value = ''
          ;(document.getElementById('modalHolidayDescription') as HTMLInputElement).value = ''
          setShowAddModal(false)
        } else {
          setError(data.error || 'Failed to create holiday')
        }
      } catch (error) {
        console.error('Error creating holiday:', error)
        setError('Failed to create holiday')
      }
    }
  }

  const removeHoliday = async (index: number) => {
    const holiday = holidays[index]
    if (!holiday.id) return

    try {
      const response = await fetch(`/api/holidays?id=${holiday.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh holidays list
        await fetchHolidays()
      } else {
        setError(data.error || 'Failed to delete holiday')
      }
    } catch (error) {
      console.error('Error deleting holiday:', error)
      setError('Failed to delete holiday')
    }
  }

  const editHoliday = (index: number) => {
    setEditingHoliday({ index, holiday: holidays[index] })
  }

  const updateHoliday = async () => {
    if (editingHoliday) {
      const date = (document.getElementById('editHolidayDate') as HTMLInputElement)?.value
      const name = (document.getElementById('editHolidayName') as HTMLInputElement)?.value
      const type = (document.getElementById('editHolidayType') as HTMLSelectElement)?.value as 'national' | 'company'
      const description = (document.getElementById('editHolidayDescription') as HTMLInputElement)?.value

      if (date && name && editingHoliday.holiday.id) {
        try {
          const response = await fetch('/api/holidays', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: editingHoliday.holiday.id,
              holiday_name: name,
              holiday_date: date,
              holiday_type: type,
              description: description || null
            })
          })

          const data = await response.json()

          if (data.success) {
            // Refresh holidays list
            await fetchHolidays()
            setEditingHoliday(null)
          } else {
            setError(data.error || 'Failed to update holiday')
          }
        } catch (error) {
          console.error('Error updating holiday:', error)
          setError('Failed to update holiday')
        }
      }
    }
  }

  const cancelEdit = () => {
    setEditingHoliday(null)
  }

  // Filter holidays based on search term
  const filteredHolidays = holidays.filter(holiday =>
    holiday.holiday_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holiday.holiday_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holiday.holiday_date.includes(searchTerm)
  )


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TopNavigation session={session} />

      {/* Enhanced Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.location.href = '/attendance'}
                className="flex items-center gap-1 bg-black hover:bg-gray-800 text-white border-2 border-black shadow-md text-xs px-2 py-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Attendance
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center shadow-sm">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-gray-800">
                  <h1 className="text-lg font-bold mb-0">Holiday Management</h1>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-4">

        {/* Search Bar and Add Holiday Button */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 px-3 py-1.5 text-xs shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-3 w-3" />
            Add Holiday
          </Button>
        </div>

        {/* Add Holiday Modal */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm mx-4 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1 text-base">
                    <Plus className="h-4 w-4 text-green-600" />
                    Add New Holiday
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    id="modalHolidayDate"
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Holiday Name</label>
                  <input
                    type="text"
                    id="modalHolidayName"
                    placeholder="Enter holiday name"
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    id="modalHolidayType"
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                  >
                    <option value="national">National Holiday</option>
                    <option value="company">Company Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    id="modalHolidayDescription"
                    placeholder="Enter holiday description"
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addHoliday}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
                  >
                    Add Holiday
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Holiday Modal */}
        {editingHoliday && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm mx-4 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1 text-base">
                    <Edit className="h-4 w-4 text-yellow-600" />
                    Edit Holiday
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    id="editHolidayDate"
                    defaultValue={editingHoliday.holiday.holiday_date}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Holiday Name</label>
                  <input
                    type="text"
                    id="editHolidayName"
                    defaultValue={editingHoliday.holiday.holiday_name}
                    placeholder="Enter holiday name"
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    id="editHolidayType"
                    defaultValue={editingHoliday.holiday.holiday_type}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-200 transition-all"
                  >
                    <option value="national">National Holiday</option>
                    <option value="company">Company Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    id="editHolidayDescription"
                    defaultValue={editingHoliday.holiday.description || ''}
                    placeholder="Enter holiday description"
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-200 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateHoliday}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 text-xs"
                  >
                    Update Holiday
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border border-red-300 shadow-md bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-red-700">
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
                <Button
                  onClick={() => setError(null)}
                  variant="ghost"
                  size="sm"
                  className="ml-auto p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Holidays Table */}
        <Card className="border border-gray-300 shadow-md bg-white">
          <CardContent className="p-3">
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm animate-pulse">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Loading holidays...</h3>
                <p className="text-sm text-gray-600">Please wait while we fetch the holiday data.</p>
              </div>
            ) : filteredHolidays.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-3 font-medium text-gray-800 bg-gray-50 text-sm">Holiday Name</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-800 bg-gray-50 text-sm">Holiday Type</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-800 bg-gray-50 text-sm">Date</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-800 bg-gray-50 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHolidays.map((holiday, index) => {
                      // Find the original index in the holidays array for proper editing/deleting
                      const originalIndex = holidays.findIndex(h => h.holiday_date === holiday.holiday_date && h.holiday_name === holiday.holiday_name)
                      // Simple date formatting
                      const [year, month, day] = holiday.holiday_date.split('-')
                      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']
                      const formattedDate = `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`

                      return (
                        <tr key={holiday.id || index} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-medium text-gray-900 text-sm">{holiday.holiday_name}</div>
                            {holiday.description && (
                              <div className="text-xs text-gray-500 mt-1">{holiday.description}</div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant={holiday.holiday_type === 'national' ? 'default' : 'secondary'}
                              className={`px-2 py-0.5 text-xs font-medium ${
                                holiday.holiday_type === 'national'
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {holiday.holiday_type === 'national' ? 'National' : 'Company'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-gray-700 text-sm">{formattedDate}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => editHoliday(originalIndex)}
                                className="flex items-center gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeHoliday(originalIndex)}
                                className="flex items-center gap-1 border-red-300 text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {searchTerm ? <Search className="h-6 w-6 text-gray-400" /> : <Calendar className="h-6 w-6 text-gray-400" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No holidays found' : 'No holidays configured'}
                </h3>
                <p className="text-sm text-gray-600">
                  {searchTerm ? 'Try searching with different keywords.' : 'Add your first holiday using the Add Holiday button.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  )
}