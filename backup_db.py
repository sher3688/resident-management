#!/usr/bin/env python3
"""
Database Backup Script
Exports all tables from Neon PostgreSQL to JSON files.
Stores backups locally with timestamp.
"""

import psycopg2
import psycopg2.extras
import json
import os
import sys
from datetime import datetime, timezone, date

# Database connection
DB_URL = "postgresql://neondb_owner:npg_knpNu8lB2FWR@ep-dry-glade-azg6pbwu-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Backup directory
BACKUP_DIR = "/tmp/rm_test/backups"

def get_all_tables(conn):
    """Get list of all tables in the database."""
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cur.fetchall()]
    cur.close()
    return tables

def export_table(conn, table_name):
    """Export a single table to list of dicts."""
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f'SELECT * FROM "{table_name}"')
    rows = cur.fetchall()
    cur.close()
    
    # Convert datetime objects to ISO format strings
    result = []
    for row in rows:
        row_dict = dict(row)
        for key, value in row_dict.items():
            if hasattr(value, 'isoformat'):
                row_dict[key] = value.isoformat()
        result.append(row_dict)
    return result

def run_backup():
    """Run full database backup."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"backup_{timestamp}")
    
    os.makedirs(backup_path, exist_ok=True)
    
    print(f"[{timestamp}] Starting database backup...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        tables = get_all_tables(conn)
        
        backup_summary = {
            "timestamp": timestamp,
            "total_tables": len(tables),
            "tables": {}
        }
        
        for table in tables:
            try:
                data = export_table(conn, table)
                filename = f"{table}.json"
                filepath = os.path.join(backup_path, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                backup_summary["tables"][table] = len(data)
                print(f"  ✅ {table}: {len(data)} rows exported")
            except Exception as e:
                print(f"  ❌ {table}: Error - {e}")
                backup_summary["tables"][table] = f"ERROR: {e}"
        
        conn.close()
        
        # Write summary
        summary_path = os.path.join(backup_path, "_summary.json")
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(backup_summary, f, ensure_ascii=False, indent=2)
        
        # Also save to latest_backup directory for easy access
        import shutil
        latest_path = os.path.join(BACKUP_DIR, "latest_backup")
        if os.path.exists(latest_path):
            shutil.rmtree(latest_path)
        shutil.copytree(backup_path, latest_path)
        
        print(f"\n✅ Backup completed successfully!")
        print(f"   Location: {backup_path}")
        print(f"   Latest:   {latest_path}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Backup failed: {e}")
        return False

if __name__ == "__main__":
    success = run_backup()
    sys.exit(0 if success else 1)
