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
  defaultValues?: Partial<PostApiTodosBody>
  onDelete?: (id: string) => void
}

export function TodoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  defaultValues,
  onDelete,
}: TodoFormProps) {
  const [formData, setFormData] = useState<PostApiTodosBody>({
    title: initialData?.title || defaultValues?.title || '',
    description: initialData?.description || defaultValues?.description || '',
    priority: initialData?.priority || defaultValues?.priority || 'medium',
    category: initialData?.category || defaultValues?.category || 'other',
    tags: initialData?.tags || defaultValues?.tags || [],
    dueDate: initialData?.dueDate || defaultValues?.dueDate || undefined,
    estimatedMinutes: initialData?.estimatedMinutes || defaultValues?.estimatedMinutes || undefined,
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
      // 새로 생성하는 경우 - defaultValues 적용
      setFormData({
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        priority: defaultValues?.priority || 'medium',
        category: defaultValues?.category || 'other',
        tags: defaultValues?.tags || [],
        dueDate: defaultValues?.dueDate || undefined,
        estimatedMinutes: defaultValues?.estimatedMinutes || undefined,
      })
      setTagInput('')
    }
  }, [isOpen, initialData, defaultValues])

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
          id="title"
          label="Title"
          placeholder="Enter todo title..."
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
        />

        {/* Description */}
        <Textarea
          id="description"
          label="Description"
          placeholder="Add a description..."
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Select
              id="priority"
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
          </div>

          <div className="flex-1 min-w-0">
            <Select
              id="category"
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
        </div>

        {/* Due Date and Time */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Input
              id="dueDate"
              label="Due Date"
              type="date"
              value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  // 기존 시간이 있으면 유지, 없으면 현재 시간 사용
                  const existingTime = formData.dueDate
                    ? formData.dueDate.split('T')[1]
                    : '09:00:00.000Z'
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: `${value}T${existingTime}`,
                  }))
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: undefined,
                  }))
                }
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <Input
              id="time"
              label="Time"
              type="time"
              value={formData.dueDate ? formData.dueDate.split('T')[1]?.substring(0, 5) || '' : ''}
              onChange={(e) => {
                const timeValue = e.target.value
                if (timeValue) {
                  // 날짜가 없으면 오늘 날짜 사용
                  const dateStr = formData.dueDate
                    ? formData.dueDate.split('T')[0]
                    : new Date().toISOString().split('T')[0]
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: `${dateStr}T${timeValue}:00.000Z`,
                  }))
                }
              }}
            />
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
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
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
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
              className="w-full sm:w-auto"
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
                    className={cn('hover:text-blue-600 dark:hover:text-blue-400 transition-colors')}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {/* 삭제 버튼 (수정 모드에서만 표시) */}
            {initialData && onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (window.confirm('이 할 일을 삭제하시겠습니까?')) {
                    onDelete(initialData.id)
                    onClose()
                  }
                }}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Todo' : 'Create Todo'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
