#!/usr/bin/env node

import { readSushiConfig, overwriteRuleSet, getFshInputFolder } from "../lib/utils.js";
import fs from 'fs-extra';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: fhir-update-ruleset [options]

Generates or updates RuleSet-metadata.fsh with current project metadata

Options:
  -h, --help         Display this help message

Description:
  Reads metadata from sushi-config.yaml and generates a FHIR Shorthand
  RuleSet containing version, publisher, date, and contact information.
  
  The RuleSet can be inserted into conformance resources using:
  * insert ConformanceMetadata

Output:
  Creates or updates: input/fsh/RuleSet-metadata.fsh

Examples:
  fhir-update-ruleset
`);
    process.exit(0);
}

const sushiConfig = readSushiConfig();
const version = sushiConfig?.version || "0.0.1";
const publisher = sushiConfig?.publisher?.name ?? sushiConfig?.publisher ?? "Unknown Publisher";
const _date = new Date().toISOString().slice(0, 10);

// Get contact info from sushi-config if available, otherwise use defaults
const contact = sushiConfig?.contact?.[0];
const contactEmail = contact?.telecom?.find(t => t.system === 'email')?.value || 
                     "contact@example.org";

const fsh = `RuleSet: ConformanceMetadata
* ^version = "${version}"
* ^publisher = "${publisher}"
* ^date = "${_date}"
* ^contact[0].telecom[0].system = #email
* ^contact[0].telecom[0].value = "${contactEmail}"`;

// Ensure the input/fsh folder exists
const fshInputFolder = getFshInputFolder();
fs.ensureDirSync(fshInputFolder);

// Write the RuleSet file
overwriteRuleSet(fsh);

console.log(`✅ Updated RuleSet-metadata.fsh with version ${version} and date ${_date}`);
