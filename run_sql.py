import psycopg2

conn_str = "postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

print("Connecting to database...")
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

print("Executing SQL...")
with open("/tmp/rm_test/create_tables.sql", "r") as f:
    sql = f.read()

try:
    cur.execute(sql)
    print("SUCCESS: All tables created!")
    
    # Verify
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")
    tables = cur.fetchall()
    print("\nAll tables in database:")
    for t in tables:
        print(f"  - {t[0]}")
except Exception as e:
    print(f"ERROR: {e}")

cur.close()
conn.close()
print("\nDone!")
