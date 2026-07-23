import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  listResidents,
  getResidentById,
  createResident as dbCreateResident,
  updateResident as dbUpdateResident,
  deleteResident as dbDeleteResident,
  getParkingsByResidentId,
  getParkingPlatesByParkingId,
  createParking,
  updateParking,
  deleteParking,
  addParkingPlate,
  deleteParkingPlate,
  getEmergencyContactsByResidentId,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  deleteEmergencyContactsByResidentId,
} from "./db";
import { logAuditEvent, calculateChanges } from "./audit-log";
import { requirePasswordAuth } from "./password-auth-middleware";
import { syncToRemote } from "./sync-handler";

const emergencyContactInput = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "緊急聯絡人姓名為必填"),
  phone: z.string().optional().nullable(),
  relation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

const residentInput = z.object({
  unitNumber: z.string().min(1, "戶號為必填"),
  ownerName: z.string().min(1, "區權人姓名為必填"),
  ownerPhone: z.string().optional().nullable(),
  coResident1Name: z.string().optional().nullable(),
  coResident1Phone: z.string().optional().nullable(),
  coResident2Name: z.string().optional().nullable(),
  coResident2Phone: z.string().optional().nullable(),
  coResident3Name: z.string().optional().nullable(),
  coResident3Phone: z.string().optional().nullable(),
  coResident4Name: z.string().optional().nullable(),
  coResident4Phone: z.string().optional().nullable(),
  carParkingNumber: z.string().optional().nullable(),
  carPlateNumber: z.string().optional().nullable(),
  motorcycleParkingNumber: z.string().optional().nullable(),
  motorcyclePlateNumber: z.string().optional().nullable(),
  bicycleParkingNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  emergencyContactAddress: z.string().optional().nullable(),
  emergencyContact2Name: z.string().optional().nullable(),
  emergencyContact2Phone: z.string().optional().nullable(),
  emergencyContact2Relation: z.string().optional().nullable(),
  emergencyContact2Address: z.string().optional().nullable(),
  squareMeters: z.string().optional().nullable(),
  waterMeterNumber: z.string().optional().nullable(),
  electricityMeterNumber: z.string().optional().nullable(),
  moveInDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  emergencyContacts: z.array(emergencyContactInput).optional(),
});

