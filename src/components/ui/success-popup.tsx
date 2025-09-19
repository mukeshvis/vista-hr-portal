"use client"

import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

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
  duration = 3000
}: SuccessPopupProps) {
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Show loading circle first, then checkmark after 1 second
      const timer = setTimeout(() => {
        setShowCheckmark(true)
      }, 1000)

      // Auto close after duration
      const closeTimer = setTimeout(() => {
        onClose()
        setShowCheckmark(false)
      }, duration)

      return () => {
        clearTimeout(timer)
        clearTimeout(closeTimer)
      }
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]">
      <div className="bg-black rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all duration-300 scale-100 animate-fadeInScale border border-gray-700">
        {/* Success Animation Container */}
        <div className="flex flex-col items-center text-center">
          {/* Animated Circle with Checkmark */}
          <div className="relative mb-6">
            {!showCheckmark ? (
              // Loading Circle Animation
              <div className="w-16 h-16 border-4 border-gray-600 border-t-green-500 rounded-full animate-spin"></div>
            ) : (
              // Success Checkmark Animation
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounceIn">
                <Check className="w-8 h-8 text-white animate-checkmark" />
              </div>
            )}
          </div>

          {/* Success Message */}
          <h3 className="text-xl font-semibold text-white mb-2">
            Success!
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {message}
          </p>

          {/* Success Indicator Dots */}
          <div className="flex space-x-1 mt-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: scale(0);
            stroke-dasharray: 0 24;
            stroke-dashoffset: 0;
          }
          50% {
            opacity: 1;
            transform: scale(1);
            stroke-dasharray: 12 24;
            stroke-dashoffset: -12;
          }
          100% {
            opacity: 1;
            transform: scale(1);
            stroke-dasharray: 24 24;
            stroke-dashoffset: -24;
          }
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.3s ease-out;
        }

        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }

        .animate-checkmark {
          animation: checkmark 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}