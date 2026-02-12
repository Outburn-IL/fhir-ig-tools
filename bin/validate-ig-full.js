#!/usr/bin/env node

import { execaCommand } from 'execa';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-validate-ig-full [options]

Full IG validation workflow (pre-SUSHI checks + SUSHI build + differentials + IG validation)

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

Exit codes:
  0 - Validation successful
  1 - Validation failed (pipeline stops at first failure)

Examples:
  fhir-validate-ig-full
  npm run validate:ig
`);
    process.exit(0);
}

const runValidateIgFull = async () => {
    console.log('🔎 Starting Full IG Validation...\n');
    console.log('='.repeat(60));

    const steps = [
        { name: '1. Validate FSH files', cmd: 'fhir-validate-fsh' },
        { name: '2. Validate sushi-config.yaml', cmd: 'fhir-validate-config' },
        { name: '3. Update ConformanceMetadata.fsh', cmd: 'fhir-update-ruleset' },
        { name: '4. Build IG with SUSHI', cmd: 'sushi build -s' },
        { name: '5. Create differentials', cmd: 'sushi build --out differentials' },
        { name: '6. Prepare validation tools', cmd: 'fhir-install-java' },
        { name: '7. Validate IG resources', cmd: 'fhir-validate-ig' }
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
    console.log('✅ IG validation completed successfully\n');
};

runValidateIgFull();
