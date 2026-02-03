#!/usr/bin/env node

import { 
    getJreBin, 
    getValidatorPath, 
    getFshOutputFolder, 
    readSushiConfig, 
    getDependencies, 
    getValidationOutputPath,
    readValidationResults,
    extractErrorSummary,
    getDiffFolder,
    deleteIgResource
} from "../lib/utils.js";
import { execa } from 'execa';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-validate-ig [options]

Validates FHIR Implementation Guide artifacts using the official FHIR validator

Options:
  -h, --help         Display this help message
  --version VER      Override FHIR version (default: from sushi-config.yaml)

Description:
  Validates all resources in the differentials/fsh-generated/resources folder
  against the FHIR specification and configured Implementation Guides.

Requirements:
  • Java Runtime Environment (JRE 17+)
  • FHIR validator_cli.jar
  • Run 'npm run prepare:validation' first to ensure dependencies

Exit codes:
  0 - Validation successful (may have warnings)
  1 - Validation failed with errors

Examples:
  fhir-validate-ig
  fhir-validate-ig --version 4.0.1
`);
    process.exit(0);
}

const igFolder = getFshOutputFolder();
const java = getJreBin();
const jar = getValidatorPath();
const sushiConfig = readSushiConfig();
const outputPathJson = getValidationOutputPath() + '.ig.json'
const outputPathHtml = getValidationOutputPath() + '.ig.html'
const diffFolder = getDiffFolder();

// Check for version override
const versionIndex = args.indexOf('--version');
const versionOverride = versionIndex >= 0 && args[versionIndex + 1] ? args[versionIndex + 1] : null;

const getFhirVersion = () => {
    return versionOverride || sushiConfig?.fhirVersion || '4.0.1';
};

const readResults = async () => {
    const results = readValidationResults(outputPathJson);
    const errorSummary = await extractErrorSummary(results);
    return errorSummary;
}

const runValidate = async () => {
    deleteIgResource();
    if (java && jar) {
        const args = [
            '-Dfile.encoding=UTF-8',
            '-jar',
            jar,
            diffFolder,
            '-version',
            getFhirVersion(),
            '-ig',
            igFolder,
            ...getDependencies(sushiConfig), 
            '-output',
            outputPathJson,
            '-html-output',
            outputPathHtml
        ];

        const subprocess = execa(java, args);
        subprocess.stdout.pipe(process.stdout);
        await subprocess;
        const errors = await readResults();
        const message = `Finished validating IG artifacts. Found ${(errors.fatal ?? 0) + (errors.error ?? 0)} errors (${errors.fatal ?? 0} fatal) and ${errors.warning ?? 0} warnings`;
        console.log(message)
        if (errors?.error || errors?.fatal) {
            throw new Error(`Validation failed! See detailed results in: ${outputPathHtml}`)
        } else if (errors?.warning) {
            console.log(`Validation finished with warnings. Please see detailed results in: ${outputPathHtml}`)
        } else {
            console.log('Successful validation!')
        }
        return true
    } else {
        throw new Error('Failed to find JRE :(')
    }
};

runValidate();
