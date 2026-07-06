import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { api, type Server, type TreeNode } from "@/lib/api";
import {
  formatBytes,
  formatDuration,
  formatLoad,
  type ServerStatusMetrics,
} from "@/lib/server-status";
import {
  getPrimarySessionForServer,
  isSessionAlive,
  type ServerSession,
} from "@/lib/sessions";
import { formatPollIntervalLabel } from "@/lib/status-widget-config";
import { cn } from "@/lib/utils";
import { MetricBar } from "@/widgets/shared/MetricBar";

export interface StatusWidgetProps {
  activeServerId: string | null;
  activeSessionId: string | null;
  sessions: Record<string, ServerSession>;
  tree: TreeNode[];
  pollIntervalMs: number;
}

function findServer(tree: TreeNode[], serverId: string): Server | null {
  for (const node of tree) {
    if (node.type === "server" && node.id === serverId) {
      return node;
    }
    if (node.type === "group") {
      const found = findServer(node.children, serverId);
      if (found) return found;
    }
  }
  return null;
}

export function StatusWidget({
  activeServerId,
  activeSessionId,
  sessions,
  tree,
  pollIntervalMs,
}: StatusWidgetProps) {
  const t = useT();
  const session = activeServerId
    ? getPrimarySessionForServer(sessions, activeServerId, activeSessionId)
    : null;
  const server = activeServerId ? findServer(tree, activeServerId) : null;
  const mountedRef = useRef(true);
  const [metrics, setMetrics] = useState<ServerStatusMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!session || session.status !== "open") {
      setMetrics(null);
      setError(null);
      setUpdatedAt(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getSessionStatus(session.sessionId);
      if (!mountedRef.current) return;

      setMetrics(response.metrics);
      setUpdatedAt(response.collectedAt);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : t("status.collectFailed"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [session?.sessionId, session?.status, t]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void fetchStatus();
    if (!session || session.status !== "open") return;

    const timer = window.setInterval(() => {
      void fetchStatus();
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [fetchStatus, pollIntervalMs, session?.sessionId, session?.status]);

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-[var(--color-muted-foreground)]">
        {t("status.selectServer")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {server?.name ?? t("common.unknownServer")}
          </div>
          <div className="truncate text-[11px] text-[var(--color-muted-foreground)]">
            {server ? `${server.username}@${server.host}:${server.port}` : "-"}
          </div>
          <div className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
            {t("status.sessionStatus", {
              label: t("session.label"),
              status: t(`session.${session.status}`),
            })}
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={loading || !isSessionAlive(session.status)}
          onClick={() => void fetchStatus()}
          title={t("common.refresh")}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {!isSessionAlive(session.status) && (
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-[var(--color-muted-foreground)]">
          {t("status.connectFirst")}
        </div>
      )}

      {isSessionAlive(session.status) && error && (
        <div className="alert-destructive px-3 py-2 text-xs">{error}</div>
      )}

      {isSessionAlive(session.status) && metrics && (
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-[var(--color-secondary)]/50 p-2">
              <div className="text-[var(--color-muted-foreground)]">
                {t("status.load1")}
              </div>
              <div className="mt-1 text-sm">{formatLoad(metrics.load1)}</div>
            </div>
            <div className="bg-[var(--color-secondary)]/50 p-2">
              <div className="text-[var(--color-muted-foreground)]">
                {t("status.load5")}
              </div>
              <div className="mt-1 text-sm">{formatLoad(metrics.load5)}</div>
            </div>
            <div className="bg-[var(--color-secondary)]/50 p-2">
              <div className="text-[var(--color-muted-foreground)]">
                {t("status.load15")}
              </div>
              <div className="mt-1 text-sm">{formatLoad(metrics.load15)}</div>
            </div>
          </div>

          <MetricBar
            label={t("status.cpu")}
            value={metrics.cpuUsedPercent}
            detail={
              metrics.cpuUsedPercent !== null
                ? `${metrics.cpuUsedPercent}%`
                : "-"
            }
          />

          <MetricBar
            label={t("status.memory")}
            value={metrics.memoryUsedPercent}
            detail={
              metrics.memoryTotal !== null
                ? metrics.memoryUsedPercent !== null
                  ? t("status.availablePercent", {
                      percent: metrics.memoryUsedPercent,
                      available: formatBytes(metrics.memoryAvailable),
                      total: formatBytes(metrics.memoryTotal),
                    })
                  : t("status.available", {
                      available: formatBytes(metrics.memoryAvailable),
                      total: formatBytes(metrics.memoryTotal),
                    })
                : "-"
            }
          />

          <MetricBar
            label={t("status.disk")}
            value={metrics.diskUsedPercent}
            detail={
              metrics.diskUsedPercent !== null
                ? t("status.availablePercent", {
                    percent: metrics.diskUsedPercent,
                    available: formatBytes(metrics.diskAvailable),
                    total: formatBytes(metrics.diskTotal),
                  })
                : "-"
            }
          />

          <div className="grid grid-cols-1 gap-2 text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--color-muted-foreground)]">
                {t("status.uptime")}
              </span>
              <span>{formatDuration(metrics.uptimeSeconds)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--color-muted-foreground)]">
                {t("status.system")}
              </span>
              <span className="truncate text-right">{metrics.osInfo ?? "-"}</span>
            </div>
          </div>
        </div>
      )}

      {isSessionAlive(session.status) && loading && !metrics && !error && (
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-[var(--color-muted-foreground)]">
          {t("status.collecting")}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-muted-foreground)]">
        {updatedAt
          ? t("status.updatedAt", {
              time: new Date(updatedAt).toLocaleTimeString(),
              interval: formatPollIntervalLabel(pollIntervalMs, t),
            })
          : t("status.waiting", {
              interval: formatPollIntervalLabel(pollIntervalMs, t),
            })}
      </div>
    </div>
  );
}