export const residentsWithAuditRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const residents = await listResidents();
      console.log(`[DEBUG] list: Found ${residents.length} residents`);
      
      // Return residents with emergency contacts
      return residents;
    } catch (err) {
      console.error('[ERROR] list procedure failed:', err);
      throw err;
    }
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('[DEBUG] residents.get: Fetching resident', input.id);
        const resident = await getResidentById(input.id);
        if (!resident) return null;
        const emergencyContacts = await getEmergencyContactsByResidentId(input.id);
        console.log('[DEBUG] residents.get: Returning resident with emergencyContacts:', emergencyContacts?.length || 0);
        return {
          ...resident,
          emergencyContacts: emergencyContacts || [],
        };
      } catch (err) {
        console.error('[ERROR] get procedure failed:', err);
        throw err;
      }
    }),

  create: protectedProcedure
    .input(residentInput)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const { emergencyContacts: emergencyContactsInput, ...residentData } = input;
      const result = await dbCreateResident(residentData as any);
      const residentId = (result as any)?.insertId || (result as any)?.[0]?.insertId || (result as any).id;
      
      if (!residentId) {
        throw new Error("Failed to create resident: no ID returned");
      }

      // 保存緊急聯絡人
      if (emergencyContactsInput && emergencyContactsInput.length > 0) {
        for (const contact of emergencyContactsInput) {
          if (contact.name) {
            await createEmergencyContact({
              residentId,
              name: contact.name,
              phone: contact.phone || null,
              relationship: contact.relation || null,
              address: contact.address || null,
            });
          }
        }
      }

      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "CREATE",
        entity: "resident",
        entityId: residentId,
        changes: calculateChanges(null, input as any),
      });

      // 同步到備援系統
      syncToRemote("create", "residents", {
        ...input,
        id: residentId,
      }, "unitNumber", input.unitNumber).catch(() => {});

      return result;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), ...residentInput.shape }))
    .mutation(async ({ ctx, input }) => {
      console.log('[DEBUG] update: Called with id:', input.id, 'unitNumber:', input.unitNumber);
      const user = ctx.user;
      const before = await getResidentById(input.id);
      const { id, emergencyContacts: emergencyContactsInput, ...updateData } = input;
      const result = await dbUpdateResident(id, updateData as any);

      // 更新緊急聯絡人
      if (emergencyContactsInput) {
        // 刪除所有舊的緊急聯絡人
        await deleteEmergencyContactsByResidentId(id);
        
        // 新增新的緊急聯絡人
        for (const contact of emergencyContactsInput) {
          if (contact.name || contact.phone) {
            console.log('[DEBUG] Creating emergency contact for resident', id, ':', contact);
            await createEmergencyContact({
              residentId: id,
              name: contact.name || 'N/A',
              phone: contact.phone || null,
              relationship: contact.relation || null,
              address: contact.address || null,
            });
          }
        }
      }

      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "UPDATE",
        entity: "resident",
        entityId: id,
        changes: calculateChanges(before || null, result as any),
      });

      // 同步到備援系統
      syncToRemote("update", "residents", {
        ...input,
        id: id,
      }, "unitNumber", input.unitNumber).catch(() => {});

      console.log('[DEBUG] update: Successfully updated resident:', id);
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const before = await getResidentById(input.id);
      
      // 刪除緊急聯絡人
      await deleteEmergencyContactsByResidentId(input.id);
      
      // 刪除住戶
      await dbDeleteResident(input.id);

      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "DELETE",
        entity: "resident",
        entityId: input.id,
        changes: calculateChanges(before || null, null),
      });

      // 同步到備援系統
      if (before) {
        syncToRemote("delete", "residents", before, "unitNumber", before.unitNumber).catch(() => {});
      }

      return { success: true };
    }),

  validateUnitNumber: protectedProcedure
    .input(z.object({ unitNumber: z.string() }))
    .query(({ input }) => {
      const unitNumber = input.unitNumber.trim().toUpperCase();
      const ariMatch = unitNumber.match(/^([A-Z]+)/);
      const mainMatch = unitNumber.match(/(\d+)/);
      const floorMatch = unitNumber.match(/(\d+)([A-Z]?)$/);

      if (!ariMatch || !mainMatch || !floorMatch) {
        return { valid: false, error: "戶號格式不正確" };
      }

      const ari = ariMatch[1];
      const mainNum = mainMatch[1];
      const floor = floorMatch[1];
      const floorLetter = floorMatch[2] || "F";

      const validAris = ["A", "B", "E", "S"];
      if (!validAris.includes(ari)) {
        return { valid: false, error: `戶別 ${ari} 不存在` };
      }

      return { valid: true, ari, mainNum, floor, floorLetter };
    }),

  importBatch: protectedProcedure
    .input(z.object({ residents: z.array(residentInput) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const results = [];

      for (const residentData of input.residents) {
        try {
          const { emergencyContacts: emergencyContactsInput, ...data } = residentData;
          const result = await dbCreateResident(data as any);
          const residentId = (result as any)[0]?.insertId || (result as any).id;

          // 保存緊急聯絡人
          if (emergencyContactsInput && emergencyContactsInput.length > 0) {
            for (const contact of emergencyContactsInput) {
              if (contact.name) {
                await createEmergencyContact({
                  residentId,
                  name: contact.name,
                  phone: contact.phone || null,
                  relationship: contact.relation || null,
                  address: contact.address || null,
                });
              }
            }
          }

          logAuditEvent({
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name || user.email || "Unknown",
            action: "CREATE",
            entity: "resident",
            entityId: residentId,
            changes: calculateChanges(null, residentData as any),
          });

          results.push({ success: true, unitNumber: residentData.unitNumber });

          // 同步到備援系統
          syncToRemote("create", "residents", {
            ...residentData,
            id: residentId,
          }, "unitNumber", residentData.unitNumber).catch(() => {});
        } catch (error) {
          results.push({
            success: false,
            unitNumber: residentData.unitNumber,
            error: (error as any).message,
          });
        }
      }

      return results;
    }),

  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;
    const residents_list = await listResidents();

    for (const resident of residents_list) {
      await deleteEmergencyContactsByResidentId(resident.id);
      await dbDeleteResident(resident.id);

      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "DELETE",
        entity: "resident",
        entityId: resident.id,
        changes: calculateChanges(resident, null),
      });
    }

    // 同步刪除到備援系統
    for (const resident of residents_list) {
      syncToRemote("delete", "residents", resident, "unitNumber", resident.unitNumber).catch(() => {});
    }

    return { success: true, deletedCount: residents_list.length };
  }),
});
