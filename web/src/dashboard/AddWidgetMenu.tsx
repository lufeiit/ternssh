import { LayoutGrid } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { ADDABLE_WIDGETS, widgetTitleKey } from "./widgets";

interface AddWidgetMenuProps {
  existingTypes: Set<string>;
  onAdd: (type: string) => void;
  disabled?: boolean;
}

export function AddWidgetMenu({
  existingTypes,
  onAdd,
  disabled = false,
}: AddWidgetMenuProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const availableCount = ADDABLE_WIDGETS.filter(
    (widget) => !existingTypes.has(widget.type),
  ).length;

  return (
    <div ref={rootRef} className="relative">
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled || availableCount === 0}
        onClick={() => setOpen((current) => !current)}
      >
        <LayoutGrid className="mr-1 h-3.5 w-3.5" />
        {t("header.addWidget")}
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[300] min-w-40 bg-[var(--color-card)] py-1 shadow-xl">
          {ADDABLE_WIDGETS.map((widget) => {
            const exists = existingTypes.has(widget.type);
            return (
              <button
                key={widget.type}
                type="button"
                disabled={exists}
                className={cn(
                  "flex w-full px-3 py-1.5 text-left text-sm transition-colors",
                  exists
                    ? "cursor-not-allowed text-[var(--color-muted-foreground)] opacity-50"
                    : "hover:bg-[var(--color-secondary)]",
                )}
                onClick={() => {
                  if (exists) return;
                  onAdd(widget.type);
                  setOpen(false);
                }}
              >
                {t(widgetTitleKey(widget.type))}
                {exists && (
                  <span className="ml-2 text-[11px] text-[var(--color-muted-foreground)]">
                    {t("common.added")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
