import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { useMemo } from "react";
import { getLanguageExtension } from "@/lib/file-language";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fileName: string;
  readOnly?: boolean;
  className?: string;
  onSave?: () => void;
}

const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--color-secondary)",
    color: "var(--color-foreground)",
  },
  ".cm-content": {
    caretColor: "var(--color-primary)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--color-secondary)",
    color: "var(--color-muted-foreground)",
    borderRight: "1px solid var(--color-border)",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--color-primary)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklch, var(--color-primary) 25%, transparent)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklch, var(--color-primary) 8%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklch, var(--color-primary) 8%, transparent)",
  },
});

export function CodeEditor({
  value,
  onChange,
  fileName,
  readOnly = false,
  className,
  onSave,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(() => {
    const items = [
      getLanguageExtension(fileName),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "12px",
        },
        ".cm-scroller": {
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          lineHeight: "1.6",
        },
      }),
    ];

    if (readOnly) {
      items.push(EditorView.editable.of(false));
    }

    if (onSave) {
      items.push(
        EditorView.domEventHandlers({
          keydown(event, view) {
            if ((event.metaKey || event.ctrlKey) && event.key === "s") {
              event.preventDefault();
              onSave();
              return true;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              view.contentDOM.blur();
              return true;
            }
            return false;
          },
        }),
      );
    }

    return items;
  }, [fileName, readOnly, onSave]);

  return (
    <div className={cn("min-h-0 flex-1 overflow-hidden", className)}>
      <CodeMirror
        value={value}
        height="60vh"
        theme={resolvedTheme === "dark" ? oneDark : lightTheme}
        extensions={extensions}
        onChange={onChange}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          autocompletion: false,
        }}
        className="h-full [&_.cm-editor]:h-full [&_.cm-editor]:outline-none"
      />
    </div>
  );
}
