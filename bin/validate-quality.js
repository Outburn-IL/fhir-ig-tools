#!/usr/bin/env node

import { readSushiConfig, getFshOutputFolder } from "../lib/utils.js";
import fs from 'fs-extra';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-validate-quality [options]

Quality validation for FHIR IG resources (does not check draft status or 0.x.x versions)

Options:
  -h, --help         Display this help message

Checks performed:
  ✓ All conformance resources have descriptions
  ✓ Publisher, jurisdiction, contact are set in sushi-config.yaml

Does NOT check:
  ✗ Draft status (allowed for development)
  ✗ Version 0.x.x (allowed for development)

Exit codes:
  0 - All quality checks passed
  1 - Quality issues found

Examples:
  fhir-validate-quality
`);
    process.exit(0);
}

const validateQuality = () => {
    console.log('🔍 Quality Validation...\n');

    const config = readSushiConfig();
    const issues = [];
    const warnings = [];

    // Check required publication fields
    if (!config.publisher) {
        warnings.push('Publisher not set in sushi-config.yaml');
    }
    if (!config.jurisdiction || config.jurisdiction.length === 0) {
        warnings.push('Jurisdiction not set in sushi-config.yaml');
    }
    if (!config.contact || config.contact.length === 0) {
        warnings.push('Contact information not set in sushi-config.yaml');
    }

    // Check generated resources
    const resourcesFolder = getFshOutputFolder();
    if (fs.existsSync(resourcesFolder)) {
        const files = fs.readdirSync(resourcesFolder).filter(f => f.endsWith('.json'));

        let missingDescriptions = 0;

        files.forEach(file => {
            try {
                const content = fs.readFileSync(path.join(resourcesFolder, file), 'utf8');
                const resource = JSON.parse(content);

                // Skip ImplementationGuide and examples
                if (resource.resourceType === 'ImplementationGuide') return;

                // Check for conformance resources
                if (['StructureDefinition', 'CodeSystem', 'ValueSet', 'ConceptMap', 'SearchParameter', 'OperationDefinition', 'CapabilityStatement'].includes(resource.resourceType)) {
                    // Check description
                    if (!resource.description || resource.description.trim() === '') {
                        missingDescriptions++;
                        if (missingDescriptions <= 5) {
                            issues.push(`${resource.resourceType}/${resource.id} missing description`);
                        }
                    }
                }
            } catch (e) {
                // Skip invalid JSON
            }
        });

        if (missingDescriptions > 5) {
            issues.push(`... and ${missingDescriptions - 5} more resources missing descriptions`);
        }
    }

    // Report results
    console.log('='.repeat(60));

    if (issues.length > 0) {
        console.log('❌ QUALITY ISSUES:\n');
        issues.forEach(issue => console.log(`   ${issue}`));
        console.log('');
    }

    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS (recommended to fix):\n');
        warnings.forEach(warning => console.log(`   ${warning}`));
        console.log('');
    }

    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ Quality validation passed\n');
    } else if (issues.length === 0) {
        console.log('✅ Quality validation passed (with warnings)\n');
    } else {
        console.log('❌ Quality validation failed\n');
    }

    console.log('='.repeat(60));

    if (issues.length > 0) {
        process.exit(1);
    }
};

validateQuality();
