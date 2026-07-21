import psycopg2
from datetime import datetime
import re

conn_str = "postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Data from the XLS export
# Format: (unitNumber, repairDate, description, status, notes)
data = [
    ('A7-20F', '2026-07-11 08:11:00', '噴灌系統配電箱關閉無效', 'pending', '報修國霖'),
    ('B1-15F', '2026-07-10 03:18:00', '門前走道燈不亮', 'in_progress', '已報修.7-15保養時請修繕'),
    ('B棟ㄧ、二樓梯廳', '2026-07-03 08:16:00', 'B棟ㄧ、二樓梯廳燈閃爍', 'pending', ''),
    ('A10-14F', '2026-06-28 07:02:00', '走廊燈故障', 'pending', ''),
    ('B7-15', '2026-06-28 03:01:00', 'B1-431車位上方燈不亮', 'completed', '國霖機電已更換。'),
    ('A9-6', '2026-06-28 03:00:00', '走廊燈不亮', 'completed', '已換一顆，餘兩顆沒亮國霖機電已維修過。115.6.12'),
    ('管理室', '2026-06-27 03:14:00', 'B1-475 車位上方管路漏水', 'pending', '已通報售服'),
    ('A9-2F', '2026-06-26 19:30:00', '390車位上方漏水', 'pending', '已通知售服'),
    ('A1-15', '2026-06-25 02:50:00', '走廊門前上方兩顆燈泡不亮', 'pending', ''),
    ('B7-4', '2026-06-19 02:51:00', 'B10-4走廊感應燈會滲水\n走廊燈壞掉', 'pending', '已轉國霖'),
    ('A10-14', '2026-06-15 02:51:00', '走廊燈一直閃爍', 'pending', ''),
    ('住戶通報', '2026-06-12 02:53:00', 'A3-18F    B7-4F      走道燈線路沒電', 'pending', '國霖檢測'),
    ('A8-15', '2026-06-09 02:58:00', 'A8-14通知主臥浴室天花板漏水', 'pending', ''),
    ('清潔通報', '2026-06-05 02:52:00', 'B棟安全梯1-2樓之間燈光不亮', 'pending', '已通報國霖'),
    ('B8-18', '2026-06-02 02:54:00', '走廊燈不亮', 'completed', '國霖6.12修復'),
    ('B11-20', '2026-05-25 02:55:00', 'B3-78車位上方不亮', 'pending', ''),
    ('B7-21', '2026-05-22 02:56:00', '走廊燈不亮', 'completed', ''),
    ('A8-14', '2026-05-09 02:57:00', '主臥浴室天花板漏水', 'pending', ''),
    ('B8-20F', '2026-05-06 02:58:00', '馬達滴水', 'pending', ''),
    ('B7-4', '2026-04-27 02:59:00', '走廊燈不亮', 'pending', ''),
    ('A10-18', '2026-04-26 03:00:00', '家中對講機異常', 'pending', ''),
    ('A3-18', '2026-04-08 03:00:00', '走廊燈不亮', 'pending', ''),
    ('A9-6', '2026-02-15 03:02:00', '浴室淨水閥有水垢銹蝕、房間也有漏水、梯廳燈壞掉', 'resident_self_repair', '0919-647-599'),
    ('B6-11', '2026-02-12 03:03:00', '廁所地排堵塞通管無效', 'pending', '0963-768-713'),
    ('A13-9', '2026-02-12 03:02:00', '陽台磁磚裂開', 'pending', '0927-112-061'),
    ('B2-14', '2026-01-29 03:03:00', '靠中華路陽台天花板生鏽', 'pending', '0956-514-887'),
    ('A9-6', '2026-01-22 03:04:00', '走道燈壞3顆', 'completed', '已換一顆，餘兩顆沒亮國霖機電已維修過。115.6.12'),
    ('B8-20', '2026-01-17 03:05:00', '天花板(陽台)維修蓋掉落；廁所水管破裂', 'resident_self_repair', '0961-025-952\n住戶需自行採購，洽櫃檯廠商名錄。廁所水管請自行洽安排水電師傅'),
    ('A9-15', '2026-01-09 03:06:00', '走廊燈不亮', 'completed', '國霖機電已維修過。'),
]

print(f"Connecting to database...")
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

success = 0
errors = 0

for i, (unitNumber, repairDate, description, status, notes) in enumerate(data):
    try:
        cur.execute("""
            INSERT INTO repair_requests ("repairDate", "unitNumber", description, status, notes, "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            repairDate[:10],  # Store date only as varchar(32)
            unitNumber,
            description,
            status,
            notes if notes else None,
            datetime.now(),
            datetime.now()
        ))
        success += 1
        print(f"  [{success}] {unitNumber} - {description[:30]}... -> {status}")
    except Exception as e:
        errors += 1
        print(f"  ERROR [{i+1}] {unitNumber}: {e}")
        conn.rollback()

conn.commit()

# Summary
print(f"\n=== 匯入摘要 ===")
print(f"成功: {success}")
print(f"失敗: {errors}")
print(f"總計: {len(data)}")

# Verify
cur.execute("SELECT COUNT(*) FROM repair_requests")
count = cur.fetchone()[0]
print(f"資料庫中總計: {count} 筆")

cur.close()
conn.close()
print("\nDone!")
