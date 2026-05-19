import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  targetValue?: number;
  targetUnit?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
}

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().min(1, "Category is required"),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  targetValue: z.coerce.number().optional(),
  targetUnit: z.string().optional(),
});

interface Props {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (g: Goal) => void;
}

export function EditGoalDialog({ goal, open, onOpenChange, onUpdate }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    dueDate: "",
    startTime: "",
    endTime: "",
    durationMinutes: 60,
    targetValue: 0,
    targetUnit: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (goal && open) {
      setForm({
        title: goal.title || "",
        description: goal.description || "",
        category: goal.category || "",
        priority: goal.priority ? goal.priority.toLowerCase() : "medium",
        dueDate: goal.dueDate ? goal.dueDate.slice(0, 10) : "",
        startTime: goal.startTime || "",
        endTime: goal.endTime || "",
        durationMinutes: goal.durationMinutes || 60,
        targetValue: goal.targetValue || 0,
        targetUnit: goal.targetUnit || "",
      });
    }
  }, [goal, open]);

  const calculateDuration = (start: string, end: string) => {
    try {
      if (!start || !end) return 60;
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      let diff = endTotal - startTotal;
      if (diff < 0) diff += 1440; // overnight
      return diff;
    } catch {
      return 60;
    }
  };

  const updateTime = (key: "startTime" | "endTime", val: string) => {
    const nextForm = { ...form, [key]: val };
    const dur = calculateDuration(nextForm.startTime, nextForm.endTime);
    setForm({ ...nextForm, durationMinutes: dur });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { data } = await api.put(`/goals/${goal.id}`, {
        ...parsed.data,
        endDate: parsed.data.dueDate,
      });
      onUpdate(data);
      toast.success("Goal updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>Update the details of this goal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={form.title}
              maxLength={100}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={form.description}
              maxLength={500}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Category *</Label>
              <Input
                id="edit-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Priority *</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-startTime">Start time</Label>
              <Input
                id="edit-startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => updateTime("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-endTime">End time</Label>
              <Input
                id="edit-endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => updateTime("endTime", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-dueDate">Due date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (calculated)</Label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                {form.durationMinutes} minutes
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-targetValue">Target Value</Label>
              <Input
                id="edit-targetValue"
                type="number"
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-targetUnit">Target Unit</Label>
              <Input
                id="edit-targetUnit"
                value={form.targetUnit}
                onChange={(e) => setForm({ ...form, targetUnit: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-brand text-white hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Update Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
