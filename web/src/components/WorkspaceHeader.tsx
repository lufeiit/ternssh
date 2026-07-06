import type { ReactNode } from "react";
import { HeaderSettingsMenu } from "@/components/HeaderSettingsMenu";
import { useSiteName } from "@/lib/site-name-context";

interface WorkspaceHeaderProps {
  actions?: ReactNode;
}

export function WorkspaceHeader({ actions }: WorkspaceHeaderProps) {
  const { siteName } = useSiteName();

  return (
    <header className="workspace-header">
      <div className="app-brand">
        <img src="/logo.png" alt="" className="app-brand-logo" />
        <span className="app-brand-name">{siteName}</span>
      </div>
      <div className="app-header-actions">
        {actions}
        <HeaderSettingsMenu />
      </div>
    </header>
  );
}
