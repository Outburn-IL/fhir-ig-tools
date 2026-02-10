# fsh&chips 🍟

**FHIR Shorthand & Comprehensive Helpers for Implementation Publishing Success**

A complete toolkit for building, validating, and publishing FHIR Implementation Guides using FHIR Shorthand (FSH). Designed to catch errors early, enforce best practices, and streamline your IG development workflow.

---

## 🎯 Why fsh&chips?

Building a FHIR Implementation Guide involves many steps: writing FSH, running SUSHI, validating resources, checking examples, and ensuring publication readiness. **fsh&chips** automates this entire workflow and catches common mistakes before they become problems.

### Key Benefits

✅ **Catch FSH errors before SUSHI** - Detect duplicate aliases, undefined aliases, and missing metadata  
✅ **Automated metadata management** - Generate and maintain ConformanceMetadata automatically  
✅ **Complete validation pipeline** - From FSH files to final publication checks  
✅ **One-command testing** - Run your entire test suite with `npm test`  
✅ **Auto-configuration** - Installs and sets up everything automatically  
✅ **Clear error messages** - Know exactly what's wrong and how to fix it

---

## 📦 Installation

```bash
npm install --save-dev fsh-and-chips
```

Or install directly from GitHub:

```bash
npm install --save-dev github:Outburn-IL/fsh-and-chips
```

### What Happens During Installation?

When you install fsh-and-chips, it automatically:
1. Adds all necessary npm scripts to your `package.json`
2. Makes commands available both as CLI tools and npm scripts
3. Displays helpful getting-started information

---

## 🚀 Quick Start

After installation, run your complete validation workflow:

```bash
npm test
```

This runs:
1. FSH validation (checks for errors in your `.fsh` files)
2. Config validation (validates `sushi-config.yaml`)
3. RuleSet generation (creates/updates `ConformanceMetadata.fsh`)
4. SUSHI build (builds your IG)
5. Differentials creation (generates differential views)
6. IG validation (validates all conformance resources)
7. Example validation (validates all example resources)
8. Quality check (ensures descriptions and metadata are complete)

---

## 📚 Understanding the Key Concepts

### What is ConformanceMetadata?

**ConformanceMetadata** is a FSH RuleSet that automatically adds version, publisher, date, and contact information to all your conformance resources (StructureDefinitions, ValueSets, CodeSystems, etc.).

#### Before fsh&chips:
```fsh
Profile: MyPatientProfile
Parent: Patient
* ^version = "1.0.0"
* ^publisher = "My Organization"
* ^date = "2026-02-05"
* ^contact[0].telecom[0].system = #email
* ^contact[0].telecom[0].value = "contact@example.org"
// ... actual profile definition
```

#### With fsh&chips:
```fsh
Profile: MyPatientProfile
Parent: Patient
* insert ConformanceMetadata  // <- All metadata added automatically!
// ... actual profile definition
```

The `ConformanceMetadata.fsh` file is automatically generated from your `sushi-config.yaml`, ensuring consistency across all resources.

### What Does "Validate FSH" Mean?

FSH validation happens **before** SUSHI runs and catches:
- **Duplicate aliases**: Multiple aliases pointing to the same URL
- **Duplicate URLs**: Multiple resources with the same canonical URL
- **Undefined aliases**: Using an alias that wasn't defined in `aliases.fsh`
- **Missing ConformanceMetadata**: Automatically adds `* insert ConformanceMetadata` to resources that need it

This catches errors early, giving you clear messages before SUSHI's sometimes cryptic errors.

---

## 🛠️ Available Commands

### Core Validation Commands

#### `npm test` (or `fhir-test`)
**Complete validation workflow** - Runs everything from FSH validation through final quality checks.

```bash
npm test
```

**When to use:** Before committing code, in CI/CD pipelines, before publishing

---

#### `npm run validate:fsh` (or `fhir-validate-fsh`)
**Validate FSH files** - Checks for duplicate aliases, undefined aliases, and auto-fixes missing ConformanceMetadata.

```bash
npm run validate:fsh

# With options:
fhir-validate-fsh --verbose        # Show detailed file-by-file output
fhir-validate-fsh --skip-fix       # Don't auto-fix ConformanceMetadata
fhir-validate-fsh --no-color       # Disable colored output
```

