import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { renovationApplications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const renovationApplicationsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(renovationApplications).orderBy(renovationApplications.createdAt);
    return result;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .select()
        .from(renovationApplications)
        .where(eq(renovationApplications.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        unitNumber: z.string().min(1),
        applicationDate: z.string().min(1),
        constructionStartDate: z.string().optional().nullable(),
        constructionEndDate: z.string().optional().nullable(),
        constructionContent: z.string().min(1),
        consentLetterPasted: z.string().optional().nullable(),
        applicantName: z.string().min(1),
        applicantPhone: z.string().min(1),
        registeredBy: z.string().optional().nullable(),
        status: z.enum(["pending", "approved", "completed", "rejected"]).default("pending"),
        decorationDeposit: z.string().optional().nullable(),
        decorationDepositStatus: z.enum(["notPaid", "paid", "refunded"]).optional().default("notPaid"),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(renovationApplications).values({
        ...input,
        consentLetterPasted: input.consentLetterPasted || null,
        constructionStartDate: input.constructionStartDate || null,
        constructionEndDate: input.constructionEndDate || null,
        registeredBy: input.registeredBy || null,
        decorationDeposit: input.decorationDeposit || null,
        decorationDepositStatus: input.decorationDepositStatus || "notPaid",
        notes: input.notes || null,
      });
      return result;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        unitNumber: z.string().min(1),
        applicationDate: z.string().min(1),
        constructionStartDate: z.string().optional().nullable(),
        constructionEndDate: z.string().optional().nullable(),
        constructionContent: z.string().min(1),
        consentLetterPasted: z.string().optional().nullable(),
        applicantName: z.string().min(1),
        applicantPhone: z.string().min(1),
        registeredBy: z.string().optional().nullable(),
        status: z.enum(["pending", "approved", "completed", "rejected"]),
        decorationDeposit: z.string().optional().nullable(),
        decorationDepositStatus: z.enum(["notPaid", "paid", "refunded"]).optional(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      const result = await db
        .update(renovationApplications)
        .set({
          ...data,
          consentLetterPasted: data.consentLetterPasted || null,
          constructionStartDate: data.constructionStartDate || null,
          constructionEndDate: data.constructionEndDate || null,
          registeredBy: data.registeredBy || null,
          decorationDeposit: data.decorationDeposit || null,
          decorationDepositStatus: data.decorationDepositStatus || undefined,
          notes: data.notes || null,
        })
        .where(eq(renovationApplications.id, id));
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .delete(renovationApplications)
        .where(eq(renovationApplications.id, input.id));
      return result;
    }),
});
