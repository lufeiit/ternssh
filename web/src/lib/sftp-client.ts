export interface SftpEntry {
  name: string;
  type: "dir" | "file" | "link";
  size: number;
  sizeFormatted: string;
  permissions: string;
  permissionsRaw: number;
  modifiedTime: number;
  isDir: boolean;
  isLink: boolean;
}

export type SftpClientStatus =
  | "idle"
  | "connecting"
  | "initializing"
  | "ready"
  | "error"
  | "closed";

export const MAX_SFTP_FILE_SIZE = 500 * 1024 * 1024;
export const MAX_SFTP_TEXT_EDIT_SIZE = 2 * 1024 * 1024;
const UPLOAD_CHUNK_SIZE = 32 * 1024;

export interface SftpUploadProgress {
  loaded: number;
  total: number;
}

export type SftpDownloadProgress = SftpUploadProgress;

interface Waiter {
  match: (message: Record<string, unknown>) => boolean;
  resolve: (message: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timer: number;
}

function wsUrl(path: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

export class SftpClient {
  private ws: WebSocket | null = null;
  private waiters: Waiter[] = [];
  private closed = false;
  private intentionalClose = false;
  private sftpReady = false;
  private uploadProgressHandler: ((progress: SftpUploadProgress) => void) | null =
    null;
  private downloadProgressHandler:
    | ((progress: SftpDownloadProgress) => void)
    | null = null;
  private uploadChain: Promise<void> = Promise.resolve();
  private downloadChain: Promise<void> = Promise.resolve();
  private downloadActive = false;
  private downloadChunks: Uint8Array[] = [];
  private downloadWaiter: {
    resolve: () => void;
    reject: (error: Error) => void;
    filename: string;
  } | null = null;

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(path: string): Promise<void> {
    this.disconnect();
    this.closed = false;
    this.intentionalClose = false;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl(path));
      ws.binaryType = "arraybuffer";
      this.ws = ws;

      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("SFTP WebSocket 连接失败"));
      ws.onclose = () => {
        this.closed = true;
        this.sftpReady = false;
        if (!this.intentionalClose) {
          this.rejectAll(new Error("SFTP 连接已关闭"));
        } else {
          this.clearWaiters();
        }
        this.ws = null;
      };
      ws.onmessage = (event) => {
        void this.handleMessage(event.data);
      };
    });

    await this.waitFor(
      (message) => message.type === "sftp_socket_ready",
      30_000,
      "等待 SFTP 通道超时",
    );

    await this.initializeSftp();
  }

  private async initializeSftp(): Promise<void> {
    this.send({ type: "sftp_init" });

    for (let attempt = 0; attempt < 20; attempt++) {
      const message = await this.waitFor(
        (item) => item.type === "sftp_ready" || item.type === "sftp_error",
        10_000,
        "SFTP 初始化超时",
      );

      if (message.type === "sftp_ready") {
        this.sftpReady = true;
        return;
      }

      const reason = String(message.message ?? "SFTP 初始化失败");
      if (reason.includes("未就绪") && attempt < 19) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        this.send({ type: "sftp_init" });
        continue;
      }

      throw new Error(reason);
    }
  }

  private async ensureSftpReady(): Promise<void> {
    if (this.sftpReady) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("SFTP 未连接");
    }
    await this.initializeSftp();
  }

  private isChannelResetError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
      error.message.includes("SFTP 通道已关闭") ||
      error.message.includes("SFTP 未初始化") ||
      error.message.includes("SFTP 未就绪")
    );
  }

  private async withSftpRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.isChannelResetError(error)) {
        throw error;
      }
      this.sftpReady = false;
      await this.ensureSftpReady();
      return operation();
    }
  }

  async list(path: string): Promise<{ path: string; entries: SftpEntry[] }> {
    return this.withSftpRetry(async () => {
      await this.ensureSftpReady();
      this.send({ type: "sftp_list", path });
      const message = await this.waitFor(
        (item) => item.type === "sftp_list_result" || item.type === "sftp_error",
        20_000,
        "列出目录超时",
      );

      if (message.type === "sftp_error") {
        throw new Error(String(message.message ?? "列出目录失败"));
      }

      return {
        path: String(message.path ?? path),
        entries: (message.entries as SftpEntry[] | undefined) ?? [],
      };
    });
  }

  async mkdir(path: string): Promise<void> {
    return this.withSftpRetry(async () => {
      await this.ensureSftpReady();
      this.send({ type: "sftp_mkdir", path });
      const message = await this.waitFor(
        (item) =>
          item.type === "sftp_mkdir_result" ||
          item.type === "sftp_error",
        15_000,
        "创建目录超时",
      );

      if (message.type === "sftp_error") {
        throw new Error(String(message.message ?? "创建目录失败"));
      }
    });
  }

  async deletePath(path: string): Promise<void> {
    return this.withSftpRetry(async () => {
      await this.ensureSftpReady();
      this.send({ type: "sftp_delete", path });
      const message = await this.waitFor(
        (item) =>
          item.type === "sftp_delete_result" ||
          item.type === "sftp_error",
        15_000,
        "删除超时",
      );

      if (message.type === "sftp_error") {
        throw new Error(String(message.message ?? "删除失败"));
      }
    });
  }

  async upload(
    remotePath: string,
    file: File,
    onProgress?: (progress: SftpUploadProgress) => void,
  ): Promise<void> {
    if (file.size > MAX_SFTP_FILE_SIZE) {
      throw new Error(
        `文件过大 (${formatFileSize(file.size)})，最大支持 ${formatFileSize(MAX_SFTP_FILE_SIZE)}`,
      );
    }

    const run = () =>
      this.withSftpRetry(() => this.uploadFile(remotePath, file, onProgress));
    const result = this.uploadChain.then(run);
    this.uploadChain = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  cancelUpload(): void {
    try {
      this.send({ type: "sftp_upload_cancel" });
    } catch {
      // ignore
    }
    this.uploadProgressHandler = null;
  }

  async download(
    remotePath: string,
    onProgress?: (progress: SftpDownloadProgress) => void,
  ): Promise<void> {
    const run = () =>
      this.withSftpRetry(async () => {
        const { bytes, filename } = await this.fetchFileBytes(
          remotePath,
          onProgress,
        );
        triggerBrowserDownload(new Blob([bytes]), filename);
        onProgress?.({ loaded: bytes.byteLength, total: bytes.byteLength });
      });
    const result = this.downloadChain.then(run);
    this.downloadChain = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  async readFileContent(
    remotePath: string,
    options?: {
      maxSize?: number;
      onProgress?: (progress: SftpDownloadProgress) => void;
    },
  ): Promise<Uint8Array> {
    const run = () =>
      this.withSftpRetry(async () => {
        const { bytes } = await this.fetchFileBytes(
          remotePath,
          options?.onProgress,
          options?.maxSize,
        );
        return bytes;
      });
    const result = this.downloadChain.then(run);
    this.downloadChain = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  async writeFileContent(
    remotePath: string,
    content: string,
    onProgress?: (progress: SftpUploadProgress) => void,
  ): Promise<void> {
    const bytes = encodeFileContent(content);
    const file = new File([bytes], remotePath.split("/").pop() || "file", {
      type: "text/plain",
    });
    return this.upload(remotePath, file, onProgress);
  }

  cancelDownload(): void {
    try {
      this.send({ type: "sftp_download_cancel" });
    } catch {
      // ignore
    }
    this.downloadProgressHandler = null;
    if (this.downloadWaiter) {
      this.downloadWaiter.reject(new Error("下载已取消"));
      this.downloadWaiter = null;
    }
    this.downloadActive = false;
    this.downloadChunks = [];
  }

  private async fetchFileBytes(
    remotePath: string,
    onProgress?: (progress: SftpDownloadProgress) => void,
    maxSize?: number,
  ): Promise<{ bytes: Uint8Array; filename: string }> {
    await this.ensureSftpReady();
    this.downloadActive = true;
    this.downloadChunks = [];
    this.downloadProgressHandler = onProgress ?? null;

    try {
      this.send({ type: "sftp_download", path: remotePath });

      const startMessage = await this.waitFor(
        (item) =>
          item.type === "sftp_download_start" || item.type === "sftp_error",
        30_000,
        "下载初始化超时",
      );
      if (startMessage.type === "sftp_error") {
        throw new Error(String(startMessage.message ?? "下载初始化失败"));
      }

      const filename =
        String(startMessage.filename ?? "") ||
        remotePath.split("/").pop() ||
        "download";
      const total = Number(startMessage.size ?? 0);

      if (maxSize !== undefined && total > maxSize) {
        this.send({ type: "sftp_download_cancel" });
        throw new Error(
          `文件过大 (${formatFileSize(total)})，编辑最大支持 ${formatFileSize(maxSize)}`,
        );
      }

      onProgress?.({ loaded: 0, total });

      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          this.downloadWaiter = null;
          reject(new Error("下载超时"));
        }, 30 * 60 * 1000);

        this.downloadWaiter = {
          filename,
          resolve: () => {
            window.clearTimeout(timer);
            resolve();
          },
          reject: (error) => {
            window.clearTimeout(timer);
            reject(error);
          },
        };
      });

      const blob = new Blob(this.downloadChunks);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      onProgress?.({ loaded: bytes.byteLength, total: total || bytes.byteLength });
      return { bytes, filename };
    } finally {
      this.downloadActive = false;
      this.downloadWaiter = null;
      this.downloadChunks = [];
      this.downloadProgressHandler = null;
    }
  }

  private async uploadFile(
    remotePath: string,
    file: File,
    onProgress?: (progress: SftpUploadProgress) => void,
  ): Promise<void> {
    await this.ensureSftpReady();
    const total = file.size;
    this.send({ type: "sftp_upload_start", path: remotePath, size: total });

    const readyMessage = await this.waitFor(
      (item) => item.type === "sftp_upload_ready" || item.type === "sftp_error",
      30_000,
      "上传初始化超时",
    );
    if (readyMessage.type === "sftp_error") {
      throw new Error(String(readyMessage.message ?? "上传初始化失败"));
    }

    this.uploadProgressHandler = (progress) => {
      onProgress?.(progress);
    };

    try {
      let offset = 0;
      while (offset < total) {
        const chunk = file.slice(offset, offset + UPLOAD_CHUNK_SIZE);
        const buffer = await chunk.arrayBuffer();
        const chunkBytes = new Uint8Array(buffer);
        const nextOffset = offset + chunkBytes.byteLength;
        this.sendBinary(chunkBytes);

        const ackMessage = await this.waitFor(
          (item) =>
            item.type === "sftp_upload_chunk_ack" ||
            item.type === "sftp_error",
          120_000,
          "上传数据块超时",
        );
        if (ackMessage.type === "sftp_error") {
          throw new Error(String(ackMessage.message ?? "上传失败"));
        }

        const loaded = Number(ackMessage.loaded ?? 0);
        if (loaded < nextOffset) {
          throw new Error("上传数据块确认异常");
        }

        offset = nextOffset;
        onProgress?.({ loaded: offset, total });
      }

      this.send({ type: "sftp_upload_end" });

      const completeTimeout = Math.min(
        10 * 60 * 1000,
        Math.max(60_000, Math.ceil(total / UPLOAD_CHUNK_SIZE) * 15_000),
      );
      const completeMessage = await this.waitFor(
        (item) =>
          item.type === "sftp_upload_complete" ||
          item.type === "sftp_upload_cancelled" ||
          item.type === "sftp_error",
        completeTimeout,
        "上传完成超时",
      );

      if (completeMessage.type === "sftp_upload_cancelled") {
        throw new Error("上传已取消");
      }
      if (completeMessage.type === "sftp_error") {
        throw new Error(String(completeMessage.message ?? "上传失败"));
      }
    } finally {
      this.uploadProgressHandler = null;
    }
  }

  disconnect(): void {
    this.cancelDownload();
    this.intentionalClose = true;
    this.closed = true;
    this.sftpReady = false;
    this.clearWaiters();
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "sftp_close" }));
        }
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.ws = null;
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("SFTP 未连接");
    }
    this.ws.send(JSON.stringify(payload));
  }

  private sendBinary(data: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("SFTP 未连接");
    }
    this.ws.send(data);
  }

  private async handleMessage(data: string | Blob | ArrayBuffer): Promise<void> {
    if (typeof data !== "string") {
      const buffer =
        data instanceof ArrayBuffer ? data : await data.arrayBuffer();
      if (this.downloadActive && buffer.byteLength > 0) {
        this.downloadChunks.push(new Uint8Array(buffer));
      }
      return;
    }

    let message: Record<string, unknown>;
    try {
      message = JSON.parse(data) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = message.type;
    if (typeof type !== "string") return;

    if (type === "sftp_upload_progress") {
      this.uploadProgressHandler?.({
        loaded: Number(message.loaded ?? 0),
        total: Number(message.total ?? 0),
      });
      return;
    }

    if (type === "sftp_download_progress") {
      this.downloadProgressHandler?.({
        loaded: Number(message.loaded ?? 0),
        total: Number(message.total ?? 0),
      });
      return;
    }

    if (type === "sftp_download_done") {
      if (this.downloadWaiter) {
        const waiter = this.downloadWaiter;
        this.downloadWaiter = null;
        waiter.resolve();
      }
      return;
    }

    if (type === "sftp_download_cancelled") {
      if (this.downloadWaiter) {
        const waiter = this.downloadWaiter;
        this.downloadWaiter = null;
        waiter.reject(new Error("下载已取消"));
      }
      return;
    }

    if (type === "sftp_reset") {
      this.sftpReady = false;
      return;
    }

    if (type === "sftp_closed") {
      this.sftpReady = false;
      if (!this.intentionalClose) {
        this.rejectAll(new Error(String(message.message ?? "SFTP 通道已关闭")));
      }
      return;
    }

    if (type === "sftp_error") {
      if (this.downloadWaiter) {
        const waiter = this.downloadWaiter;
        this.downloadWaiter = null;
        waiter.reject(
          new Error(String(message.message ?? "SFTP 下载失败")),
        );
        return;
      }

      const waiter = this.waiters.find((item) => item.match(message));
      if (waiter) {
        this.removeWaiter(waiter);
        waiter.reject(
          new Error(String(message.message ?? "SFTP 操作失败")),
        );
      }
      return;
    }

    const waiterIndex = this.waiters.findIndex((item) => item.match(message));
    if (waiterIndex >= 0) {
      const waiter = this.waiters[waiterIndex];
      this.removeWaiter(waiter);
      waiter.resolve(message);
    }
  }

  private waitFor(
    match: (message: Record<string, unknown>) => boolean,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<Record<string, unknown>> {
    if (this.closed) {
      return Promise.reject(new Error("SFTP 已断开"));
    }

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.removeWaiter(waiter);
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      const waiter: Waiter = { match, resolve, reject, timer };
      this.waiters.push(waiter);
    });
  }

  private removeWaiter(waiter: Waiter): void {
    window.clearTimeout(waiter.timer);
    this.waiters = this.waiters.filter((item) => item !== waiter);
  }

  private rejectAll(error: Error): void {
    for (const waiter of this.waiters) {
      window.clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.waiters = [];
  }

  private clearWaiters(): void {
    for (const waiter of this.waiters) {
      window.clearTimeout(waiter.timer);
    }
    this.waiters = [];
  }
}

