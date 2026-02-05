#!/usr/bin/env node

import { readSushiConfig, getFshOutputFolder } from "../lib/utils.js";
import fs from 'fs-extra';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-check-publication [options]

Complete publication readiness checklist (includes all quality checks + publication-specific requirements)

Options:
  -h, --help         Display this help message

Checks performed:
  ✓ All conformance resources have descriptions
  ✓ Publisher, jurisdiction, contact are set
  ✓ Version is not 0.x.x (development version)
  ✓ No resources with status 'draft'

Exit codes:
  0 - Ready for publication
  1 - Not ready for publication (blocking issues)

Examples:
  fhir-check-publication
`);
    process.exit(0);
}

const checkPublication = () => {
    console.log('📋 Publication Readiness Check...\n');

    const config = readSushiConfig();
    const issues = [];
    const warnings = [];

    // Check version
    if (config.version && config.version.startsWith('0.')) {
        warnings.push(`Version ${config.version} appears to be a development version (0.x.x)`);
    }

    // Check required publication fields
    if (!config.publisher) {
        issues.push('Publisher not set in sushi-config.yaml');
    }
    if (!config.jurisdiction || config.jurisdiction.length === 0) {
        issues.push('Jurisdiction not set in sushi-config.yaml');
    }
    if (!config.contact || config.contact.length === 0) {
        issues.push('Contact information not set in sushi-config.yaml');
    }

    // Check generated resources
    const resourcesFolder = getFshOutputFolder();
    if (fs.existsSync(resourcesFolder)) {
        const files = fs.readdirSync(resourcesFolder).filter(f => f.endsWith('.json'));

        let missingDescriptions = 0;
        let draftResources = 0;

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
                            warnings.push(`${resource.resourceType}/${resource.id} missing description`);
                        }
                    }

                    // Check status
                    if (resource.status === 'draft') {
                        draftResources++;
                        if (draftResources <= 5) {
                            warnings.push(`${resource.resourceType}/${resource.id} has status 'draft'`);
                        }
                    }
                }
            } catch (e) {
                // Skip invalid JSON
            }
        });

        if (missingDescriptions > 5) {
            warnings.push(`... and ${missingDescriptions - 5} more resources missing descriptions`);
        }
        if (draftResources > 5) {
            warnings.push(`... and ${draftResources - 5} more resources with 'draft' status`);
        }
    }

    // Report results
    console.log('='.repeat(60));

    if (issues.length > 0) {
        console.log('❌ BLOCKING ISSUES:\n');
        issues.forEach(issue => console.log(`   ${issue}`));
        console.log('');
    }

    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS (recommended to fix for publication):\n');
        warnings.forEach(warning => console.log(`   ${warning}`));
        console.log('');
    }

    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ Ready for publication\n');
    } else if (issues.length === 0) {
        console.log('⚠️  Ready but with warnings\n');
    } else {
        console.log('❌ Not ready for publication\n');
    }

    console.log('='.repeat(60));

    if (issues.length > 0) {
        process.exit(1);
    }
};

checkPublication();
