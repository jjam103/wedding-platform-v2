#!/bin/bash

# E2E Test Progress Monitor
# Checks test progress every 30 minutes and updates status

RESULTS_FILE="test-results/e2e-results.json"
MONITOR_FILE="E2E_FEB15_2026_PROGRESS_MONITOR.md"
UPDATE_INTERVAL=1800  # 30 minutes in seconds

echo "🔍 E2E Test Progress Monitor Started"
echo "Checking every 30 minutes..."
echo ""

update_count=1

while true; do
  # Check if process is still running
  if ps aux | grep -q "[p]laywright test"; then
    process_status="✅ Running"
  else
    process_status="❌ Stopped"
  fi
  
  # Check if results file exists
  if [ -f "$RESULTS_FILE" ]; then
    # Count passing and failing tests
    passing=$(grep -o '"ok": true' "$RESULTS_FILE" 2>/dev/null | wc -l | tr -d ' ')
    failing=$(grep -o '"ok": false' "$RESULTS_FILE" 2>/dev/null | wc -l | tr -d ' ')
    total=$((passing + failing))
    
    if [ $total -gt 0 ]; then
      percentage=$((total * 100 / 362))
      pass_rate=$((passing * 100 / total))
    else
      percentage=0
      pass_rate=0
    fi
    
    results_status="📊 $total/362 tests ($percentage%)"
    pass_status="✅ $passing passing ($pass_rate%)"
    fail_status="❌ $failing failing"
  else
    results_status="⏳ Results file not created yet"
    pass_status="N/A"
    fail_status="N/A"
  fi
  
  # Get current time
  current_time=$(date "+%H:%M:%S")
  
  # Display update
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Update #$update_count - $current_time"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Process: $process_status"
  echo "Progress: $results_status"
  echo "Passing: $pass_status"
  echo "Failing: $fail_status"
  echo ""
  
  # Update monitor file
  cat > "$MONITOR_FILE" << EOF
# E2E Production Test - Progress Monitor

**Last Updated**: $current_time  
**Status**: $process_status

---

## Quick Status

- **Process**: $process_status
- **Server**: Production build on port 3000
- **Workers**: 1 (sequential)
- **Total Tests**: 362
- **Progress**: $results_status
- **Pass Rate**: $pass_status

---

## Current Results

- **Passing**: $pass_status
- **Failing**: $fail_status
- **Completion**: $percentage%

---

## Progress Updates

### Update #$update_count - $current_time
- **Status**: $process_status
- **Progress**: $results_status
- **Passing**: $pass_status
- **Failing**: $fail_status

---

## How to Check Progress Manually

### View Live Test Execution
\`\`\`bash
# Check if process is still running
ps aux | grep playwright

# View recent output
tail -f test-results/e2e-results.json 2>/dev/null || echo "Results file not created yet"
\`\`\`

### Check Test Count
\`\`\`bash
# Count completed tests (when results file exists)
grep -o '"ok": true' test-results/e2e-results.json 2>/dev/null | wc -l
grep -o '"ok": false' test-results/e2e-results.json 2>/dev/null | wc -l
\`\`\`

### View HTML Report (After Completion)
\`\`\`bash
npx playwright show-report
\`\`\`

---

## Expected Timeline

- **Start**: Current
- **25% Complete**: ~30 minutes from start (~90 tests)
- **50% Complete**: ~1 hour from start (~181 tests)
- **75% Complete**: ~1.5 hours from start (~271 tests)
- **100% Complete**: ~2.1 hours from start (362 tests)

---

## What to Watch For

### Good Signs
- ✅ Process still running
- ✅ Test results file being created
- ✅ Pass count increasing
- ✅ No server crashes

### Warning Signs
- ⚠️ Process stopped unexpectedly
- ⚠️ Server not responding
- ⚠️ High failure rate (>50%)
- ⚠️ Tests taking much longer than expected

---

## Next Update

Will provide update in ~30 minutes
EOF
  
  # Check if process stopped
  if [ "$process_status" = "❌ Stopped" ]; then
    echo "⚠️  Process has stopped!"
    echo "Check E2E_FEB15_2026_WHEN_TESTS_COMPLETE.md for next steps"
    break
  fi
  
  # Wait for next update
  echo "⏰ Next update in 30 minutes..."
  echo ""
  
  update_count=$((update_count + 1))
  sleep $UPDATE_INTERVAL
done

echo "Monitor stopped."
