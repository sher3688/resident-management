import psycopg2
import json
import csv
import os
from datetime import datetime

conn_str = "postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

output_dir = f"/tmp/rm_test/exports_{datetime.now().strftime('%Y%m%d')}"
os.makedirs(output_dir, exist_ok=True)

print("Connecting to database...")
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

# Export all tables
tables_to_export = [
    ('residents', '住戶資料'),
    ('repair_requests', '報修統計'),
    ('renovation_applications', '裝修申請'),
    ('resource_folders', '資源庫文件夾'),
    ('resource_files', '資源庫檔案'),
    ('password_users', '密碼使用者'),
    ('users', '使用者'),
    ('audit_logs', '稽核日誌'),
    ('operation_logs', '操作日誌'),
    ('user_sessions', '使用者登入記錄'),
    ('invited_users', '邀請使用者'),
    ('co_residents', '同住人'),
    ('parkings', '車位'),
    ('parking_plates', '車牌'),
    ('emergency_contacts', '緊急聯絡人'),
    ('qa_faqs', 'QA常見問題'),
    ('qa_password_users', 'QA密碼使用者'),
    ('qa_users', 'QA使用者'),
]

total_exported = 0

for table_name, display_name in tables_to_export:
    try:
        cur.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
        count = cur.fetchone()[0]
        
        if count == 0:
            print(f"  {display_name} ({table_name}): 0 筆資料（跳過）")
            continue
        
        print(f"  {display_name} ({table_name}): {count} 筆資料...")
        
        cur.execute(f'SELECT * FROM "{table_name}" ORDER BY id')
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        
        # Export as JSON
        json_data = []
        for row in rows:
            row_dict = {}
            for i, col in enumerate(columns):
                val = row[i]
                if val is not None:
                    if isinstance(val, datetime):
                        row_dict[col] = val.isoformat()
                    else:
                        row_dict[col] = val
            json_data.append(row_dict)
        
        json_path = os.path.join(output_dir, f"{table_name}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2, default=str)
        print(f"    -> 已匯出 JSON: {json_path}")
        
        # Export as TSV (for import compatibility)
        tsv_path = os.path.join(output_dir, f"{table_name}.csv")
        with open(tsv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f, delimiter='\t')
            writer.writerow(columns)
            for row in rows:
                row_data = []
                for val in row:
                    if val is None:
                        row_data.append('')
                    elif isinstance(val, datetime):
                        row_data.append(val.isoformat())
                    else:
                        row_data.append(str(val))
                writer.writerow(row_data)
        print(f"    -> 已匯出 CSV/TSV: {tsv_path}")
        
        total_exported += count
        
    except Exception as e:
        print(f"  {display_name} ({table_name}): 匯出失敗 - {e}")

# Summary
print(f"\n=== 匯出摘要 ===")
print(f"總資料筆數: {total_exported}")
print(f"匯出目錄: {output_dir}")

# Create a zip file
import zipfile
zip_path = f"/tmp/rm_test/exports_{datetime.now().strftime('%Y%m%d')}.zip"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for filename in os.listdir(output_dir):
        filepath = os.path.join(output_dir, filename)
        zipf.write(filepath, filename)
print(f"壓縮檔: {zip_path}")

cur.close()
conn.close()
print("\nDone!")
