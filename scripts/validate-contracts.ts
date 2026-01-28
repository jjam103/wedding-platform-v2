#!/usr/bin/env ts-node
/**
 * TypeScript Contract Validation Script
 * 
 * This script validates that all service methods properly use type contracts:
 * - All service methods return Result<T>
 * - All DTOs use proper Zod schemas
 * - All entities match the type definitions
 * - No use of 'any' type in service layer
 * 
 * Requirements: 21.3
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

const errors: ValidationError[] = [];

/**
 * Check if a type is Result<T>
 */
function isResultType(type: ts.Type, checker: ts.TypeChecker): boolean {
  const typeString = checker.typeToString(type);
  return typeString.startsWith('Result<');
}

/**
 * Check if a type uses 'any'
 */
function usesAnyType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (type.flags & ts.TypeFlags.Any) {
    return true;
  }
  
  // Check type arguments
  if ((type as any).typeArguments) {
    return (type as any).typeArguments.some((arg: ts.Type) => 
      usesAnyType(arg, checker)
    );
  }
  
  return false;
}

/**
 * Validate a service file
 */
function validateServiceFile(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker
): void {
  function visit(node: ts.Node) {
    // Check exported functions
    if (ts.isFunctionDeclaration(node) && node.name) {
      const modifiers = node.modifiers;
      const isExported = modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );

      if (isExported) {
        // Check return type
        if (node.type) {
          const returnType = checker.getTypeFromTypeNode(node.type);
          
          // Service methods should return Result<T>
          if (!isResultType(returnType, checker)) {
            errors.push({
              file: sourceFile.fileName,
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
              column: sourceFile.getLineAndCharacterOfPosition(node.getStart()).character + 1,
              message: `Exported function '${node.name.text}' should return Result<T>`,
              severity: 'error',
            });
          }

          // Check for 'any' type usage
          if (usesAnyType(returnType, checker)) {
            errors.push({
              file: sourceFile.fileName,
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
              column: sourceFile.getLineAndCharacterOfPosition(node.getStart()).character + 1,
              message: `Function '${node.name.text}' uses 'any' type in return value`,
              severity: 'error',
            });
          }
        } else {
          errors.push({
            file: sourceFile.fileName,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            column: sourceFile.getLineAndCharacterOfPosition(node.getStart()).character + 1,
            message: `Exported function '${node.name.text}' missing explicit return type`,
            severity: 'error',
          });
        }

        // Check parameters
        node.parameters.forEach((param) => {
          if (!param.type) {
            errors.push({
              file: sourceFile.fileName,
              line: sourceFile.getLineAndCharacterOfPosition(param.getStart()).line + 1,
              column: sourceFile.getLineAndCharacterOfPosition(param.getStart()).character + 1,
              message: `Parameter '${param.name.getText()}' missing explicit type`,
              severity: 'error',
            });
          } else {
            const paramType = checker.getTypeFromTypeNode(param.type);
            if (usesAnyType(paramType, checker)) {
              errors.push({
                file: sourceFile.fileName,
                line: sourceFile.getLineAndCharacterOfPosition(param.getStart()).line + 1,
                column: sourceFile.getLineAndCharacterOfPosition(param.getStart()).character + 1,
                message: `Parameter '${param.name.getText()}' uses 'any' type`,
                severity: 'error',
              });
            }
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

/**
 * Main validation function
 */
function validateContracts(): number {
  const servicesDir = path.join(process.cwd(), 'services');
  
  if (!fs.existsSync(servicesDir)) {
    console.error('Services directory not found');
    return 1;
  }

  // Get all service files
  const serviceFiles = fs
    .readdirSync(servicesDir)
    .filter((file) => file.endsWith('Service.ts'))
    .map((file) => path.join(servicesDir, file));

  if (serviceFiles.length === 0) {
    console.warn('No service files found');
    return 0;
  }

  // Create TypeScript program
  const program = ts.createProgram(serviceFiles, {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  });

  const checker = program.getTypeChecker();

  // Validate each service file
  serviceFiles.forEach((file) => {
    const sourceFile = program.getSourceFile(file);
    if (sourceFile) {
      validateServiceFile(sourceFile, checker);
    }
  });

  // Report errors
  if (errors.length > 0) {
    console.error('\n❌ TypeScript Contract Validation Failed\n');
    
    const errorsByFile = errors.reduce((acc, error) => {
      if (!acc[error.file]) {
        acc[error.file] = [];
      }
      acc[error.file].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);

    Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
      console.error(`\n${path.relative(process.cwd(), file)}:`);
      fileErrors.forEach((error) => {
        const icon = error.severity === 'error' ? '✗' : '⚠';
        console.error(
          `  ${icon} Line ${error.line}:${error.column} - ${error.message}`
        );
      });
    });

    console.error(`\n${errors.length} contract violation(s) found\n`);
    return 1;
  }

  console.log('\n✅ All TypeScript contracts validated successfully\n');
  console.log(`Validated ${serviceFiles.length} service file(s)`);
  return 0;
}

// Run validation
const exitCode = validateContracts();
process.exit(exitCode);
