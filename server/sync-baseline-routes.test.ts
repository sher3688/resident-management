import express from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSyncBaselineRouter } from "./sync-baseline-routes";
import type { BaselinePage, BaselineRunSummary, SyncMappingSummary } from "./sync-baseline";

const residentPage: BaselinePage = {
  table: "residents",
  records: [{ id: 41, unitNumber: "R-TEST", name: "測試住戶", updatedAt: "2026-07-23T00:00:00.000Z", coResidents: [] }],
  nextCursor: 41,
  hasMore: true,
};

const runSummary: BaselineRunSummary = {
  success: true,
  table: "residents",
  cursor: 0,
  processed: 1,
  inserted: 1,
  updated: 0,
  skipped: 0,
  failed: 0,
  nextCursor: 41,
  hasMore: true,
  retryRequired: false,
  errors: [],
  message: "Baseline page imported",
};

const mappingSummary: SyncMappingSummary = {
  ready: true,
  originSystem: "resident-management",
  counts: { residents: 1 },
  message: "Synchronization mapping summary is ready",
};

async function startTestServer() {
  const getPage = vi.fn().mockResolvedValue(residentPage);
  const runPage = vi.fn().mockResolvedValue(runSummary);
  const getMappingSummary = vi.fn().mockResolvedValue(mappingSummary);
  const app = express();
  app.use(express.json());
  app.use("/api", createSyncBaselineRouter({
    apiKey: "baseline-test-key",
    localSystemId: "community-management",
    remoteSystemId: "resident-management",
    getPage,
    runPage,
    getMappingSummary,
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
    baseUrl: `http://127.0.0.1:${address.port}/api`,
    getPage,
    runPage,
    getMappingSummary,
  };
}

function headers(source: string, apiKey = "baseline-test-key"): Record<string, string> {
  return { "X-Sync-Api-Key": apiKey, "X-Sync-Source": source };
}

describe("baseline synchronization routes", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
  });

  it("serves a protected, page-bounded source export only to the configured peer", async () => {
    const { server, baseUrl, getPage } = await startTestServer();
    servers.push(server);

    const response = await fetch(`${baseUrl}/sync/baseline?table=residents&cursor=0&limit=25`, {
      headers: headers("resident-management"),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(residentPage);
    expect(getPage).toHaveBeenCalledWith("residents", 0, 25);
  });

  it("rejects export attempts without the shared key, from an unexpected source, or with an invalid page request", async () => {
    const { server, baseUrl, getPage } = await startTestServer();
    servers.push(server);

    const withoutKey = await fetch(`${baseUrl}/sync/baseline?table=residents`, { headers: headers("resident-management", "wrong-key") });
    expect(withoutKey.status).toBe(401);

    const wrongSource = await fetch(`${baseUrl}/sync/baseline?table=residents`, { headers: headers("untrusted") });
    expect(wrongSource.status).toBe(403);

    const invalidQuery = await fetch(`${baseUrl}/sync/baseline?table=unknown`, { headers: headers("resident-management") });
    expect(invalidQuery.status).toBe(400);
    expect(getPage).not.toHaveBeenCalled();
  });

  it("allows only the local backup to trigger a no-delete baseline page run", async () => {
    const { server, baseUrl, runPage } = await startTestServer();
    servers.push(server);

    const response = await fetch(`${baseUrl}/sync/baseline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers("community-management") },
      body: JSON.stringify({ table: "residents", cursor: 0, limit: 25 }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(runSummary);
    expect(runPage).toHaveBeenCalledWith({ table: "residents", cursor: 0, limit: 25 });

    const remoteAttempt = await fetch(`${baseUrl}/sync/baseline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers("resident-management") },
      body: JSON.stringify({ table: "residents" }),
    });
    expect(remoteAttempt.status).toBe(403);
  });

  it("returns only aggregate mapping counts to an authorized peer", async () => {
    const { server, baseUrl, getMappingSummary } = await startTestServer();
    servers.push(server);

    const response = await fetch(`${baseUrl}/sync/mappings/summary`, { headers: headers("resident-management") });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mappingSummary);
    expect(getMappingSummary).toHaveBeenCalledTimes(1);
  });
});
