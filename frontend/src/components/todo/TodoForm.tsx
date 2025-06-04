import { useState } from "react";
import { Button, Input, Textarea, Modal } from "../ui";
import type { PostTodosBody, GetTodos200TodosItem } from "../../api/model";

export interface TodoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (todo: PostTodosBody) => void;
  initialData?: GetTodos200TodosItem;
  isLoading?: boolean;
}

export function TodoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: TodoFormProps) {
  const [formData, setFormData] = useState<PostTodosBody>({
    title: initialData?.title || "",
    description: initialData?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Todo" : "Create New Todo"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Title"
          placeholder="Enter todo title..."
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Enter description (optional)..."
          value={formData.description || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={4}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.title.trim() || isLoading}>
            {isLoading
              ? "Saving..."
              : initialData
              ? "Update Todo"
              : "Create Todo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
