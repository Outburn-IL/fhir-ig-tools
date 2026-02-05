#!/usr/bin/env node

import { readSushiConfig } from "../lib/utils.js";

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-validate-config [options]

Validates sushi-config.yaml for common issues

Options:
  -h, --help         Display this help message

Checks performed:
   Dependency versions are locked (not 'latest' or ranges)
   Required fields are present (id, version, publisher, etc.)
   Jurisdiction is set for publication
   Contact information is complete

Exit codes:
  0 - Configuration is valid
  1 - Configuration has issues

Examples:
  fhir-validate-config
`);
    process.exit(0);
}

const validateConfig = () => {
    console.log(' Validating sushi-config.yaml...\n');
    
    const config = readSushiConfig();
    const issues = [];
    const warnings = [];
    
    // Check required fields
    if (!config.id) issues.push('Missing required field: id');
    if (!config.version) issues.push('Missing required field: version');
    if (!config.publisher) warnings.push('Missing recommended field: publisher');
    if (!config.contact || config.contact.length === 0) {
        warnings.push('Missing recommended field: contact');
    }
    if (!config.jurisdiction || config.jurisdiction.length === 0) {
        warnings.push('Missing recommended field: jurisdiction (required for publication)');
    }
    
    // Check dependency versions
    if (config.dependencies) {
        Object.entries(config.dependencies).forEach(([pkg, versionInfo]) => {
            const version = typeof versionInfo === 'string' ? versionInfo : versionInfo.version;
            
            if (version === 'latest' || version === 'current') {
                issues.push(`Dependency "${pkg}" uses "${version}" - must use exact version for publication`);
            } else if (version.includes('x') || version.includes('*') || version.startsWith('^') || version.startsWith('~')) {
                issues.push(`Dependency "${pkg}" uses version range "${version}" - must use exact version for publication`);
            }
        });
    }
    
    // Report results
    console.log('='.repeat(60));
    
    if (issues.length > 0) {
        console.log(' ISSUES FOUND:\n');
        issues.forEach(issue => console.log(`    ${issue}`));
        console.log('');
    }
    
    if (warnings.length > 0) {
        console.log('  WARNINGS:\n');
        warnings.forEach(warning => console.log(`    ${warning}`));
        console.log('');
    }
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log(' Configuration is valid\n');
    }
    
    console.log('='.repeat(60));
    
    if (issues.length > 0) {
        process.exit(1);
    }
};

validateConfig();
