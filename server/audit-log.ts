import fs from "fs";
import path from "path";

export interface AuditLogEntry {
  timestamp: string;
  userId: number;
  userName: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: "resident" | "repair_request" | "user";
  entityId: number;
  changes: Record<string, { before?: any; after?: any }>;
  ipAddress?: string;
}

const LOG_DIR = path.join(process.cwd(), ".audit-logs");

// 確保日誌目錄存在
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * 記錄操作日誌
 */
export function logAuditEvent(entry: AuditLogEntry) {
  ensureLogDir();

  const logFile = path.join(LOG_DIR, `audit-${new Date().toISOString().split("T")[0]}.jsonl`);
  const logLine = JSON.stringify(entry) + "\n";

  try {
    fs.appendFileSync(logFile, logLine, "utf-8");
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

/**
 * 讀取操作日誌
 */
export function readAuditLogs(options?: {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  entity?: string;
  limit?: number;
}): AuditLogEntry[] {
  ensureLogDir();

  const logs: AuditLogEntry[] = [];
  const files = fs.readdirSync(LOG_DIR).sort().reverse();

  for (const file of files) {
    if (!file.endsWith(".jsonl")) continue;

    const filePath = path.join(LOG_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AuditLogEntry;

        // 應用篩選條件
        if (options?.startDate && new Date(entry.timestamp) < options.startDate) {
          continue;
        }
        if (options?.endDate && new Date(entry.timestamp) > options.endDate) {
          continue;
        }
        if (options?.userId && entry.userId !== options.userId) {
          continue;
        }
        if (options?.entity && entry.entity !== options.entity) {
          continue;
        }

        logs.push(entry);

        if (options?.limit && logs.length >= options.limit) {
          return logs;
        }
      } catch (error) {
        console.error("[AuditLog] Failed to parse log line:", error);
      }
    }
  }

  return logs;
}

/**
 * 計算欄位變更
 */
export function calculateChanges<T extends Record<string, any>>(
  before: T | null,
  after: T | null
): Record<string, { before?: any; after?: any }> {
  const changes: Record<string, { before?: any; after?: any }> = {};

  if (!before && after) {
    // 新建立
    for (const key in after) {
      changes[key] = { after: after[key] };
    }
  } else if (before && !after) {
    // 刪除
    for (const key in before) {
      changes[key] = { before: before[key] };
    }
  } else if (before && after) {
    // 更新
    for (const key in after) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = { before: before[key], after: after[key] };
      }
    }
  }

  return changes;
}
