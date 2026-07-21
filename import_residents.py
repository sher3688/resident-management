import csv
import psycopg2
import json
from datetime import datetime

conn_str = "postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

print("Connecting to database...")
conn = psycopg2.connect(conn_str)
conn.autocommit = False
cur = conn.cursor()

print("Reading CSV file...")
with open('/home/ubuntu/upload/residents_2026-07-21(2).csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter='\t')
    rows = list(reader)

headers = rows[0]
data_rows = rows[1:]
print(f"Total data rows: {len(data_rows)}")

# Map headers to column indices
header_map = {h: i for i, h in enumerate(headers)}

# Column mapping: CSV header -> DB column (same names)
db_columns = [
    'unitNumber', 'ownerName', 'ownerPhone', 'address',
    'coResident1Name', 'coResident1Phone', 'coResident2Name', 'coResident2Phone',
    'coResident3Name', 'coResident3Phone', 'coResident4Name', 'coResident4Phone',
    'carParkingNumber', 'carPlateNumber', 'motorcycleParkingNumber', 'motorcyclePlateNumber',
    'bicycleParkingNumber', 'squareMeters', 'waterMeterNumber', 'electricityMeterNumber',
    'moveInDate', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
    'emergencyContact2Name', 'emergencyContact2Phone', 'emergencyContact2Relation',
    'emergencyContact2Address', 'notes'
]

success_count = 0
error_count = 0
errors = []

print("Importing residents...")
for i, row in enumerate(data_rows):
    try:
        # Extract values using header map
        values = {}
        for col in db_columns:
            idx = header_map.get(col)
            if idx is not None and idx < len(row):
                val = row[idx].strip() if row[idx] else None
                values[col] = val if val else None
        
        # Handle moveInDate - convert to date or null
        move_in_date = values.get('moveInDate')
        if move_in_date:
            # Try to parse as date
            try:
                datetime.strptime(move_in_date, '%Y-%m-%d')
            except ValueError:
                move_in_date = None
        values['moveInDate'] = move_in_date
        
        # Skip rows with empty unitNumber
        if not values.get('unitNumber'):
            print(f"  Skipping row {i+1}: empty unitNumber")
            continue
        
        # Check if unitNumber already exists
        cur.execute("SELECT id FROM residents WHERE \"unitNumber\" = %s", (values['unitNumber'],))
        existing = cur.fetchone()
        if existing:
            print(f"  Skipping row {i+1}: unitNumber {values['unitNumber']} already exists (id={existing[0]})")
            continue
        
        # Insert into residents table
        col_names = ', '.join([f'"{c}"' for c in db_columns])
        placeholders = ', '.join(['%s'] * len(db_columns))
        sql = f'INSERT INTO residents ({col_names}) VALUES ({placeholders})'
        vals = [values.get(c) for c in db_columns]
        
        cur.execute(sql, vals)
        
        success_count += 1
        if (success_count + error_count) % 50 == 0:
            print(f"  Progress: {success_count + error_count}/{len(data_rows)} (success={success_count}, error={error_count})")
            
    except Exception as e:
        error_count += 1
        unit = row[header_map.get('unitNumber', 1)] if len(row) > 1 else f"row {i+1}"
        errors.append(f"Row {i+1} ({unit}): {str(e)[:200]}")
        print(f"  ERROR row {i+1} ({unit}): {str(e)[:100]}")

conn.commit()
print(f"\n=== Import Summary ===")
print(f"Total rows: {len(data_rows)}")
print(f"Successfully imported: {success_count}")
print(f"Skipped/Errors: {error_count}")

if errors:
    print(f"\nFirst 10 errors:")
    for e in errors[:10]:
        print(f"  {e}")

# Verify
cur.execute("SELECT COUNT(*) FROM residents")
count = cur.fetchone()[0]
print(f"\nTotal residents in database: {count}")

cur.close()
conn.close()
print("\nDone!")
