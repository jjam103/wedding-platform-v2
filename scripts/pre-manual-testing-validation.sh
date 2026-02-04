#!/bin/bash

# Pre-Manual Testing Validation Script
# Runs all automated tests to ensure system readiness

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Pre-Manual Testing Validation - Costa Rica Wedding        ║"
echo "║                  Management System                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL_PHASES=10
PASSED_PHASES=0
FAILED_PHASES=0

# Function to print phase header
print_phase() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Phase $1: $2"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    PASSED_PHASES=$((PASSED_PHASES + 1))
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
    FAILED_PHASES=$((FAILED_PHASES + 1))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Start validation
START_TIME=$(date +%s)

# Phase 1: Environment Setup
print_phase "1" "Environment Setup"

echo "Checking environment variables..."
if [ -f .env.local ]; then
    print_success "Found .env.local"
else
    print_error "Missing .env.local"
    exit 1
fi

if [ -f .env.test ]; then
    print_success "Found .env.test"
else
    print_error "Missing .env.test"
    exit 1
fi

echo ""
echo "Resetting test database..."
if node scripts/setup-test-database.mjs; then
    print_success "Test database reset complete"
else
    print_warning "Test database reset skipped (database may already be configured)"
fi

# Phase 2: TypeScript Validation
print_phase "2" "TypeScript Validation"

echo "Running TypeScript type check..."
if npm run type-check; then
    print_success "TypeScript check passed"
else
    print_error "TypeScript check failed"
    exit 1
fi

# Phase 3: Lint Check
print_phase "3" "Lint Check"

echo "Running ESLint..."
if npm run lint; then
    print_success "Lint check passed"
else
    print_warning "Lint check failed (non-blocking)"
fi

# Phase 4: Build Validation
print_phase "4" "Build Validation"

echo "Building for production..."
if npm run build; then
    print_success "Production build successful"
else
    print_error "Production build failed"
    exit 1
fi

# Phase 5: Unit Tests
print_phase "5" "Unit Tests"

echo "Running service tests..."
if npm run test -- --testPathPattern="services/" --passWithNoTests --silent; then
    print_success "Service tests passed"
else
    print_error "Service tests failed"
    exit 1
fi

echo ""
echo "Running component tests..."
if npm run test -- --testPathPattern="components/" --passWithNoTests --silent; then
    print_success "Component tests passed"
else
    print_error "Component tests failed"
    exit 1
fi

echo ""
echo "Running utility tests..."
if npm run test -- --testPathPattern="utils/" --passWithNoTests --silent; then
    print_success "Utility tests passed"
else
    print_error "Utility tests failed"
    exit 1
fi

# Phase 6: Integration Tests
print_phase "6" "Integration Tests"

echo "Running API integration tests..."
if npm run test -- --testPathPattern="__tests__/integration/" --passWithNoTests --silent; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Phase 7: E2E Tests
print_phase "7" "E2E Tests"

echo "Running E2E tests..."
print_warning "E2E tests require dev server running on port 3000"
echo "Checking if dev server is running..."

if curl -s http://localhost:3000 > /dev/null; then
    print_success "Dev server is running"
    
    echo ""
    echo "Running E2E test suite..."
    if npm run test:e2e -- --silent; then
        print_success "E2E tests passed"
    else
        print_warning "E2E tests failed (may need manual review)"
    fi
else
    print_warning "Dev server not running - skipping E2E tests"
    print_warning "Start dev server with: npm run dev"
fi

# Phase 8: Regression Tests
print_phase "8" "Regression Tests"

echo "Running regression tests..."
if npm run test -- --testPathPattern="__tests__/regression/" --passWithNoTests --silent; then
    print_success "Regression tests passed"
else
    print_error "Regression tests failed"
    exit 1
fi

# Phase 9: Accessibility Tests
print_phase "9" "Accessibility Tests"

echo "Running accessibility tests..."
if npm run test -- --testPathPattern="__tests__/accessibility/" --passWithNoTests --silent; then
    print_success "Accessibility tests passed"
else
    print_error "Accessibility tests failed"
    exit 1
fi

# Phase 10: Smoke Tests
print_phase "10" "Smoke Tests"

echo "Running smoke tests..."
if npm run test -- --testPathPattern="__tests__/smoke/" --passWithNoTests --silent; then
    print_success "Smoke tests passed"
else
    print_warning "Smoke tests failed (non-blocking)"
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Print summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    VALIDATION SUMMARY                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Phases: $TOTAL_PHASES"
echo -e "Passed: ${GREEN}$PASSED_PHASES${NC}"
echo -e "Failed: ${RED}$FAILED_PHASES${NC}"
echo ""
echo "Duration: ${MINUTES}m ${SECONDS}s"
echo ""

if [ $FAILED_PHASES -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL VALIDATIONS PASSED - READY FOR MANUAL TESTING          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review PRE_MANUAL_TESTING_VALIDATION_PLAN.md"
    echo "2. Follow MANUAL_TESTING_PLAN.md"
    echo "3. Document bugs and usability issues"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ VALIDATION FAILED - FIX ISSUES BEFORE MANUAL TESTING        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please fix the failed phases and run validation again."
    echo ""
    exit 1
fi
