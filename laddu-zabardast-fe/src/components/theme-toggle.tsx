
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const choices = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Appearance" className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1">
      {choices.map(({ value, label, icon: Icon }) => (
        <button key={value} type="button" aria-pressed={(theme || "system") === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            (theme || "system") === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background/70",
          )}>
          <Icon className="h-4 w-4" aria-hidden="true" />{label}
        </button>
      ))}
    </div>
  );
}
