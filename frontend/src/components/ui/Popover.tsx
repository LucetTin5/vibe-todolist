import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
})

function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, setOpen])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext)

  const handleClick = () => {
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: handleClick,
    })
  }

  return (
    <button ref={triggerRef as React.RefObject<HTMLButtonElement>} onClick={handleClick}>
      {children}
    </button>
  )
}

function PopoverContent({ children, className, align = 'center', side = 'bottom' }: PopoverContentProps) {
  const { open } = React.useContext(PopoverContext)

  if (!open) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2 top-0',
    right: 'left-full ml-2 top-0',
  }

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        'animate-in fade-in-0 zoom-in-95',
        sideClasses[side],
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent }