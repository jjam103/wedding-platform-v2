#!/usr/bin/env python3
import re
import sys

def fix_mock_resolved_value(content):
    """Fix mockResolvedValue calls by adding 'as any' type assertion"""
    # Pattern: mockResolvedValue({ ... });
    # Replace with: mockResolvedValue({ ... } as any);
    
    lines = content.split('\n')
    result = []
    in_mock_resolved = False
    brace_count = 0
    
    for i, line in enumerate(lines):
        if '.mockResolvedValue({' in line:
            in_mock_resolved = True
            brace_count = line.count('{') - line.count('}')
            result.append(line)
        elif in_mock_resolved:
            brace_count += line.count('{') - line.count('}')
            if brace_count == 0 and line.strip() == '});':
                # This is the closing line
                result.append(line.replace('});', '} as any);'))
                in_mock_resolved = False
            else:
                result.append(line)
        else:
            result.append(line)
    
    return '\n'.join(result)

if __name__ == '__main__':
    filename = sys.argv[1]
    with open(filename, 'r') as f:
        content = f.read()
    
    fixed_content = fix_mock_resolved_value(content)
    
    with open(filename, 'w') as f:
        f.write(fixed_content)
    
    print(f"Fixed {filename}")
