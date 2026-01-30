#!/bin/bash
# Fix rsvpService.test.ts to use mockFrom pattern

FILE="services/rsvpService.test.ts"
BACKUP="services/rsvpService.test.ts.backup"

# Create backup
cp "$FILE" "$BACKUP"

# Create a temporary Python script to do the complex replacements
cat > /tmp/fix_rsvp.py << 'PYTHON_SCRIPT'
import re

with open('services/rsvpService.test.ts', 'r') as f:
    content = f.read()

# Fix simple single() mocks with data
content = re.sub(
    r'(\s+)mockSupabase\.single\.mockResolvedValue\(\{\s*data: ([^,]+),\s*error: null,?\s*\}\);',
    r'\1const mockSingle = jest.fn().mockResolvedValue({ data: \2, error: null });\n\1const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });\n\1const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });\n\1mockFrom.mockReturnValue({ insert: mockInsert });',
    content
)

# Fix single() mocks with error
content = re.sub(
    r'(\s+)mockSupabase\.single\.mockResolvedValue\(\{\s*data: null,\s*error: ([^}]+\}),?\s*\}\);',
    r'\1const mockSingle = jest.fn().mockResolvedValue({ data: null, error: \2 });\n\1const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });\n\1const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });\n\1mockFrom.mockReturnValue({ insert: mockInsert });',
    content
)

# Fix delete mocks
content = re.sub(
    r'(\s+)mockSupabase\.delete\.mockResolvedValue\(\{\s*error: ([^}]+),?\s*\}\);',
    r'\1const mockDelete = jest.fn().mockResolvedValue({ error: \2 });\n\1mockFrom.mockReturnValue({ delete: mockDelete });',
    content
)

# Fix order mocks
content = re.sub(
    r'(\s+)mockSupabase\.order\.mockResolvedValue\(\{([^}]+)\}\);',
    r'\1const mockOrder = jest.fn().mockResolvedValue({\2});\n\1const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });\n\1mockFrom.mockReturnValue({ select: mockSelect });',
    content
)

# Fix mockSupabase.eq calls
content = re.sub(r'mockSupabase\.eq\(', r'mockFrom.mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }); // ', content)

# Fix mockSupabase.insert calls in expectations
content = re.sub(r'expect\(mockSupabase\.insert\)', r'expect(mockFrom().insert)', content)
content = re.sub(r'expect\(mockSupabase\.update\)', r'expect(mockFrom().update)', content)

with open('services/rsvpService.test.ts', 'w') as f:
    f.write(content)

print("Fixed rsvpService.test.ts")
PYTHON_SCRIPT

python3 /tmp/fix_rsvp.py

echo "Done! Running tests to verify..."
npx jest services/rsvpService.test.ts --no-coverage 2>&1 | head -50
