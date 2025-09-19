"use client"

import React, { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface ErrorPopupProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
  duration?: number
}

export function ErrorPopup({
  isOpen,
  title = "Validation Error",
  message,
  onClose,
  duration = 4000
}: ErrorPopupProps) {
  const [showIcon, setShowIcon] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('ErrorPopup isOpen changed to:', isOpen)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setShowIcon(false) // Reset icon state

      // Show loading then error icon
      const timer = setTimeout(() => {
        setShowIcon(true)
      }, 300)

      // Auto close after duration
      const closeTimer = setTimeout(() => {
        console.log('Auto-closing error popup')
        onClose()
        setShowIcon(false)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearTimeout(closeTimer)
      }
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const handleCloseClick = () => {
    console.log('🔴 Close button clicked!')
    console.log('🔴 Calling onClose function...')
    onClose()
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]">
      <div className="bg-red-600 rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 border border-red-500 animate-in fade-in zoom-in duration-300">
          {/* Error Animation Container */}
          <div className="flex flex-col items-center text-center">
            {/* Animated Error Icon */}
            <div className="relative mb-4">
              {!showIcon ? (
                // Loading Circle Animation
                <div className="w-12 h-12 border-4 border-red-300 border-t-red-100 rounded-full animate-spin"></div>
              ) : (
                // Error Icon Animation
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
            </div>

            {/* Error Message */}
            <h3 className="text-lg font-semibold text-white mb-2">
              {title}
            </h3>
            <p className="text-red-100 text-sm leading-relaxed mb-4">
              {message}
            </p>

            {/* Close Button */}
            <button
              onClick={handleCloseClick}
              onMouseDown={(e) => {
                console.log('🔴 Mouse down on close button')
                e.preventDefault()
              }}
              className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-all text-sm font-medium cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
              type="button"
            >
              <X className="w-4 h-4" />
              Close
            </button>
        </div>
      </div>
    </div>
  )
}