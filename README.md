# FSH&Chips 🍟

**FHIR Shorthand & Comprehensive Helpers for Implementation Publishing Success**

Validation and build tools for FHIR Implementation Guide projects using FHIR Shorthand (FSH).

## Features

✅ **FSH Validation** - Detect duplicate aliases, duplicate URLs, and auto-fix missing ConformanceMetadata  
✅ **IG Validation** - Validate Implementation Guide artifacts with FHIR validator  
✅ **Example Validation** - Validate example resources  
✅ **RuleSet Generation** - Auto-generate metadata RuleSets from sushi-config.yaml  
✅ **Java Installation** - Automated JRE 21 download and setup  
✅ **Help Documentation** - All commands support `--help` flag

## Installation

```bash
npm install --save-dev fsh-and-chips
```

Or install directly from GitHub:

```bash
npm install --save-dev github:Outburn-IL/fsh-and-chips
```

## Quick Start

After installation, add these scripts to your project's `package.json`:

```json
{
  "scripts": {
    "ruleset": "fhir-update-ruleset",
    "validate:fsh": "fhir-validate-fsh",
    "validate:ig": "fhir-validate-ig",
    "validate:ex": "fhir-validate-examples",
    "prepare:validation": "fhir-install-java",
    "test": "npm run validate:fsh && npm run ruleset && sushi build -s && npm run prepare:validation && npm run validate:ig && npm run validate:ex"
  }
}
```

## Commands

### fhir-validate-fsh

Validates FSH files for common issues and auto-fixes metadata.

```bash
fhir-validate-fsh [options]
```

**Checks performed:**
- Duplicate aliases (multiple aliases → same URL)
- Duplicate URLs (multiple resources → same URL)
- Missing ConformanceMetadata (auto-fixes by default)

**Options:**\n- `-h, --help` - Display help message\n- `--skip-fix` - Skip auto-fixing ConformanceMetadata\n- `--no-color` - Disable colored output\n- `--verbose` - Show detailed file-by-file processing

**Exit codes:**
- `0` - Success (no errors, only auto-fixes performed)
- `1` - Validation errors found (duplicates detected)

**Examples:**
```bash\nfhir-validate-fsh\nfhir-validate-fsh --skip-fix\nfhir-validate-fsh --verbose\n```

---

### fhir-validate-ig

Validates FHIR Implementation Guide artifacts using the official FHIR validator.

```bash
fhir-validate-ig [options]
```

**Options:**
- `-h, --help` - Display help message
- `--version VER` - Override FHIR version (default: from sushi-config.yaml)

**Requirements:**
- Java Runtime Environment (JRE 17+)
- FHIR validator_cli.jar
- Run `npm run prepare:validation` first

**Examples:**
```bash
fhir-validate-ig
fhir-validate-ig --version 4.0.1
```

---

### fhir-validate-examples

Validates FHIR example resources in the examples/ folder.

```bash
fhir-validate-examples [options]
```

**Options:**
- `-h, --help` - Display help message
- `--version VER` - Override FHIR version (default: from sushi-config.yaml)

**Examples:**
```bash
fhir-validate-examples
```

---

### fhir-validate-config

Validates sushi-config.yaml for common issues.

```bash
fhir-validate-config [options]
```

**Options:**
- `-h, --help` - Display help message

**Checks performed:**
- Dependency versions are locked (not 'latest' or ranges)
- Required fields are present (id, version, publisher, etc.)
- Jurisdiction is set for publication
- Contact information is complete

**Examples:**
```bash
fhir-validate-config
```

---

### fhir-validate-ready

Pre-publication readiness checklist.

```bash
fhir-validate-ready [options]
```

**Options:**
- `-h, --help` - Display help message

**Checks performed:**
- All conformance resources have descriptions
- Publisher, jurisdiction, contact are set
- Version is not 0.x.x (development version)
- No resources with status 'draft'

**Examples:**
```bash
fhir-validate-ready
```

---

### fhir-sync-version

Synchronizes version from sushi-config.yaml to package.json.

```bash
fhir-sync-version [options]
```

**Options:**
- `-h, --help` - Display help message