**Checks performed:**
- ✓ Duplicate aliases (multiple aliases → same URL)
- ✓ Duplicate URLs (multiple resources → same URL)
- ✓ Undefined aliases (aliases used but not defined)
- ✓ Missing ConformanceMetadata (auto-adds if missing)

**Exit codes:**
- `0` - No errors (auto-fixes don't count as errors)
- `1` - Errors found (pipeline stops)

**When to use:** First step of any build, before running SUSHI

---

#### `npm run validate:config` (or `fhir-validate-config`)
**Validate sushi-config.yaml** - Ensures your configuration is publication-ready.

```bash
npm run validate:config
```

**Checks performed:**
- ✓ Required fields present (id, version, publisher)
- ✓ Dependency versions are locked (not 'latest', 'current', or ranges)
- ✓ Jurisdiction is set
- ✓ Contact information is complete

**When to use:** After modifying `sushi-config.yaml`, before publication

---

#### `npm run validate:quality` (or `fhir-validate-quality`)
**Quality validation** - Checks resource quality without blocking development versions.

```bash
npm run validate:quality
```

**Checks performed:**
- ✓ All conformance resources have descriptions
- ✓ Publisher, jurisdiction, contact are set

**Does NOT check:**
- ✗ Draft status (allowed for development)
- ✗ Version 0.x.x (allowed for development)

**When to use:** Regular development workflow, part of `npm test`

---

#### `npm run check:publication` (or `fhir-check-publication`)
**Publication readiness** - Complete checklist including draft status and version checks.

```bash
npm run check:publication
```

**Checks performed:**
- ✓ All conformance resources have descriptions
- ✓ Publisher, jurisdiction, contact are set
- ✓ Version is not 0.x.x (warns about development versions)
- ✓ No resources with status 'draft'

**When to use:** Before publishing to a registry, before tagging a release

---

#### `npm run validate:ig` (or `fhir-validate-ig`)
**Validate IG resources** - Runs FHIR validator on your conformance resources.

```bash
npm run validate:ig
```

**Prerequisites:** Requires differentials to exist (automatically created by `npm test`)

**What it does:**
- Validates all resources in `differentials/fsh-generated/resources/`
- Uses official FHIR validator
- Generates HTML and JSON reports

**When to use:** After SUSHI build, as part of `npm test`

---

#### `npm run validate:examples` (or `fhir-validate-examples`)
**Validate examples** - Validates all example resources in your `examples/` folder.

```bash
npm run validate:examples
```

**What it does:**
- Validates all `.json` files in `examples/`
- Checks against your IG's profiles
- Generates validation reports

**When to use:** After creating/modifying examples, as part of `npm test`

---

### Utility Commands

#### `npm run ruleset` (or `fhir-update-ruleset`)
**Generate ConformanceMetadata.fsh** - Creates/updates the metadata RuleSet from sushi-config.yaml.

```bash
npm run ruleset
```

**What it does:**
- Reads version, publisher, contact from `sushi-config.yaml`
- Generates `input/fsh/ConformanceMetadata.fsh`
- Verifies version matches if file already exists

**Output file (input/fsh/ConformanceMetadata.fsh):**
```fsh
RuleSet: ConformanceMetadata
* ^version = "1.0.0"
* ^publisher = "Your Organization"
* ^date = "2026-02-05"
* ^contact[0].telecom[0].system = #email
* ^contact[0].telecom[0].value = "contact@example.org"
```

**When to use:** Automatically run by `npm test`, or manually after changing version/publisher

---

#### `npm run sync:version` (or `fhir-sync-version`)
**Synchronize versions** - Syncs version from sushi-config.yaml to package.json.

```bash
npm run sync:version
```

**What it does:**
- Reads version from `sushi-config.yaml`
- Updates `package.json` and `package-lock.json` to match

**When to use:** After bumping version in `sushi-config.yaml`

---

#### `npm run install:java` (or `fhir-install-java`)
**Install Java** - Downloads and installs JRE 21 (required for FHIR validator).

```bash
npm run install:java
```

**What it does:**
- Downloads JRE 21 from adoptopenjdk.net
- Installs to local `jre/` folder
- Automatically run by `npm test` if needed

**When to use:** Automatically handled by validation commands

---

## 📋 Typical Workflows

### Daily Development Workflow

```bash
# 1. Make changes to your FSH files
# 2. Run tests
npm test

# If tests pass, commit your changes
git add .
git commit -m "Add new profile"
git push
```

### Preparing for Publication

```bash
# 1. Update version in sushi-config.yaml
# 2. Sync version to package.json
npm run sync:version

# 3. Run complete publication check
npm run check:publication

# 4. If ready, tag and publish
git tag v1.0.0
git push --tags
```

### Fixing Validation Errors

```bash
# 1. Run FSH validation first
npm run validate:fsh

# 2. Fix any FSH errors
# 3. Run full test suite
npm test
```

### Adding New Dependencies

```bash
# 1. Add dependency to sushi-config.yaml with locked version
dependencies:
  hl7.fhir.us.core: 5.0.1  # ✓ Good - locked version
  # hl7.fhir.us.core: latest  # ✗ Bad - will fail validation

# 2. Validate configuration
npm run validate:config
```

---

## 🎓 Command Reference Guide

### Which Command Should I Use?

| Task | Command | When |
|------|---------|------|
| Run everything | `npm test` | Before commit, in CI/CD |
| Check FSH files only | `npm run validate:fsh` | After editing FSH |
| Check config | `npm run validate:config` | After editing sushi-config.yaml |
| Check examples only | `npm run validate:examples` | After adding/editing examples |
| Pre-publication check | `npm run check:publication` | Before tagging a release |
| Update metadata | `npm run ruleset` | After changing version/publisher |
| Sync versions | `npm run sync:version` | After bumping version |

---

## 🔧 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Validate FHIR IG

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run validation
        run: npm test
      
      - name: Check publication readiness (on main branch)
        if: github.ref == 'refs/heads/main'
        run: npm run check:publication
```

---

## 🤝 Using Both CLI and npm Scripts

fsh&chips commands can be used in two ways:

### 1. As npm scripts (recommended for projects):
```bash
npm test
npm run validate:fsh
npm run check:publication
```

### 2. As CLI commands (useful for scripts/automation):
```bash
fhir-test
fhir-validate-fsh --verbose
fhir-check-publication
```

Both methods work identically. npm scripts are added automatically during installation.

---

## 🐛 Troubleshooting

### Security vulnerabilities during installation

You may see npm warnings about vulnerabilities in `fsh-sushi` dependencies. These are known issues in SUSHI's transitive dependencies:

```bash
npm audit fix
```

Most vulnerabilities are in development dependencies and don't affect runtime security. The SUSHI team is aware and working on updates.

### "Command not found" after installation

Run `npm install` again to ensure all bin links are created:
```bash
npm install
```

### Java not found when running validation

Install Java automatically:
```bash
npm run install:java
```

### SUSHI build fails but FSH validation passes

This is expected! FSH validation catches *some* errors but not all. SUSHI performs deeper semantic validation. Check SUSHI's error messages for details.

### Validation is too slow

Use individual commands for faster iteration:
```bash
npm run validate:fsh      # Fast - just checks FSH files
npm run validate:ig       # Slower - runs full validator
```

### Auto-fix changed my FSH files

This is intended behavior! `fhir-validate-fsh` automatically adds `* insert ConformanceMetadata` to conformance resources. To disable:
```bash
fhir-validate-fsh --skip-fix
```

---

## 📖 Project Structure

After installation, your project should have:

```
your-ig-project/
├── input/
│   └── fsh/
│       ├── ConformanceMetadata.fsh    # Auto-generated metadata RuleSet
│       ├── aliases.fsh                 # Your alias definitions
│       └── *.fsh                       # Your FSH files
├── examples/
│   └── *.json                          # Your example resources
├── sushi-config.yaml                   # SUSHI configuration
├── package.json                        # npm configuration (auto-updated)
└── package-lock.json
```

---

## 🌟 Contributing

Found a bug? Have a feature request? Open an issue on [GitHub](https://github.com/Outburn-IL/fsh-and-chips).

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

Built with ❤️ by [Outburn IL](https://outburn.co.il) for the FHIR community.

Powered by:
- [SUSHI](https://github.com/FHIR/sushi) - FSH compiler
- [FHIR Validator](https://github.com/hapifhir/org.hl7.fhir.core) - Official FHIR validation
- [Node.js](https://nodejs.org/) - Runtime environment

---

## 📞 Support

- **Documentation**: https://github.com/Outburn-IL/fsh-and-chips
- **Issues**: https://github.com/Outburn-IL/fsh-and-chips/issues
- **FHIR Chat**: https://chat.fhir.org

---

**Happy FSH-ing! 🍟**
