"use client"

import React, { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface ErrorPopupProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
  duration?: number
}

export function ErrorPopup({
  isOpen,
  title = "Error",
  message,
  onClose,
  duration = 2000
}: ErrorPopupProps) {

  useEffect(() => {
    if (isOpen) {
      // Auto close after duration
      const closeTimer = setTimeout(() => {
        console.log('Auto-closing error popup')
        onClose()
      }, duration)

      return () => {
        clearTimeout(closeTimer)
      }
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const handleCloseClick = () => {
    console.log('🔴 Error popup close button clicked!')
    onClose()
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-300" style={{ zIndex: 99999 }}>
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-sm w-full p-4 relative mx-4">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('🔴 X button clicked!')
            handleCloseClick()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100"
          style={{ cursor: 'pointer', zIndex: 100000 }}
          type="button"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3 pr-6">
          {/* Error Icon */}
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          </div>

          {/* Message Content */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              {title}
            </h3>
            <p className="text-sm text-red-700 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🔴 Close button clicked!')
              handleCloseClick()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm"
            style={{ cursor: 'pointer' }}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}