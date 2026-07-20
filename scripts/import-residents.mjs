#!/usr/bin/env node
/**
 * CLI 工具：直接從 JSON 檔案匯入住戶資料到資料庫
 * 用法：node scripts/import-residents.mjs <json_file_path>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/mysql2';
import { residents } from '../drizzle/schema.js';
import mysql from 'mysql2/promise';
import { createConnection } from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 從環境變數讀取資料庫連接字串
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ 錯誤：DATABASE_URL 環境變數未設定');
  process.exit(1);
}

// 解析 MySQL 連接字串
const parseConnectionString = (url) => {
  // mysql://user:password@host:port/database
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('無效的 DATABASE_URL 格式');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
};

const importResidents = async (filePath) => {
  try {
    // 讀取 JSON 檔案
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 檔案不存在：${filePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      console.error('❌ JSON 檔案必須是陣列格式');
      process.exit(1);
    }

    console.log(`📁 讀取檔案：${filePath}`);
    console.log(`📊 準備匯入 ${data.length} 筆資料...\n`);

    // 連接資料庫
    const config = parseConnectionString(DATABASE_URL);
    const connection = await createConnection(config);
    const db = drizzle(connection);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 逐筆匯入
    for (let i = 0; i < data.length; i++) {
      const resident = data[i];
      try {
        // 驗證必填欄位
        if (!resident.unitNumber) {
          throw new Error('戶號為必填欄位');
        }
        if (!resident.ownerName) {
          throw new Error('區權人姓名為必填欄位');
        }

        // 檢查戶號是否重複
        const existing = await db
          .select()
          .from(residents)
          .where((r) => r.unitNumber === resident.unitNumber)
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`戶號 ${resident.unitNumber} 已存在`);
        }

        // 插入資料
        await db.insert(residents).values({
          unitNumber: resident.unitNumber,
          ownerName: resident.ownerName,
          ownerPhone: resident.ownerPhone || null,
          coResident1Name: resident.coResident1Name || null,
          coResident1Phone: resident.coResident1Phone || null,
          coResident2Name: resident.coResident2Name || null,
          coResident2Phone: resident.coResident2Phone || null,
          coResident3Name: resident.coResident3Name || null,
          coResident3Phone: resident.coResident3Phone || null,
          coResident4Name: resident.coResident4Name || null,
          coResident4Phone: resident.coResident4Phone || null,
          carParkingNumber: resident.carParkingNumber || null,
          carPlateNumber: resident.carPlateNumber || null,
          motorcycleParkingNumber: resident.motorcycleParkingNumber || null,
          motorcyclePlateNumber: resident.motorcyclePlateNumber || null,
          bicycleParkingNumber: resident.bicycleParkingNumber || null,
          address: resident.address || null,
          emergencyContactName: resident.emergencyContactName || null,
          emergencyContactPhone: resident.emergencyContactPhone || null,
          emergencyContactRelation: resident.emergencyContactRelation || null,
          emergencyContactAddress: resident.emergencyContactAddress || null,
          emergencyContact2Name: resident.emergencyContact2Name || null,
          emergencyContact2Phone: resident.emergencyContact2Phone || null,
          emergencyContact2Relation: resident.emergencyContact2Relation || null,
          emergencyContact2Address: resident.emergencyContact2Address || null,
          notes: resident.notes || null,
        });

        successCount++;
        console.log(`✓ [${i + 1}/${data.length}] ${resident.unitNumber} - ${resident.ownerName}`);
      } catch (err) {
        errorCount++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({
          index: i,
          unitNumber: resident.unitNumber,
          ownerName: resident.ownerName,
          error: errorMsg,
        });
        console.log(`✗ [${i + 1}/${data.length}] ${resident.unitNumber} - ${errorMsg}`);
      }
    }

    // 關閉連接
    await connection.end();

    // 輸出統計結果
    console.log(`\n${'='.repeat(60)}`);
    console.log(`匯入完成！`);
    console.log(`✓ 成功：${successCount} 筆`);
    console.log(`✗ 失敗：${errorCount} 筆`);
    console.log(`${'='.repeat(60)}`);

    if (errors.length > 0) {
      console.log(`\n❌ 失敗詳情：`);
      errors.forEach((err) => {
        console.log(`  - ${err.unitNumber} (${err.ownerName})：${err.error}`);
      });
    }

    process.exit(errorCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('❌ 匯入失敗：', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
};

// 取得命令列參數
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('用法：node scripts/import-residents.mjs <json_file_path>');
  console.log('範例：node scripts/import-residents.mjs /home/ubuntu/upload/B棟_converted.json');
  process.exit(1);
}

const filePath = args[0];
importResidents(filePath);
