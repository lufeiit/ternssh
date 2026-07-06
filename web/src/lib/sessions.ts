export type SessionStatus = "connecting" | "open" | "closed" | "error";

export interface ServerSession {
  serverId: string;
  sessionId: string;
  wsUrl: string;
  sftpWsUrl: string;
  status: SessionStatus;
  reconnectAttempt?: number;
}

export const MAX_SESSION_RECONNECT_ATTEMPTS = 3;
export const SESSION_RECONNECT_DELAY_MS = 2000;

export function isSessionAlive(status: SessionStatus | undefined): boolean {
  return status === "connecting" || status === "open";
}

export function listSessions(
  sessions: Record<string, ServerSession>,
): ServerSession[] {
  return Object.values(sessions);
}

export function getSessionsForServer(
  sessions: Record<string, ServerSession>,
  serverId: string,
): ServerSession[] {
  return listSessions(sessions).filter((session) => session.serverId === serverId);
}

export function getPrimarySessionForServer(
  sessions: Record<string, ServerSession>,
  serverId: string,
  preferredSessionId?: string | null,
): ServerSession | undefined {
  const forServer = getSessionsForServer(sessions, serverId);
  if (preferredSessionId) {
    const preferred = forServer.find(
      (session) => session.sessionId === preferredSessionId,
    );
    if (preferred) return preferred;
  }
  return (
    forServer.find((session) => isSessionAlive(session.status)) ?? forServer[0]
  );
}

/** SFTP binds to the first alive session on a server, not the active terminal tab. */
export function getSftpSessionForServer(
  sessions: Record<string, ServerSession>,
  serverId: string,
): ServerSession | undefined {
  return getPrimarySessionForServer(sessions, serverId);
}

export function isServerConnected(
  sessions: Record<string, ServerSession>,
  serverId: string,
): boolean {
  return getSessionsForServer(sessions, serverId).some((session) =>
    isSessionAlive(session.status),
  );
}

export function getServerConnectionStatus(
  sessions: Record<string, ServerSession>,
  serverId: string,
): SessionStatus | undefined {
  const forServer = getSessionsForServer(sessions, serverId);
  if (forServer.length === 0) return undefined;
  if (forServer.some((session) => session.status === "open")) return "open";
  if (forServer.some((session) => session.status === "connecting")) {
    return "connecting";
  }
  if (forServer.some((session) => session.status === "error")) return "error";
  return forServer[0]?.status;
}