export function joinRemotePath(base: string, name: string): string {
  if (base === "." || base === "") return name;
  if (base.endsWith("/")) return `${base}${name}`;
  return `${base}/${name}`;
}

export function parentRemotePath(path: string): string {
  if (path === "." || path === "/") return path;

  const isAbsolute = path.startsWith("/");
  const parts = path.split("/").filter(Boolean);
  parts.pop();

  if (parts.length === 0) {
    return isAbsolute ? "/" : ".";
  }

  const joined = parts.join("/");
  return isAbsolute ? `/${joined}` : joined;
}

export function isRemoteRoot(path: string): boolean {
  return path === "." || path === "/";
}

export function sortSftpEntries(entries: SftpEntry[]): SftpEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export interface LocalDropItem {
  file: File;
  relativePath: string;
}

export function collectFileInputItems(fileList: FileList): LocalDropItem[] {
  const results: LocalDropItem[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]!;
    const relativePath = file.webkitRelativePath || file.name;
    results.push({ file, relativePath });
  }
  return results;
}

export async function collectDroppedFiles(
  dataTransfer: DataTransfer,
): Promise<LocalDropItem[]> {
  const items = dataTransfer.items;
  const results: LocalDropItem[] = [];

  const readAllEntries = (
    reader: FileSystemDirectoryReader,
  ): Promise<FileSystemEntry[]> =>
    new Promise((resolve, reject) => {
      const entries: FileSystemEntry[] = [];
      const readBatch = () => {
        reader.readEntries(
          (batch) => {
            if (batch.length === 0) {
              resolve(entries);
              return;
            }
            entries.push(...batch);
            readBatch();
          },
          reject,
        );
      };
      readBatch();
    });

  const traverse = async (
    entry: FileSystemEntry,
    prefix: string,
  ): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      results.push({ file, relativePath: name });
      return;
    }

    if (entry.isDirectory) {
      const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const children = await readAllEntries(reader);
      for (const child of children) {
        await traverse(child, nextPrefix);
      }
    }
  };

  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== "file") continue;
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        await traverse(entry, "");
        continue;
      }
      const file = item.getAsFile();
      if (file) {
        results.push({ file, relativePath: file.name });
      }
    }
    return results;
  }

  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    results.push({ file, relativePath: file.name });
  }
  return results;
}

export function decodeFileContent(bytes: Uint8Array): string {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function encodeFileContent(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function isLikelyBinaryContent(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
  for (const byte of sample) {
    if (byte === 0) return true;
  }
  return false;
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
