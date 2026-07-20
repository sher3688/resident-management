import { getDb } from './server/db.ts';
import { residents } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function test() {
  const db = await getDb();
  if (!db) {
    console.error('資料庫連接失敗');
    process.exit(1);
  }

  // 查詢 A1-04F 的資料
  const result = await db
    .select()
    .from(residents)
    .where(eq(residents.unitNumber, 'A1-04F'))
    .limit(1);

  if (!result[0]) {
    console.error('找不到 A1-04F');
    process.exit(1);
  }

  const resident = result[0];
  console.log('原始資料：');
  console.log('  緊急聯絡人1:', {
    name: resident.emergencyContactName,
    phone: resident.emergencyContactPhone,
    relation: resident.emergencyContactRelation,
  });
  console.log('  緊急聯絡人2:', {
    name: resident.emergencyContact2Name,
    phone: resident.emergencyContact2Phone,
    relation: resident.emergencyContact2Relation,
  });

  // 更新緊急聯絡人
  console.log('\n更新緊急聯絡人...');
  await db
    .update(residents)
    .set({
      emergencyContactName: '李海鈺',
      emergencyContactPhone: '0968-955-687',
      emergencyContactRelation: '夫',
    })
    .where(eq(residents.id, resident.id));

  // 再次查詢
  const updated = await db
    .select()
    .from(residents)
    .where(eq(residents.id, resident.id))
    .limit(1);

  console.log('\n更新後的資料：');
  console.log('  緊急聯絡人1:', {
    name: updated[0].emergencyContactName,
    phone: updated[0].emergencyContactPhone,
    relation: updated[0].emergencyContactRelation,
  });

  if (
    updated[0].emergencyContactName === '李海鈺' &&
    updated[0].emergencyContactPhone === '0968-955-687' &&
    updated[0].emergencyContactRelation === '夫'
  ) {
    console.log('\n✅ 緊急聯絡人更新成功！');
  } else {
    console.log('\n❌ 緊急聯絡人更新失敗！');
  }

  process.exit(0);
}

test().catch((err) => {
  console.error('錯誤:', err);
  process.exit(1);
});
