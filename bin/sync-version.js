#!/usr/bin/env node

import { readSushiConfig } from "../lib/utils.js";
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-sync-version [options]

Synchronizes version from sushi-config.yaml to package.json

Options:
  -h, --help         Display this help message

Description:
  Reads the version from sushi-config.yaml and updates both
  package.json and package-lock.json to match. This ensures
  version consistency across all project files.

Exit codes:
  0 - Version synchronized successfully
  1 - Error during synchronization

Examples:
  fhir-sync-version
`);
    process.exit(0);
}

const syncVersion = async () => {
    try {
        const sushiConfig = readSushiConfig();
        const version = sushiConfig?.version;

        if (!version) {
            console.error('❌ No version found in sushi-config.yaml');
            process.exit(1);
        }

        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const oldVersion = packageJson.version;

        if (oldVersion === version) {
            console.log(`✅ Version already in sync: ${version}`);
            return;
        }

        // Update package.json
        packageJson.version = version;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

        console.log(`📝 Updated package.json: ${oldVersion} → ${version}`);

        // Update package-lock.json using npm
        try {
            await execa('npm', ['install', '--package-lock-only'], {
                stdio: 'pipe'
            });
            console.log(`📝 Updated package-lock.json: ${version}`);
        } catch (error) {
            console.warn('⚠️  Could not update package-lock.json (npm install --package-lock-only failed)');
        }

        console.log(`✅ Version synchronized: ${version}`);
    } catch (error) {
        console.error('❌ Error syncing version:', error.message);
        process.exit(1);
    }
};

syncVersion();
