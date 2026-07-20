import { getDb } from "./db";
import { coResidents, parkings, emergencyContacts, InsertCoResident, InsertParking, InsertEmergencyContact } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 同住人相關操作
 */
export async function getCoResidents(residentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coResidents).where(eq(coResidents.residentId, residentId));
}

export async function createCoResident(data: InsertCoResident) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(coResidents).values(data);
}

export async function updateCoResident(id: number, data: Partial<InsertCoResident>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(coResidents).set(data).where(eq(coResidents.id, id));
}

export async function deleteCoResident(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(coResidents).where(eq(coResidents.id, id));
}

/**
 * 車位相關操作
 */
export async function getParkings(residentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parkings).where(eq(parkings.residentId, residentId));
}

export async function createParking(data: InsertParking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(parkings).values(data);
}

export async function updateParking(id: number, data: Partial<InsertParking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(parkings).set(data).where(eq(parkings.id, id));
}

export async function deleteParking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(parkings).where(eq(parkings.id, id));
}

/**
 * 緊急聯絡人相關操作
 */
export async function getEmergencyContacts(residentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emergencyContacts).where(eq(emergencyContacts.residentId, residentId));
}

export async function createEmergencyContact(data: InsertEmergencyContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(emergencyContacts).values(data);
}

export async function updateEmergencyContact(id: number, data: Partial<InsertEmergencyContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(emergencyContacts).set(data).where(eq(emergencyContacts.id, id));
}

export async function deleteEmergencyContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
}
