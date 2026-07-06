type RunCommandFn = (command: string) => boolean;

const runners = new Map<string, RunCommandFn>();

export function registerTerminalRunner(
  sessionId: string,
  run: RunCommandFn,
): () => void {
  runners.set(sessionId, run);
  return () => {
    if (runners.get(sessionId) === run) {
      runners.delete(sessionId);
    }
  };
}

export function runTerminalCommand(
  sessionId: string,
  command: string,
): boolean {
  return runners.get(sessionId)?.(command) ?? false;
}