**Description:**
Reads the version from sushi-config.yaml and updates both package.json and package-lock.json to match. Ensures version consistency across all project files.

**Examples:**
```bash
fhir-sync-version
```

---

### fhir-update-ruleset

Generates or updates RuleSet-metadata.fsh with current project metadata.

```bash
fhir-update-ruleset [options]
```

**Options:**
- `-h, --help` - Display help message

**Description:**
Reads metadata from sushi-config.yaml and generates a FHIR Shorthand RuleSet containing version, publisher, date, and contact information.

The RuleSet can be inserted into conformance resources using:
```fsh
* insert ConformanceMetadata
```

**Output:** Creates or updates `input/fsh/RuleSet-metadata.fsh`

---

### fhir-install-java

Downloads and installs Java Runtime Environment (JRE) for FHIR validation.

```bash
fhir-install-java [options]
```

**Options:**
- `-h, --help` - Display help message
- `--force` - Force reinstall even if JRE already exists

**Description:**
Downloads JRE 21 from adoptopenjdk.net and installs it in the project's jre/ folder.

**Examples:**
```bash
fhir-install-java
fhir-install-java --force
```

## Typical Workflow

### 1. Initial Setup

```bash
npm install --save-dev github:Outburn-IL/fhir-ig-tools
npm run prepare:validation  # Install Java
```

### 2. Development

```bash
npm run validate:fsh    # Check FSH files
npm run ruleset         # Update metadata RuleSet
sushi build -s          # Build IG
```

### 3. Full Validation

```bash
npm test  # Runs complete validation pipeline
```

## Project Structure

The tools expect a standard FHIR IG project structure:

```
your-project/
├── input/
│   └── fsh/                    # FSH source files
│       ├── aliases.fsh         # Alias definitions
│       └── RuleSet-metadata.fsh # Generated metadata
├── examples/                   # Example JSON files
├── fsh-generated/
│   └── resources/              # SUSHI output
├── differentials/
│   └── fsh-generated/
│       └── resources/          # Validation targets
├── sushi-config.yaml           # Project configuration
├── package.json
└── jre/                        # Java runtime (auto-installed)
```

## Configuration

The tools read configuration from `sushi-config.yaml`:

```yaml
id: your-ig-id
version: 1.0.0
fhirVersion: 4.0.1
publisher:
  name: Your Organization
contact:
  - telecom:
      - system: email
        value: contact@example.org
dependencies:
  hl7.fhir.us.core: 6.1.0
```

## FSH Validation Details

### Duplicate Aliases

Detects when multiple alias names point to the same URL:

```fsh
Alias: $example1 = http://example.org/fhir
Alias: $example2 = http://example.org/fhir  // ❌ Duplicate!
```

### Duplicate URLs

Detects when multiple resources use the same canonical URL:

```fsh
Profile: Profile1
* ^url = $example

Extension: Extension1
* ^url = $example  // ❌ Duplicate!
```

### Auto-fix ConformanceMetadata

Automatically adds metadata insertion to conformance resources:

```fsh
Profile: PatientProfile
Id: patient-profile
Title: "Patient Profile"
// Tool adds this line automatically:
* insert ConformanceMetadata
```

## Exit Codes

All commands follow standard exit code conventions:
- `0` - Success
- `1` - Error or validation failure

This allows integration with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Validate FHIR IG
  run: npm test
```

## Requirements

- **Node.js**: 18.0.0 or higher
- **Java**: Auto-installed by `fhir-install-java` (JRE 21)
- **SUSHI**: FHIR Shorthand compiler (install separately)

## Troubleshooting

### "No JRE found"

Run `npm run prepare:validation` or `fhir-install-java` to install Java.

### "No aliases.fsh file found"

This is a warning. If you use aliases in your FSH files, create `input/fsh/aliases.fsh`:

```fsh
Alias: $sct = http://snomed.info/sct
Alias: $loinc = http://loinc.org
```

### Validation errors

Check the HTML output files for detailed error reports:
- `validator_cli_output.ig.html` - IG validation
- `validator_cli_output.ex.html` - Example validation

## Contributing

Issues and pull requests welcome at: https://github.com/Outburn-IL/fhir-ig-tools

## License

MIT

## Author

Outburn Ltd. 







