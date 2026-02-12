#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Don't run postinstall in the fsh-and-chips package itself
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.log('⏭️  No package.json found, skipping auto-configuration');
    process.exit(0);
}

const packageJson = fs.readJsonSync(packageJsonPath);

// Check if this is the fsh-and-chips package itself
if (packageJson.name === 'fsh-and-chips') {
    console.log('⏭️  Running in fsh-and-chips package, skipping auto-configuration');
    process.exit(0);
}

console.log('\n🍟 fsh-and-chips: Setting up your FHIR IG project...\n');

// Recommended scripts to add
const recommendedScripts = {
    "validate:fsh": "fhir-validate-fsh",
    "validate:config": "fhir-validate-config",
    "validate:quality": "fhir-validate-quality",
    "validate:ig": "fhir-validate-ig-full",
    "validate:examples": "fhir-validate-examples",
    "validate:ex": "fhir-validate-examples",
    "check:publication": "fhir-check-publication",
    "ruleset": "fhir-update-ruleset",
    "install:java": "fhir-install-java",
    "sync:version": "fhir-sync-version",
    "test": "fhir-test"
};

// Initialize scripts object if it doesn't exist
if (!packageJson.scripts) {
    packageJson.scripts = {};
}

let added = 0;
let skipped = 0;

console.log('📝 Adding scripts to package.json:\n');

for (const [scriptName, scriptCommand] of Object.entries(recommendedScripts)) {
    if (!packageJson.scripts[scriptName]) {
        packageJson.scripts[scriptName] = scriptCommand;
        console.log(`   ✅ Added: "${scriptName}": "${scriptCommand}"`);
        added++;
    } else {
        console.log(`   ⏭️  Skipped: "${scriptName}" (already exists)`);
        skipped++;
    }
}

// Write updated package.json
fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

console.log(`\n📦 Configuration complete!`);
console.log(`   ${added} script(s) added, ${skipped} script(s) already existed\n`);

if (added > 0) {
    console.log('🎉 You can now run:\n');
    console.log('   npm test                    - Full validation workflow');
    console.log('   npm run validate:fsh        - Validate FSH files only');
    console.log('   npm run check:publication   - Publication readiness check\n');
}

console.log('📚 Documentation: https://github.com/Outburn-IL/fsh-and-chips\n');
