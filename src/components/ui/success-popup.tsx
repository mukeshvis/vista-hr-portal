"use client"

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface SuccessPopupProps {
  isOpen: boolean
  message: string
  onClose: () => void
  duration?: number
}

export function SuccessPopup({
  isOpen,
  message,
  onClose,
  duration = 2000
}: SuccessPopupProps) {
  const [showTick, setShowTick] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Show tick animation after popup appears
      const tickTimer = setTimeout(() => {
        setShowTick(true)
      }, 200)

      // Auto close after duration
      const closeTimer = setTimeout(() => {
        console.log('Auto-closing success popup')
        onClose()
      }, duration)

      return () => {
        clearTimeout(tickTimer)
        clearTimeout(closeTimer)
        setShowTick(false)
      }
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const handleCloseClick = () => {
    console.log('✅ Success popup close button clicked!')
    onClose()
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-300" style={{ zIndex: 99999 }}>
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg max-w-sm w-full p-4 relative mx-4">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('✅ X button clicked!')
            handleCloseClick()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className="absolute top-2 right-2 text-green-400 hover:text-green-600 transition-colors p-1 rounded-full hover:bg-green-100"
          style={{ cursor: 'pointer', zIndex: 100000 }}
          type="button"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3 pr-6">
          {/* Animated Success Icon */}
          <div className="flex-shrink-0">
            <div className="relative w-8 h-8 mt-0.5">
              {/* Circle background */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-green-500 transition-all duration-500 ${
                  showTick ? 'scale-100 opacity-100' : 'scale-75 opacity-60'
                }`}
                style={{
                  backgroundColor: showTick ? '#22c55e' : 'transparent',
                }}
              />

              {/* Animated checkmark */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-all duration-700 ${
                    showTick ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    strokeDasharray: showTick ? '100' : '0',
                    strokeDashoffset: showTick ? '0' : '100',
                    transform: showTick ? 'scale(1)' : 'scale(0.5)',
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Success!
            </h3>
            <p className="text-sm text-green-700 leading-relaxed">
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
              console.log('✅ Close button clicked!')
              handleCloseClick()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
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