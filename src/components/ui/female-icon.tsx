import React from 'react'

interface FemaleIconProps {
  className?: string
  size?: number
}

export function FemaleIcon({ className = "", size = 32 }: FemaleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#EC4899"/>
      <path
        d="M16 8C18.7614 8 21 10.2386 21 13C21 15.7614 18.7614 18 16 18C13.2386 18 11 15.7614 11 13C11 10.2386 13.2386 8 16 8Z"
        fill="white"
      />
      <path
        d="M8 26C8 22.6863 10.6863 20 14 20H18C21.3137 20 24 22.6863 24 26V28H8V26Z"
        fill="white"
      />
    </svg>
  )
}