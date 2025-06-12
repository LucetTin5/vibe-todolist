import { useState, useEffect } from 'react'
import { Button, Input, Textarea, Modal, Select } from '../ui'
import { cn } from '../../utils/cn'
import type {
  PostApiTodosBody,
  GetApiTodos200TodosItem,
  PostApiTodosBodyPriority,
  PostApiTodosBodyCategory,
} from '../../api/model'

export interface TodoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (todo: PostApiTodosBody) => void
  initialData?: GetApiTodos200TodosItem
  isLoading?: boolean
}

export function TodoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: TodoFormProps) {
  const [formData, setFormData] = useState<PostApiTodosBody>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    category: initialData?.category || 'other',
    tags: initialData?.tags || [],
    dueDate: initialData?.dueDate || undefined,
    estimatedMinutes: initialData?.estimatedMinutes || undefined,
  })

  const [tagInput, setTagInput] = useState('')

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        category: initialData.category || 'other',
        tags: initialData.tags || [],
        dueDate: initialData.dueDate || undefined,
        estimatedMinutes: initialData.estimatedMinutes || undefined,
      })
      setTagInput('')
    } else if (isOpen && !initialData) {
      // 새로 생성하는 경우에만 초기화
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'other',
        tags: [],
        dueDate: undefined,
        estimatedMinutes: undefined,
      })
      setTagInput('')
    }
  }, [isOpen, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    // Clean up form data before submitting
    const submitData: PostApiTodosBody = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      tags: formData.tags?.filter((tag) => tag.trim()) || [],
    }

    onSubmit(submitData)
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags?.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }))
  }

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ''
    // Convert ISO string to datetime-local format
    return new Date(dateString).toISOString().slice(0, 16)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      dueDate: value ? new Date(value).toISOString() : undefined,
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Todo' : 'Create New Todo'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Title"
          placeholder="Enter todo title..."
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Enter description (optional)..."
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={4}
        />

        {/* Priority and Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Priority"
            value={formData.priority || 'medium'}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                priority: e.target.value as PostApiTodosBodyPriority,
              }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>

          <Select
            label="Category"
            value={formData.category || 'other'}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value as PostApiTodosBodyCategory,
              }))
            }
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="shopping">Shopping</option>
            <option value="health">Health</option>
            <option value="other">Other</option>
          </Select>
        </div>

        {/* Due Date and Estimated Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="due-date-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Due Date
            </label>
            <input
              id="due-date-input"
              type="datetime-local"
              value={formatDateForInput(formData.dueDate)}
              onChange={handleDateChange}
              className={cn(
                'w-full rounded-md border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 px-3 py-2 text-sm',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>

          <Input
            label="Estimated Time (minutes)"
            type="number"
            placeholder="e.g., 30"
            min="1"
            value={formData.estimatedMinutes || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                estimatedMinutes: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tag-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tags
          </label>

          {/* Add Tag Input */}
          <div className="flex gap-2 mb-3">
            <input
              id="tag-input"
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className={cn(
                'flex-1 rounded-md border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 px-3 py-2 text-sm',
                'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>

          {/* Tag List */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                    'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  )}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={cn(
                      'hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                    )}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.title.trim() || isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Todo' : 'Create Todo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
