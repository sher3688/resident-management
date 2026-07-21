#!/usr/bin/env python3
"""匯入裝修申請資料到 Neon PostgreSQL 資料庫"""

import psycopg2

DB_URL = 'postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

# 23筆裝修申請資料
data = [
    # 截圖6 (最後一頁) - 2筆
    {
        'unitNumber': 'B2-13F',
        'applicationDate': '2026-01-12',
        'constructionStartDate': '2026-01-19',
        'constructionEndDate': '2026-03-06',
        'constructionContent': '陽台防水',
        'applicantName': '莊俶容',
        'applicantPhone': '0934-085-878',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A7-4F',
        'applicationDate': '2025-11-23',
        'constructionStartDate': '2026-01-25',
        'constructionEndDate': '2026-02-27',
        'constructionContent': '牆內管線漏水',
        'applicantName': '姜自剛',
        'applicantPhone': '0913-117-787',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    # 截圖1 (首頁/第一頁) - 4筆
    {
        'unitNumber': 'E5',
        'applicationDate': '2026-05-18',
        'constructionStartDate': '2026-05-18',
        'constructionEndDate': '2026-07-18',
        'constructionContent': '施工裝潢',
        'applicantName': '黃辰于',
        'applicantPhone': '0988-991-158',
        'status': 'approved',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'paid',
        'notes': '裝修金：30,000 元 (已繳)',
    },
    {
        'unitNumber': 'A3-11F',
        'applicationDate': '2026-07-12',
        'constructionStartDate': '2026-07-15',
        'constructionEndDate': '2026-07-15',
        'constructionContent': '更換馬桶',
        'applicantName': '蘇美珍',
        'applicantPhone': '0975818926',
        'status': 'pending',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A9-17F',
        'applicationDate': '2026-06-29',
        'constructionStartDate': '2026-07-07',
        'constructionEndDate': '2026-07-22',
        'constructionContent': '浴室漏水',
        'applicantName': '郝俊智、張璋文',
        'applicantPhone': '0982871531',
        'status': 'approved',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '0932872759',
    },
    {
        'unitNumber': 'A1-02F',
        'applicationDate': '2026-06-27',
        'constructionStartDate': '2026-07-01',
        'constructionEndDate': '2026-07-15',
        'constructionContent': '客廳重新裝修，更換地板和牆壁',
        'applicantName': '王先生',
        'applicantPhone': '0912345678',
        'status': 'pending',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '預計7月1日開始施工',
    },
    # 截圖2 (第二頁) - 4筆
    {
        'unitNumber': 'B2-14F',
        'applicationDate': '2026-05-09',
        'constructionStartDate': '2026-05-10',
        'constructionEndDate': '2026-07-11',
        'constructionContent': '陽台防水',
        'applicantName': '張惠菁',
        'applicantPhone': '0956-514-887',
        'status': 'pending',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'E3',
        'applicationDate': '2026-06-07',
        'constructionStartDate': '2026-06-01',
        'constructionEndDate': '2026-06-25',
        'constructionContent': '施工裝潢',
        'applicantName': '黃嘉然',
        'applicantPhone': '0960-343-673',
        'status': 'completed',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'paid',
        'notes': '裝修金：30,000 元 (已繳)，從 Excel 匯入',
    },
    {
        'unitNumber': 'S6',
        'applicationDate': '2026-02-01',
        'constructionStartDate': '2026-02-02',
        'constructionEndDate': '2026-02-16',
        'constructionContent': '施工裝潢',
        'applicantName': '卓連勝',
        'applicantPhone': '0935-836-981',
        'status': 'completed',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'paid',
        'notes': '裝修金：30,000 元 (已繳)，從 Excel 匯入',
    },
    {
        'unitNumber': 'S6',
        'applicationDate': '2026-01-31',
        'constructionStartDate': '2026-02-02',
        'constructionEndDate': '2026-02-15',
        'constructionContent': '施工裝潢',
        'applicantName': '顏佑綸',
        'applicantPhone': '0931-195-603',
        'status': 'completed',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'paid',
        'notes': '裝修金：30,000 元 (已繳)，從 Excel 匯入',
    },
    # 截圖3 (第三頁) - 4筆
    {
        'unitNumber': 'S15',
        'applicationDate': '2025-12-11',
        'constructionStartDate': '2026-12-17',
        'constructionEndDate': '2026-02-26',
        'constructionContent': '施工裝潢',
        'applicantName': '謝文嵐',
        'applicantPhone': '0919-290-171',
        'status': 'completed',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'paid',
        'notes': '裝修金：30,000 元 (已繳)，從 Excel 匯入',
    },
    {
        'unitNumber': 'B2-12F',
        'applicationDate': '2025-10-27',
        'constructionStartDate': '2025-11-03',
        'constructionEndDate': '2025-12-03',
        'constructionContent': '施工裝潢',
        'applicantName': '張嘉升',
        'applicantPhone': '0939-860-116',
        'status': 'completed',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'refunded',
        'notes': '裝修金：30,000 元 (已退款)，從 Excel 匯入',
    },
    {
        'unitNumber': 'S12',
        'applicationDate': '2025-08-07',
        'constructionStartDate': '2025-08-11',
        'constructionEndDate': '2025-10-31',
        'constructionContent': '施工裝潢',
        'applicantName': '呂建岳',
        'applicantPhone': '0921-176-578',
        'status': 'completed',
        'decorationDeposit': '30,000',
        'decorationDepositStatus': 'paid',
        'notes': '裝修金：30,000 元 (已繳)，從 Excel 匯入',
    },
    {
        'unitNumber': 'B8-5F',
        'applicationDate': '2026-05-23',
        'constructionStartDate': '2026-05-25',
        'constructionEndDate': '2026-05-27',
        'constructionContent': '廚具施工',
        'applicantName': '蕭如祥',
        'applicantPhone': '0919-913-133',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    # 截圖4 (第四頁) - 5筆
    {
        'unitNumber': 'A7-18F',
        'applicationDate': '2026-03-27',
        'constructionStartDate': '2026-03-30',
        'constructionEndDate': '2026-04-02',
        'constructionContent': '系統櫃裝修',
        'applicantName': '陳瑞凱',
        'applicantPhone': '0937-428-501',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'B5-10F',
        'applicationDate': '2026-03-17',
        'constructionStartDate': '2026-03-17',
        'constructionEndDate': '2026-03-17',
        'constructionContent': '木地板鋪設',
        'applicantName': '莊庭嘉',
        'applicantPhone': '0927-363-388',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A9-17F',
        'applicationDate': '2026-03-04',
        'constructionStartDate': '2026-03-16',
        'constructionEndDate': '2026-05-16',
        'constructionContent': '漏水維修延長時間',
        'applicantName': '郝俊智',
        'applicantPhone': '0982-871-531',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A6-4F',
        'applicationDate': '2026-02-21',
        'constructionStartDate': '2026-02-23',
        'constructionEndDate': '2026-03-10',
        'constructionContent': '系統櫃、油漆',
        'applicantName': '劉易榮',
        'applicantPhone': '0982-871-531',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A3-8F',
        'applicationDate': '2026-01-22',
        'constructionStartDate': '2026-01-26',
        'constructionEndDate': '2026-02-19',
        'constructionContent': '卡扣地板',
        'applicantName': '莊曜嘉',
        'applicantPhone': '0930-508-653',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    # 截圖5 (第五頁) - 4筆
    {
        'unitNumber': 'A6-8F',
        'applicationDate': '2026-05-15',
        'constructionStartDate': '2026-05-18',
        'constructionEndDate': '2026-06-19',
        'constructionContent': '浴室翻修',
        'applicantName': '陳雅慧',
        'applicantPhone': '0933-311-039',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A9-6F',
        'applicationDate': '2026-05-12',
        'constructionStartDate': '2026-05-13',
        'constructionEndDate': '2026-05-13',
        'constructionContent': '油漆',
        'applicantName': '劉懿萱',
        'applicantPhone': '0919-647-599',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'B3-7F',
        'applicationDate': '2026-05-02',
        'constructionStartDate': '2026-05-22',
        'constructionEndDate': '2026-05-22',
        'constructionContent': '冷氣安裝',
        'applicantName': '王姿雅',
        'applicantPhone': '0920-691-790',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
    {
        'unitNumber': 'A9-16F',
        'applicationDate': '2026-04-12',
        'constructionStartDate': '2026-04-13',
        'constructionEndDate': '2026-05-13',
        'constructionContent': '泥作',
        'applicantName': '王瑋翰',
        'applicantPhone': '0977-079-571',
        'status': 'completed',
        'decorationDeposit': None,
        'decorationDepositStatus': 'notPaid',
        'notes': '從 Excel 匯入',
    },
]

def main():
    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()
    
    success = 0
    failed = 0
    
    insert_sql = '''
        INSERT INTO renovation_applications (
            "unitNumber", "applicationDate", "constructionStartDate", "constructionEndDate",
            "constructionContent", "applicantName", "applicantPhone",
            "status", "decorationDeposit", "decorationDepositStatus", "notes"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    '''
    
    for i, row in enumerate(data, 1):
        try:
            cur.execute(insert_sql, (
                row['unitNumber'],
                row['applicationDate'],
                row['constructionStartDate'],
                row['constructionEndDate'],
                row['constructionContent'],
                row['applicantName'],
                row['applicantPhone'],
                row['status'],
                row['decorationDeposit'],
                row['decorationDepositStatus'],
                row['notes'],
            ))
            status_emoji = {'pending': '⏳', 'approved': '✅', 'completed': '🔵', 'rejected': '❌'}
            emoji = status_emoji.get(row['status'], '?')
            print(f"  [{i}] {row['unitNumber']} - {row['constructionContent']} ({row['applicantName']}) -> {row['status']} {emoji}")
            success += 1
        except Exception as e:
            print(f"  [{i}] FAILED: {row['unitNumber']} - {e}")
            failed += 1
    
    conn.commit()
    
    # Verify
    cur.execute('SELECT COUNT(*) FROM renovation_applications')
    total = cur.fetchone()[0]
    
    conn.close()
    
    print(f"\n=== 匯入摘要 ===")
    print(f"成功: {success}")
    print(f"失敗: {failed}")
    print(f"總計: {success + failed}")
    print(f"資料庫中總計: {total} 筆")
    print("Done!")

if __name__ == '__main__':
    main()
