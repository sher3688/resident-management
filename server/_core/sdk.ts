import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "default-secret-change-in-production");
const JWT_ISSUER = "resident-management";

/**
 * Standalone JWT SDK - no longer depends on Manus OAuth
 * Used for password-based authentication
 */
export const sdk = {
  /**
   * Create a JWT session token for a user by userId
   */
  async createSessionToken(
    userId: number,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    return new SignJWT({
      userId,
      name: options.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(expirationSeconds)
      .sign(JWT_SECRET);
  },

  /**
   * Verify a JWT session token and return the payload
   */
  async verifySession(
    token: string | undefined | null
  ): Promise<{ userId: number; name: string } | null> {
    if (!token) {
      console.warn("[Auth] Missing session token");
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        algorithms: ["HS256"],
      });

      const userId = (payload as any).userId;
      const name = (payload as any).name || "";

      if (!isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        userId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  },

  /**
   * Authenticate a request using cookie-based JWT
   */
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionToken = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionToken);

    if (!session) {
      return null;
    }

    // Look up user by ID (stored in password_users table)
    const user = await db.getUserByOpenId(String(session.userId));
    if (!user) {
      return null;
    }

    // Update last signed in time
    try {
      await db.upsertUser({
        openId: user.openId,
        name: user.name,
        email: user.email,
        lastSignedIn: new Date(),
      });
    } catch (error) {
      console.error("[Auth] Failed to update last signed in:", error);
    }

    return user;
  },
};

export type AuthenticatedUser = User;
