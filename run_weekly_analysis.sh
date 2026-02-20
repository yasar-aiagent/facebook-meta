#!/bin/bash
# Weekly Video Analysis Cron Job

cd /Users/yass/Downloads/react-tailwind-starter 29-12-25

# Create logs directory
mkdir -p logs

# Set Python path
export PYTHONPATH="/Users/yass/Downloads/react-tailwind-starter 29-12-25:$PYTHONPATH"

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
