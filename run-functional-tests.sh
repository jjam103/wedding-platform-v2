#!/bin/bash

echo "=== FUNCTIONAL AREA TEST REPORT ==="
echo "Date: $(date)"
echo ""

# Function to run tests and capture results
run_test_area() {
    local area_name="$1"
    local pattern="$2"
    
    echo "Testing: $area_name"
    echo "Pattern: $pattern"
    
    npm run test:quick -- --testPathPattern="$pattern" --passWithNoTests --silent 2>&1 | \
        grep -E "(Test Suites:|Tests:|Time:)" | head -3
    
    echo ""
}

# 1. Core Services
run_test_area "Core Services" "services/(guestService|rsvpService|eventService|activityService)\.test"

# 2. Content Services  
run_test_area "Content Services" "services/(contentPagesService|sectionsService|photoService|gallerySettingsService)\.test"

# 3. Auth Services
run_test_area "Auth Services" "services/(adminUserService|emailService)\.test"

# 4. Support Services
run_test_area "Support Services" "services/(accommodationService|locationService|budgetService|transportationService)\.test"

# 5. Admin Components
run_test_area "Admin Components" "components/admin/.*\.test"

# 6. Guest Components
run_test_area "Guest Components" "components/guest/.*\.test"

# 7. UI Components
run_test_area "UI Components" "components/ui/.*\.test"

# 8. Integration Tests
run_test_area "Integration Tests" "__tests__/integration/.*\.test"

# 9. E2E Tests (skip - requires server)
echo "E2E Tests: SKIPPED (requires running server)"
echo ""

# 10. Regression Tests
run_test_area "Regression Tests" "__tests__/regression/.*\.test"

# 11. Accessibility Tests
run_test_area "Accessibility Tests" "__tests__/accessibility/.*\.test"

echo "=== TEST RUN COMPLETE ==="
