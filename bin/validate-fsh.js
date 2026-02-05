#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { getFshInputFolder } from '../lib/utils.js';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-validate-fsh [options]

Validates FSH files for common issues and auto-fixes metadata

Options:
  -h, --help         Display this help message
  --skip-fix         Skip auto-fixing ConformanceMetadata
  --no-color         Disable colored output
  --verbose          Show detailed file-by-file processing

Checks performed:
   Duplicate aliases (multiple aliases  same URL)
   Duplicate URLs (multiple resources  same URL)
   Missing ConformanceMetadata (auto-fixes by default)

Exit codes:
  0 - Success (no errors, only auto-fixes performed)
  1 - Validation errors found (duplicates detected)

Examples:
  fhir-validate-fsh
  fhir-validate-fsh --skip-fix
  fhir-validate-fsh --verbose
`);
    process.exit(0);
}

const skipFix = args.includes('--skip-fix');
const useColor = !args.includes('--no-color');
const verbose = args.includes('--verbose');

const fshFolder = getFshInputFolder();

// Store all aliases and URLs for validation
const aliases = new Map(); // alias -> url
const urlsByAlias = new Map(); // url -> Set of resources using it
const duplicateAliases = [];
const duplicateUrls = [];
const filesFixed = [];

// Color helpers
const color = {
    reset: useColor ? '\x1b[0m' : '',
    bright: useColor ? '\x1b[1m' : '',
    red: useColor ? '\x1b[31m' : '',
    green: useColor ? '\x1b[32m' : '',
    yellow: useColor ? '\x1b[33m' : '',
    blue: useColor ? '\x1b[34m' : '',
};

// Read aliases.fsh file
const readAliases = () => {
    const aliasesPath = path.join(fshFolder, 'aliases.fsh');
    
    if (!fs.existsSync(aliasesPath)) {
        console.log(`${color.yellow}  No aliases.fsh file found${color.reset}`);
        return;
    }
    
    if (verbose) {
        console.log(`${color.blue} Reading aliases.fsh...${color.reset}`);
    }
    const content = fs.readFileSync(aliasesPath, 'utf8');
    const lines = content.split('\n');
    
    const urlToAliases = new Map(); // url -> [alias names]
    
    lines.forEach((line, index) => {
        const aliasMatch = line.match(/^Alias:\s+\$(\S+)\s*=\s*(.+?)(?:\s|$)/);
        if (aliasMatch) {
            const aliasName = aliasMatch[1];
            const url = aliasMatch[2].trim();
            
            // Store alias -> url mapping
            aliases.set('$' + aliasName, url);
            
            // Track url -> aliases for duplicate detection
            if (!urlToAliases.has(url)) {
                urlToAliases.set(url, []);
            }
            urlToAliases.get(url).push('$' + aliasName);
        }
    });
    
    // Check for duplicate URLs in aliases
    urlToAliases.forEach((aliasNames, url) => {
        if (aliasNames.length > 1) {
            duplicateAliases.push({
                url: url,
                aliases: aliasNames,
                file: 'aliases.fsh'
            });
        }
    });
    
    if (verbose) {
        console.log(`   Found ${aliases.size} aliases`);
    }
};

// Process a single FSH file
const processFshFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(fshFolder, filePath);
    
    let resourceType = null;
    let resourceName = null;
    let resourceUrl = null;
    let hasConformanceMetadata = false;
    let needsConformanceMetadata = false;
    
    // Check each line
    lines.forEach((line, index) => {
        // Detect resource type
        const resourceMatch = line.match(/^(Profile|Extension|CodeSystem|ValueSet):\s+(\S+)/);
        if (resourceMatch) {
            resourceType = resourceMatch[1];
            resourceName = resourceMatch[2];
            needsConformanceMetadata = true;
        }
        
        // Check for ConformanceMetadata
        if (line.includes('insert ConformanceMetadata')) {
            hasConformanceMetadata = true;
        }
        
        // Extract URL from ^url = $alias format
        const urlMatch = line.match(/\*\s*\^url\s*=\s*(\$\S+)/);
        if (urlMatch) {
            const urlAlias = urlMatch[1];
            
            // Resolve alias to actual URL
            const actualUrl = aliases.get(urlAlias) || urlAlias;
            resourceUrl = actualUrl;
            
            // Track URL usage
            if (!urlsByAlias.has(actualUrl)) {
                urlsByAlias.set(actualUrl, new Set());
            }
            urlsByAlias.get(actualUrl).add({
                file: relativePath,
                resource: resourceName,
                alias: urlAlias
            });
        }
    });
    
    // Check if ConformanceMetadata is needed but missing
    if (!skipFix && needsConformanceMetadata && !hasConformanceMetadata && resourceType) {
        // Add ConformanceMetadata to the end of the file
        const updatedContent = content.trimEnd() + '\n* insert ConformanceMetadata\n';
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        filesFixed.push({
            file: relativePath,
            resourceType: resourceType,
            resourceName: resourceName
        });
    }
};

// Recursively find all .fsh files
const findFshFiles = (dir) => {
    const files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findFshFiles(fullPath));
        } else if (item.endsWith('.fsh')) {
            files.push(fullPath);
        }
    });
    
    return files;
};

// Main validation function
const validateFsh = () => {
    console.log(`${color.bright} FSH Validation Starting...${color.reset}\n`);
    
    // Step 1: Read and validate aliases
    readAliases();
    
    // Step 2: Process all FSH files
    const fshFiles = findFshFiles(fshFolder);
    console.log(`${color.blue} Found ${fshFiles.length} FSH files${color.reset}\n`);
    
    fshFiles.forEach(file => {
        processFshFile(file);
    });
    
    // Step 3: Check for duplicate URLs across resources
    urlsByAlias.forEach((resources, url) => {
        if (resources.size > 1) {
            duplicateUrls.push({
                url: url,
                resources: Array.from(resources)
            });
        }
    });
    
    // Report results
    console.log('\n' + '='.repeat(60));
    console.log(`${color.bright} Validation Results${color.reset}`);
    console.log('='.repeat(60) + '\n');
    
    // Report duplicate aliases
    if (duplicateAliases.length > 0) {
        console.log(`${color.red} DUPLICATE ALIASES FOUND:${color.reset}`);
        console.log('   Multiple aliases pointing to the same URL:\n');
        duplicateAliases.forEach(dup => {
            console.log(`   URL: ${dup.url}`);
            console.log(`   Aliases: ${dup.aliases.join(', ')}`);
            console.log(`   File: ${dup.file}\n`);
        });
    } else {
        console.log(`${color.green} No duplicate aliases found${color.reset}\n`);
    }
    
    // Report duplicate URLs
    if (duplicateUrls.length > 0) {
        console.log(`${color.red} DUPLICATE URLs FOUND:${color.reset}`);
        console.log('   Multiple resources using the same URL:\n');
        duplicateUrls.forEach(dup => {
            console.log(`   URL: ${dup.url}`);
            dup.resources.forEach(res => {
                console.log(`      - ${res.resource} (${res.file}) using alias ${res.alias}`);
            });
            console.log('');
        });
    } else {
        console.log(`${color.green} No duplicate URLs found${color.reset}\n`);
    }
    
    // Report files fixed
    if (filesFixed.length > 0 && verbose) {
        console.log(`${color.green} CONFORMANCE METADATA ADDED:${color.reset}`);
        console.log(`   Added "* insert ConformanceMetadata" to ${filesFixed.length} file(s):\n`);
        filesFixed.forEach(fix => {
            console.log(`   ${color.green}${color.reset} ${fix.file}`);
            console.log(`     ${fix.resourceType}: ${fix.resourceName}\n`);
        });
    } else if (filesFixed.length > 0) {
        console.log(`${color.green} Auto-fixed ConformanceMetadata in ${filesFixed.length} file(s)${color.reset}\n`);
    } else if (!skipFix) {
        console.log(`${color.green} All conformance resources already have ConformanceMetadata${color.reset}\n`);
    }
    
    // Summary
    console.log('='.repeat(60));
    const hasErrors = duplicateAliases.length > 0 || duplicateUrls.length > 0;
    if (hasErrors) {
        console.log(`${color.red} Validation completed with errors - pipeline stopped${color.reset}`);
        console.log(`${color.yellow}   Fix the errors above and run the test again${color.reset}`);
        process.exit(1);
    } else {
        console.log(`${color.green} Validation completed successfully${color.reset}`);
        if (filesFixed.length > 0) {
            console.log(`   ${filesFixed.length} file(s) were automatically fixed`);
        }
    }
    console.log('='.repeat(60) + '\n');
};

validateFsh();
