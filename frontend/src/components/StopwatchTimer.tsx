import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function format(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
  return { h, m, s, cs };
}

export function StopwatchTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const baseRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const tick = () => {
      setElapsed(baseRef.current + (performance.now() - startRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      baseRef.current += performance.now() - startRef.current;
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
  };

  const t = format(elapsed);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Timer className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Focus stopwatch</h2>
      </div>
      <div className="flex items-center justify-center py-4">
        <div className="font-mono text-3xl xs:text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
          <span className="text-gradient-brand">
            {t.h}:{t.m}:{t.s}
          </span>
          <span className="ml-1 text-xl xs:text-2xl text-muted-foreground">.{t.cs}</span>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <Button
          onClick={() => setRunning((r) => !r)}
          className="bg-gradient-brand text-white hover:opacity-90"
        >
          {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </Card>
  );
}
