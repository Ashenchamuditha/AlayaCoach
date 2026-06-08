import { useState } from "react";
import { Camera, Image as ImageIcon, Plus, Utensils } from "lucide-react";
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
import { toast } from "sonner";
import { api } from "@/lib/api";

const schema = z.object({
  foodName: z.string().trim().min(2, "Food name is required"),
  portion: z.string().trim().optional(),
});

type FoodInput = z.infer<typeof schema>;

interface Props {
  onAdd: (entry: unknown) => void;
}

export function AddFoodDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<FoodInput>({
    foodName: "",
    portion: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      // Compress image before setting it
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], f.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                setFile(compressedFile);
                setPreview(canvas.toDataURL("image/jpeg", 0.7));
              }
            },
            "image/jpeg",
            0.7,
          );
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(f);
    }
  };

  const reset = () => {
    setForm({
      foodName: "",
      portion: "",
    });
    setFile(null);
    setPreview(null);
    setErrors({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Format: YYYY-MM-DDTHH:mm:ss
    const entryTime = new Date().toISOString().split(".")[0];

    setSubmitting(true);
    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entryTime", entryTime);
        if (form.foodName) formData.append("foodName", form.foodName);
        if (form.portion) formData.append("portion", form.portion);
        response = await api.post("/food/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.info("AI is scanning your meal... This may take a few seconds.");
      } else {
        const parsed = schema.safeParse(form);
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          parsed.error.issues.forEach((i) => {
            fieldErrors[i.path[0] as string] = i.message;
          });
          setErrors(fieldErrors);
          setSubmitting(false);
          return;
        }
        response = await api.post("/food", { ...parsed.data, entryTime });
      }

      onAdd(response.data);
      toast.success(file ? "AI is analyzing your photo..." : "Food entry logged");
      reset();
      setOpen(false);
    } catch {
      toast.error("Failed to log food entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Camera className="mr-1 h-4 w-4" />
          Log Food
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log your meal</DialogTitle>
          <DialogDescription>
            Snap a photo or tell us what you ate. Our AI does the rest.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 transition-colors hover:border-primary/50">
            {preview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  <Plus className="rotate-45 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-all shadow-sm">
                    <Camera className="h-8 w-8" />
                    <span className="text-[10px] font-bold mt-1 uppercase">Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </label>
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-all shadow-sm border border-border">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[10px] font-bold mt-1 uppercase">Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Take a photo for instant AI analysis
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground italic">
                Or log manually
              </span>
            </div>
          </div>

          <div className="space-y-1.5 opacity-80 focus-within:opacity-100 transition-opacity">
            <Label htmlFor="foodName">Food Name</Label>
            <Input
              id="foodName"
              disabled={!!file}
              value={form.foodName}
              onChange={(e) => setForm({ ...form, foodName: e.target.value })}
              placeholder={file ? "AI will detect this" : "e.g. Chicken Salad"}
            />
            {errors.foodName && !file && (
              <p className="text-xs text-destructive">{errors.foodName}</p>
            )}
          </div>
          <div className="space-y-1.5 opacity-80 focus-within:opacity-100 transition-opacity">
            <Label htmlFor="portion">Portion (Optional)</Label>
            <Input
              id="portion"
              disabled={!!file}
              value={form.portion}
              onChange={(e) => setForm({ ...form, portion: e.target.value })}
              placeholder={file ? "AI will estimate portion" : "e.g. 1 bowl, 200g"}
            />
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
              className="bg-gradient-brand text-white hover:opacity-90 min-w-[120px]"
              disabled={submitting}
            >
              {submitting ? "Analyzing..." : file ? "Analyze Photo" : "Log Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
