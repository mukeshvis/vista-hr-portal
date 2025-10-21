"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Plus, Clock } from "lucide-react"
import { TopNavigation } from "@/components/top-navigation"
import { Sidebar } from "@/components/sidebar"
import { useSession } from "next-auth/react"
import { SuccessPopup } from "@/components/ui/success-popup"
import { ErrorPopup } from "@/components/ui/error-popup"

interface WorkingHoursPolicy {
  id: number
  working_hours_policy: string
}

// Force dynamic rendering to prevent prerender errors with useSearchParams
export const dynamic = 'force-dynamic'

export default function WorkingHoursPage() {
  const { data: session } = useSession()
  const [workingHours, setWorkingHours] = useState<WorkingHoursPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<WorkingHoursPolicy | null>(null)
  const [newPolicyName, setNewPolicyName] = useState("")
  const [editPolicyName, setEditPolicyName] = useState("")
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchWorkingHours()
  }, [])

  const fetchWorkingHours = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/working-hours')
      const result = await response.json()

      if (result.success) {
        setWorkingHours(result.data)
      }
    } catch (error) {
      console.error('Error fetching working hours:', error)
      setErrorMessage('Failed to load working hours policies')
      setShowErrorPopup(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newPolicyName.trim()) {
      setErrorMessage('Working hours policy name is required')
      setShowErrorPopup(true)
      return
    }

    try {
      const response = await fetch('/api/working-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ working_hours_policy: newPolicyName })
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('Working hours policy added successfully')
        setShowSuccessPopup(true)
        setNewPolicyName('')
        setIsAddDialogOpen(false)
        fetchWorkingHours()
      } else {
        setErrorMessage(result.error || 'Failed to add policy')
        setShowErrorPopup(true)
      }
    } catch (error) {
      setErrorMessage('Error adding working hours policy')
      setShowErrorPopup(true)
    }
  }

  const handleEdit = (policy: WorkingHoursPolicy) => {
    setEditingPolicy(policy)
    setEditPolicyName(policy.working_hours_policy)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editPolicyName.trim()) {
      setErrorMessage('Working hours policy name is required')
      setShowErrorPopup(true)
      return
    }

    try {
      const response = await fetch('/api/working-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPolicy?.id,
          working_hours_policy: editPolicyName
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('Working hours policy updated successfully')
        setShowSuccessPopup(true)
        setIsEditDialogOpen(false)
        setEditingPolicy(null)
        fetchWorkingHours()
      } else {
        setErrorMessage(result.error || 'Failed to update policy')
        setShowErrorPopup(true)
      }
    } catch (error) {
      setErrorMessage('Error updating working hours policy')
      setShowErrorPopup(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this working hours policy?')) {
      return
    }

    try {
      const response = await fetch(`/api/working-hours?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('Working hours policy deleted successfully')
        setShowSuccessPopup(true)
        fetchWorkingHours()
      } else {
        setErrorMessage(result.error || 'Failed to delete policy')
        setShowErrorPopup(true)
      }
    } catch (error) {
      setErrorMessage('Error deleting working hours policy')
      setShowErrorPopup(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <TopNavigation session={session} />
      </Suspense>

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8 ml-64">
          <Card className="border-2 border-gray-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Clock className="h-6 w-6" />
                  Working Hours Management
                </CardTitle>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Working Hours Policy</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workingHours.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          No working hours policies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      workingHours.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-medium">{policy.id}</TableCell>
                          <TableCell>{policy.working_hours_policy}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(policy)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(policy.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Working Hours Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="policy-name">Policy Name</Label>
              <Input
                id="policy-name"
                value={newPolicyName}
                onChange={(e) => setNewPolicyName(e.target.value)}
                placeholder="e.g., 8 Hours (9 AM - 6 PM)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700">
              Add Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Working Hours Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-policy-name">Policy Name</Label>
              <Input
                id="edit-policy-name"
                value={editPolicyName}
                onChange={(e) => setEditPolicyName(e.target.value)}
                placeholder="e.g., 8 Hours (9 AM - 6 PM)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-orange-600 hover:bg-orange-700">
              Update Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        message={successMessage}
      />

      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        message={errorMessage}
      />
    </div>
  )
}
