import { useRef } from 'react'
import { gsap } from 'gsap'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const handleMouseDown = () => {
    if (buttonRef.current && !disabled) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out"
      })
    }
  }
  
  const handleMouseUp = () => {
    if (buttonRef.current && !disabled) {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "back.out(1.7)"
      })
    }
  }
  const baseClasses = [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' ')

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className].join(' ')

  return (
    <button
      ref={buttonRef}
      className={classes}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <title>Loading</title>
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
