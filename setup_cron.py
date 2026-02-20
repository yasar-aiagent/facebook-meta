#!/usr/bin/env python3
import os
from pathlib import Path

def create_cron_script():
    project_dir = Path.cwd().absolute()
    
    script_content = f"""#!/bin/bash
# Weekly Video Analysis Cron Job

cd {project_dir}

# Create logs directory
mkdir -p logs

# Set Python path
export PYTHONPATH="{project_dir}:$PYTHONPATH"

# Log file
LOG_FILE="logs/weekly_analysis_$(date +%Y%m%d_%H%M%S).log"

echo "========================================" >> "$LOG_FILE"
echo "Started at: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run from correct location
python3 server/analysis/weekly_analysis.py >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "Finished at: $(date)" >> "$LOG_FILE"
echo "Exit code: $EXIT_CODE" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Keep only last 30 days
find logs -name "weekly_analysis_*.log" -mtime +30 -delete

exit $EXIT_CODE
"""
    
    script_path = project_dir / "run_weekly_analysis.sh"
    with open(script_path, 'w') as f:
        f.write(script_content)
    os.chmod(script_path, 0o755)
    
    print(f"✅ Created: {script_path}")
    print(f"\n📋 NEXT STEPS:")
    print(f"\n1️⃣  TEST IT:")
    print(f"   {script_path}")
    print(f"\n2️⃣  ADD TO CRON:")
    print(f"   env EDITOR=nano crontab -e")
    print(f"\n   Add this line:")
    print(f"   0 2 * * 0 {script_path}")
    print(f"\n3️⃣  VERIFY:")
    print(f"   crontab -l")
    print(f"\n4️⃣  VIEW LOGS:")
    print(f"   tail -f {project_dir}/logs/weekly_analysis_*.log\n")

if __name__ == '__main__':
    create_cron_script()
