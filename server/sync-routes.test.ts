import express from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSyncRouter } from "./sync-routes";
import type { SyncRequest, SyncResponse } from "./sync-handler";

const validEvent = {
  operation: "update",
  table: "repair_requests",
  data: { id: 901, unitNumber: "TEST-UNIT", repairDate: "2026-07-23", description: "route test" },
  keyField: "id",
  keyValue: 901,
  sourceSystem: "resident-management",
  timestamp: "2026-07-23T00:00:00.000Z",
} as const;

async function startTestServer(handler: (request: SyncRequest) => Promise<SyncResponse>) {
  const app = express();
  app.use(express.json());
  app.use("/api", createSyncRouter({
    apiKey: "test-sync-key",
    localSystemId: "community-management",
    remoteSystemId: "resident-management",
    handleRequest: handler,
  }));

  const server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to obtain test server port");
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}/api/sync`,
  };
}

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sync-Api-Key": "test-sync-key",
      "X-Sync-Source": "resident-management",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sync", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
  });

  it("accepts an authorized, well-formed event from the configured remote system", async () => {
    const handler = vi.fn<(request: SyncRequest) => Promise<SyncResponse>>()
      .mockResolvedValue({ success: true, message: "Repair request updated", action: "updated" });
    const { server, url } = await startTestServer(handler);
    servers.push(server);

    const response = await post(url, validEvent);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, action: "updated" });
    expect(handler).toHaveBeenCalledWith(validEvent);
  });

  it("rejects a missing or invalid shared key before inspecting the body", async () => {
    const handler = vi.fn<(request: SyncRequest) => Promise<SyncResponse>>();
    const { server, url } = await startTestServer(handler);
    servers.push(server);

    const response = await post(url, validEvent, { "X-Sync-Api-Key": "wrong-key" });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, message: "Invalid API key" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects invalid request fields and unknown tables", async () => {
    const handler = vi.fn<(request: SyncRequest) => Promise<SyncResponse>>();
    const { server, url } = await startTestServer(handler);
    servers.push(server);

    const response = await post(url, { ...validEvent, table: "untrusted_table", timestamp: "not-a-date" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, message: "Invalid request body" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("acknowledges a self-originated event without invoking the persistence handler", async () => {
    const handler = vi.fn<(request: SyncRequest) => Promise<SyncResponse>>();
    const { server, url } = await startTestServer(handler);
    servers.push(server);
    const selfEvent = { ...validEvent, sourceSystem: "community-management" };

    const response = await post(url, selfEvent, { "X-Sync-Source": "community-management" });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, action: "skipped" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a source that is neither the configured peer nor the local system", async () => {
    const handler = vi.fn<(request: SyncRequest) => Promise<SyncResponse>>();
    const { server, url } = await startTestServer(handler);
    servers.push(server);
    const unexpectedEvent = { ...validEvent, sourceSystem: "unknown-system" };

    const response = await post(url, unexpectedEvent, { "X-Sync-Source": "unknown-system" });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false, message: "Unexpected sync source" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns a bounded 500 response when the persistence handler throws", async () => {
    const handler = vi.fn<(request: SyncRequest) => Promise<SyncResponse>>()
      .mockRejectedValue(new Error("database timeout"));
    const { server, url } = await startTestServer(handler);
    servers.push(server);

    const response = await post(url, validEvent);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, message: "Internal synchronization error" });
  });
});
