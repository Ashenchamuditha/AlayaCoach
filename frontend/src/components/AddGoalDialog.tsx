import { useState } from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export interface NewGoalInput {
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  targetValue?: number;
  targetUnit?: string;
}

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().min(1, "Category is required"),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().min(1, "Due date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  durationMinutes: z.coerce.number().int().min(1, "Min 1 minute").max(1440),
  targetValue: z.coerce.number().optional(),
  targetUnit: z.string().optional(),
});

interface Props {
  onAdd: (g: NewGoalInput & { id: string }) => void;
}

export function AddGoalDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<NewGoalInput>({
    title: "",
    description: "",
    category: "Wellness",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    targetValue: 0,
    targetUnit: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      let diff = endTotal - startTotal;
      if (diff < 0) diff += 1440; // overnight
      return diff;
    } catch {
      return 0;
    }
  };

  const updateTime = (key: "startTime" | "endTime", val: string) => {
    const nextForm = { ...form, [key]: val };
    const dur = calculateDuration(nextForm.startTime, nextForm.endTime);
    setForm({ ...nextForm, durationMinutes: dur });
  };

  const reset = () =>
    setForm({
      title: "",
      description: "",
      category: "Wellness",
      priority: "medium",
      dueDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      startTime: "09:00",
      endTime: "10:00",
      durationMinutes: 60,
      targetValue: 0,
      targetUnit: "",
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { data } = await api.post("/goals", parsed.data);
      onAdd({ ...parsed.data, id: String(data.id) });
      toast.success("Goal added");
      reset();
      setOpen(false);
    } catch {
      toast.error("Failed to add goal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-brand text-white hover:opacity-90">
          <Plus className="mr-1 h-4 w-4" />
          Add goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add a new goal</DialogTitle>
          <DialogDescription>
            Define a clear, actionable goal you want to commit to today.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              maxLength={100}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Run 5 km"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              maxLength={500}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Why this matters and how you'll do it"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wellness">Wellness</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Learning">Learning</SelectItem>
                  <SelectItem value="Mindset">Mindset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority *</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as NewGoalInput["priority"] })
                }
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
              <Label htmlFor="startTime">Start time *</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => updateTime("startTime", e.target.value)}
              />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End time *</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => updateTime("endTime", e.target.value)}
              />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value, endDate: e.target.value })}
              />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
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
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
                placeholder="e.g. 100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetUnit">Target Unit</Label>
              <Input
                id="targetUnit"
                value={form.targetUnit}
                onChange={(e) => setForm({ ...form, targetUnit: e.target.value })}
                placeholder="e.g. kcal, km"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-brand text-white hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Add goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
