"use client"

import React from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'success' | 'danger' | 'warning'
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  confirmButtonClass,
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-500" />
      case 'warning':
      default:
        return <AlertCircle className="w-12 h-12 text-amber-500" />
    }
  }

  const getDefaultButtonClass = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
      default:
        return 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ zIndex: 99998 }}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-200"
        style={{ zIndex: 99999 }}
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-2xl max-w-md w-full p-6 mx-4">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCancel()
              }}
              className="px-6 py-2.5 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors border border-gray-300"
              type="button"
            >
              {cancelText}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onConfirm()
              }}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm ${
                confirmButtonClass || getDefaultButtonClass()
              }`}
              type="button"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
