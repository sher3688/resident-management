#!/usr/bin/env python3
"""匯入資源庫檔案到 Neon PostgreSQL 資料庫"""

import psycopg2

DB_URL = 'postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

# 12個資源庫檔案及其命名
files_data = [
    {
        'name': '004 現場人員離職申請單',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/kzNYYrTGMlazBWYo.pdf',
        'size': 118876,
    },
    {
        'name': '006 現場人員請假單',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/lmcgaVpxMzVCyelt.pdf',
        'size': 130953,
    },
    {
        'name': '管理規章',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/SpYxFFcoZGUAkLKs.pdf',
        'size': 67173,
    },
    {
        'name': '社區規約',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/vqLgnwfxIEJuOmIk.pdf',
        'size': 1034853,
    },
    {
        'name': '住戶規約',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/SISroyDMRkMTXLjh.pdf',
        'size': 29736,
    },
    {
        'name': 'B棟規約',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/BrdNxrmLqZbocJjR.pdf',
        'size': 918100,
    },
    {
        'name': '社區管理辦法',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/ovxvKvhevaOnlZgu.pdf',
        'size': 782823,
    },
    {
        'name': '停車場管理辦法',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/eXxytXxPFWpDoyDZ.pdf',
        'size': 797624,
    },
    {
        'name': '裝修管理規定',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/KtrZNOMqQIOWVfqu.pdf',
        'size': 28497,
    },
    {
        'name': '約談記錄單格式',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/ehpZNXEETVfebQPS.pdf',
        'size': 295737,
    },
    {
        'name': '社區公告格式',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/bFSkKTPvuhcDiglu.pdf',
        'size': 1033879,
    },
    {
        'name': '報修申請表',
        'url': 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/qPPEsvRTpMGyzAYL.pdf',
        'size': 111177,
    },
]

def main():
    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()
    
    # Create a default folder for resources
    cur.execute('INSERT INTO resource_folders ("name", "description") VALUES (%s, %s) RETURNING id',
                ('資源庫', '社區管理相關文件與表單'))
    folder_id = cur.fetchone()[0]
    print(f"Created folder '{folder_id}' (資源庫)")
    
    success = 0
    failed = 0
    
    insert_sql = '''
        INSERT INTO resource_files (
            "folderId", "name", "fileUrl", "fileSize", "fileType"
        ) VALUES (%s, %s, %s, %s, %s)
    '''
    
    for i, f in enumerate(files_data, 1):
        try:
            cur.execute(insert_sql, (
                folder_id,
                f['name'],
                f['url'],
                f['size'],
                'pdf',
            ))
            print(f"  [{i}] {f['name']} ({f['size']} bytes)")
            success += 1
        except Exception as e:
            print(f"  [{i}] FAILED: {f['name']} - {e}")
            failed += 1
    
    conn.commit()
    
    # Verify
    cur.execute('SELECT COUNT(*) FROM resource_files')
    total_files = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM resource_folders')
    total_folders = cur.fetchone()[0]
    
    conn.close()
    
    print(f"\n=== 匯入摘要 ===")
    print(f"成功: {success}")
    print(f"失敗: {failed}")
    print(f"資料夾: {total_folders} 個")
    print(f"檔案總計: {total_files} 個")
    print("Done!")

if __name__ == '__main__':
    main()
