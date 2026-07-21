import psycopg2

conn = psycopg2.connect('postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')
cur = conn.cursor()

# Create system_settings table
cur.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        id serial PRIMARY KEY,
        key varchar(64) NOT NULL UNIQUE,
        value text NOT NULL,
        description text,
        updated_at timestamp with time zone DEFAULT NOW()
    )
""")
conn.commit()
print("✅ system_settings 表已建立")

# Insert the regulation PDF URL
cur.execute("""
    INSERT INTO system_settings (key, value, description)
    VALUES (%s, %s, %s)
    ON CONFLICT (key) DO UPDATE SET value = %s, updated_at = NOW()
""", (
    'regulation_pdf_url',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/uXjZAyFbVclALdhK.pdf',
    '住戶管理規約 PDF 網址',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/uXjZAyFbVclALdhK.pdf'
))
conn.commit()
print("✅ 規約 PDF 網址已存入")

# Verify
cur.execute("SELECT key, value, description FROM system_settings")
for row in cur.fetchall():
    print(f"   {row[0]}: {row[2]} -> {row[1][:80]}...")

conn.close()
