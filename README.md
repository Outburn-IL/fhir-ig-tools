# @outburn-il/fhir-ig-tools

FHIR Implementation Guide validation and build tools for FSH (FHIR Shorthand) projects.

## Features

✅ **FSH Validation** - Detect duplicate aliases, duplicate URLs, and auto-fix missing ConformanceMetadata  
✅ **IG Validation** - Validate Implementation Guide artifacts with FHIR validator  
✅ **Example Validation** - Validate example resources  
✅ **RuleSet Generation** - Auto-generate metadata RuleSets from sushi-config.yaml  
✅ **Java Installation** - Automated JRE 21 download and setup  
✅ **Help Documentation** - All commands support `--help` flag

## Installation

### From GitHub (recommended for Outburn-IL projects)

```bash
npm install --save-dev github:Outburn-IL/fhir-ig-tools
```

### From npm (once published)

```bash
npm install --save-dev @outburn-il/fhir-ig-tools
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

**Options:**
- `-h, --help` - Display help message
- `--skip-fix` - Skip auto-fixing ConformanceMetadata
- `--no-color` - Disable colored output

**Exit codes:**
- `0` - Success (no errors, only auto-fixes performed)
- `1` - Validation errors found (duplicates detected)

**Examples:**
```bash
fhir-validate-fsh
fhir-validate-fsh --skip-fix
```

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

Outburn IL - FHIR Implementation Guide development tools
