import { clsx, type ClassValue } from 'clsx'

/**
 * Tailwind CSS class name utility function
 * Combines clsx functionality for conditional classes
 * 
 * @param inputs - Class values to combine
 * @returns Combined class string
 * 
 * @example
 * cn('base-class', condition && 'conditional-class', {
 *   'active': isActive,
 *   'disabled': isDisabled
 * })
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}