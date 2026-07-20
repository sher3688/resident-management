import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { resourceFolders, resourceFiles } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const resourceLibraryRouter = router({
  // 文件夾操作
  listFolders: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const folders = await db
      .select()
      .from(resourceFolders)
      .orderBy(desc(resourceFolders.createdAt));
    return folders;
  }),

  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "文件夾名稱不能為空"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(resourceFolders).values({
        name: input.name,
        description: input.description,
      });
      return result;
    }),

  updateFolder: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "文件夾名稱不能為空"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .update(resourceFolders)
        .set({
          name: input.name,
          description: input.description,
        })
        .where(eq(resourceFolders.id, input.id));
      return result;
    }),

  deleteFolder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .delete(resourceFolders)
        .where(eq(resourceFolders.id, input.id));
      return result;
    }),

  // 檔案操作
  listFiles: protectedProcedure
    .input(z.object({ folderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const files = await db
        .select()
        .from(resourceFiles)
        .where(eq(resourceFiles.folderId, input.folderId))
        .orderBy(desc(resourceFiles.createdAt));
      return files;
    }),

  createFile: protectedProcedure
    .input(
      z.object({
        folderId: z.number(),
        name: z.string().min(1, "檔案名稱不能為空"),
        fileUrl: z.string().min(1, "檔案 URL 不能為空"),
        fileSize: z.number().optional(),
        fileType: z.string().default("pdf"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(resourceFiles).values({
        folderId: input.folderId,
        name: input.name,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        fileType: input.fileType,
        uploadedBy: ctx.user?.id,
      });
      return result;
    }),

  updateFile: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "檔案名稱不能為空"),
        fileUrl: z.string().min(1, "檔案 URL 不能為空").optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const updateData: any = {
        name: input.name,
      };
      if (input.fileUrl) {
        updateData.fileUrl = input.fileUrl;
      }
      const result = await db
        .update(resourceFiles)
        .set(updateData)
        .where(eq(resourceFiles.id, input.id));
      return result;
    }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .delete(resourceFiles)
        .where(eq(resourceFiles.id, input.id));
      return result;
    }),

  // 獲取檔案詳情
  getFile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const file = await db
        .select()
        .from(resourceFiles)
        .where(eq(resourceFiles.id, input.id));
      return file[0] || null;
    }),
});
