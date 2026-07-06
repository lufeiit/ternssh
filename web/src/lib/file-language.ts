import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { StreamLanguage } from "@codemirror/language";
import { shell as shellMode } from "@codemirror/legacy-modes/mode/shell";
import type { Extension } from "@codemirror/state";

export function getLanguageExtension(fileName: string): Extension {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
    case "js":
    case "mjs":
    case "cjs":
      return javascript();
    case "jsx":
      return javascript({ jsx: true });
    case "ts":
      return javascript({ typescript: true });
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "json":
    case "jsonc":
      return json();
    case "py":
    case "pyw":
      return python();
    case "html":
    case "htm":
      return html();
    case "css":
      return css();
    case "scss":
    case "sass":
    case "less":
      return css();
    case "md":
    case "markdown":
      return markdown();
    case "xml":
    case "svg":
      return xml();
    case "yaml":
    case "yml":
      return yaml();
    case "sh":
    case "bash":
    case "zsh":
    case "fish":
      return StreamLanguage.define(shellMode);
    case "sql":
      return sql();
    case "php":
      return php();
    case "rs":
      return rust();
    case "go":
      return go();
    case "java":
      return java();
    case "c":
    case "h":
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
      return cpp();
    default:
      return [];
  }
}
