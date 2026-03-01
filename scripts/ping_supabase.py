#!/usr/bin/env python3
"""
Supabase Keep-Alive Script
Pings Supabase database every 2 days to prevent project pausing due to inactivity.
"""

import os
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests


def ping_supabase():
    """Ping Supabase to keep the project active."""
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        sys.exit(1)
    
    # Remove trailing slash if present
    supabase_url = supabase_url.rstrip("/")
    
    # Ping the REST API endpoint
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Simple health check - query the profiles table (or any table)
        response = requests.get(
            f"{supabase_url}/rest/v1/profiles?select=id&limit=1",
            headers=headers,
            timeout=30
        )
        
        timestamp = datetime.utcnow().isoformat()
        
        if response.status_code in [200, 206]:
            print(f"[{timestamp}] ✅ Supabase ping successful! Status: {response.status_code}")
            return True
        else:
            print(f"[{timestamp}] ⚠️ Supabase responded with status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return True  # Still counts as activity
            
    except requests.exceptions.RequestException as e:
        timestamp = datetime.utcnow().isoformat()
        print(f"[{timestamp}] ❌ Failed to ping Supabase: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 50)
    print("Quietude - Supabase Keep-Alive")
    print("=" * 50)
    ping_supabase()
    print("=" * 50)
