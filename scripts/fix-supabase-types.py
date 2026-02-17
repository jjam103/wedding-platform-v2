#!/usr/bin/env python3
"""
Script to add type assertions to Supabase query results in test files.
Fixes "Property does not exist on type 'never'" errors.
"""

import re
import sys
from pathlib import Path

def fix_supabase_types(file_path):
    """Add (as any) type assertions to Supabase query results."""
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: data?.property -> (data as any)?.property
    # But only for common Supabase result variables
    result_vars = ['data', 'guest', 'token', 'settings', 'updated', 'admin', 'history', 'template', 'owner', 'result', 'usedToken', 'unusedToken', 'deletedToken', 'updatedHistory', 'updatedAdmin', 'tempGuest', 'oldToken']
    
    for var in result_vars:
        # Fix optional chaining: var?.prop
        content = re.sub(
            rf'\b({var})\?\.([\w_]+)',
            r'(\1 as any)?.\2',
            content
        )
        
        # Fix non-null assertion: var!.prop
        content = re.sub(
            rf'\b({var})!\.([\w_]+)',
            r'(\1 as any)!.\2',
            content
        )
    
    # Pattern 2: .insert(...) calls - cast to any
    content = re.sub(
        r'\.insert\((\{[^}]+\})\)',
        r'.insert(\1 as any)',
        content
    )
    
    # Pattern 3: .update(...) calls - cast to any
    content = re.sub(
        r'\.update\((\{[^}]+\})\)',
        r'.update(\1 as any)',
        content
    )
    
    # Pattern 4: .rpc(...) calls - cast args to any
    content = re.sub(
        r'\.rpc\(\s*[\'"]([^\'\"]+)[\'\"],\s*(\{[^}]+\})\s*\)',
        r'.rpc(\'\1\', \2 as any)',
        content
    )
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    # Files with the most Supabase type errors
    files = [
        "__tests__/integration/authMethodMigrations.integration.test.ts",
        "__tests__/regression/authMethodMigrations.regression.test.ts",
        "__tests__/property/authMethodValidation.property.test.ts",
        "__tests__/integration/slugGeneration.integration.test.ts",
        "__tests__/integration/guestContentApi.integration.test.ts",
        "__tests__/integration/authMethodManagement.integration.test.ts",
        "__tests__/integration/inlineRSVPApi.integration.test.ts",
        "__tests__/integration/contentPagesApi.integration.test.ts",
        "__tests__/integration/b2Storage.integration.test.ts",
        "__tests__/regression/photoStorage.regression.test.ts",
        "__tests__/regression/rsvpCapacity.regression.test.ts",
        "__tests__/regression/financialCalculations.regression.test.ts",
    ]
    
    fixed_count = 0
    for file_path in files:
        path = Path(file_path)
        if path.exists():
            if fix_supabase_types(path):
                print(f"✓ Fixed {file_path}")
                fixed_count += 1
            else:
                print(f"- No changes needed for {file_path}")
        else:
            print(f"✗ File not found: {file_path}")
    
    print(f"\nFixed {fixed_count} files")
    print("Run 'npx tsc --noEmit | wc -l' to check remaining errors")

if __name__ == '__main__':
    main()
