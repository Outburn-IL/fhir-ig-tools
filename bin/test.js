#!/usr/bin/env node

import { execaCommand } from 'execa';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-test [options]

Complete FHIR IG validation workflow (recommended for CI/CD and pre-commit)

Options:
  -h, --help         Display this help message

Workflow:
  1. ✓ Validate FSH files (fhir-validate-fsh)
  2. ✓ Validate sushi-config.yaml (fhir-validate-config)
  3. ✓ Update ConformanceMetadata.fsh (fhir-update-ruleset)
  4. ✓ Build IG with SUSHI (sushi build -s)
  5. ✓ Create differentials (sushi build --out differentials)
  6. ✓ Install Java if needed (fhir-install-java)
  7. ✓ Validate IG resources (fhir-validate-ig)
  8. ✓ Validate examples (fhir-validate-examples)
  9. ✓ Quality check (fhir-validate-quality)

Exit codes:
  0 - All tests passed
  1 - Tests failed (pipeline stops at first failure)

Examples:
  fhir-test
  npm test     # if added to package.json scripts
`);
    process.exit(0);
}

const runTest = async () => {
    console.log('🧪 Starting FHIR IG Test Suite...\n');
    console.log('='.repeat(60));

    const steps = [
        { name: '1. Validate FSH files', cmd: 'fhir-validate-fsh' },
        { name: '2. Validate sushi-config.yaml', cmd: 'fhir-validate-config' },
        { name: '3. Update ConformanceMetadata.fsh', cmd: 'fhir-update-ruleset' },
        { name: '4. Build IG with SUSHI', cmd: 'sushi build -s' },
        { name: '5. Create differentials', cmd: 'sushi build --out differentials' },
        { name: '6. Prepare validation tools', cmd: 'fhir-install-java' },
        { name: '7. Validate IG resources', cmd: 'fhir-validate-ig' },
        { name: '8. Validate examples', cmd: 'fhir-validate-examples' },
        { name: '9. Quality check', cmd: 'fhir-validate-quality' }
    ];

    for (const step of steps) {
        console.log(`\n${step.name}...`);
        console.log('-'.repeat(60));

        try {
            await execaCommand(step.cmd, {
                stdio: 'inherit',
                shell: true
            });
        } catch (error) {
            console.error(`\n❌ Step failed: ${step.name}`);
            console.error('   Pipeline stopped.\n');
            process.exit(1);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!\n');
};

runTest();
