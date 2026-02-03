import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import yaml from 'js-yaml';

const server = axios.create({ timeout: 15000 });

const workingDir = process.cwd();
const sushiConfigPath = path.join(workingDir, 'sushi-config.yaml');

export const fetch = async (url) => {
    console.log(`Fetching ${url}...`);
    const res = await server.get(url, { responseType: 'arraybuffer' });
    return res;
};

export const getJrePath = () => {
    return path.join(workingDir, 'jre');
};

const getJreVersionPath = () => {
    const jrePath = getJrePath();
    if (fs.existsSync(jrePath) === false) {
        console.log('No JRE versions installed :(');
        return undefined;
    };

    const versions = fs.readdirSync(jrePath);
    if (versions.length === 1) {
        return path.join(jrePath, versions[0]);
    };
    if (versions.length > 1) {
        console.log('Multiple versions of jre found... Deleting all of them!');
    };
    if (versions.length === 0) {
        console.log('No JRE versions installed :(');
    };
    fs.rmSync(jrePath, { recursive: true, force: true });
    return undefined;
};

export const getJreBin = () => {
    const versionPath = getJreVersionPath();
    if (versionPath) {
        return path.join(versionPath, 'bin', 'java');
    };
    return undefined;
};

export const getValidatorPath = () => {
    return path.join(workingDir, 'validator_cli.jar');
};

export const getValidationOutputPath = () => {
    return path.join(workingDir, 'validator_cli_output');
};

export const getFshOutputFolder = () => {
    return path.join(workingDir, 'fsh-generated', 'resources');
};

export const getFshInputFolder = () => {
    return path.join(workingDir, 'input', 'fsh');
};

export const overwriteRuleSet = (fsh) => {
    const fshFile = path.join(getFshInputFolder(), 'RuleSet-metadata.fsh');
    return fs.writeFileSync(fshFile, fsh);
}

export const getExamplesFolder = () => {
    return path.join(workingDir, 'examples');
};

export const getDiffFolder = () => {
    return path.join(workingDir, 'differentials', 'fsh-generated', 'resources');
};

export const deleteIgResource = () => {
    const igFilePath = path.join(getDiffFolder(), `ImplementationGuide-${readSushiConfig().id}.json`);
    return fs.unlinkSync(igFilePath);
};

export const readSushiConfig = () => {
    try {
        const doc = yaml.load(fs.readFileSync(sushiConfigPath, 'utf8'));
        return doc;
    } catch (e) {
        console.log(e);
    }
};

export const readValidationResults = (filePath) => {
    try {
        const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return doc;
    } catch (e) {
        console.log(e);
    }
};

export const getDependencies = (sushiConfig) => {
    if (sushiConfig?.dependencies) {
        const igs = Object.entries(sushiConfig.dependencies);
        let igParamArray = [];
        igs.map((kv) => {
            igParamArray.push('-ig');
            const version = typeof kv[1] === 'string' ? kv[1] : kv[1].version;
            igParamArray.push(`${kv[0]}#${version}`);
        });
        return igParamArray;
    } else {
        return [];
    }
};

export const extractErrorSummary = async (resource) => {
    // Simple error extraction without jsonata dependency
    const issues = resource?.issue || [];
    const summary = {
        fatal: 0,
        error: 0,
        warning: 0
    };
    
    issues.forEach(issue => {
        if (issue.severity === 'fatal') summary.fatal++;
        else if (issue.severity === 'error') summary.error++;
        else if (issue.severity === 'warning') summary.warning++;
    });
    
    return summary;
}

const DEP_PREFIX_TO_FILTER = 'hl7.fhir.extensions.r';

function filterDependencies(deps) {
    if (!deps) return {};

    if (!Array.isArray(deps) && typeof deps === 'object') {
        const filtered = {};
        for (const [k, v] of Object.entries(deps)) {
            if (!k.startsWith(DEP_PREFIX_TO_FILTER)) filtered[k] = v;
        }
        return filtered;
    }

    if (Array.isArray(deps)) {
        const normalized = {};
        for (const item of deps) {
            if (!item || typeof item !== 'object') continue;

            if (item.packageId && item.version) {
                if (!item.packageId.startsWith(DEP_PREFIX_TO_FILTER)) {
                    normalized[item.packageId] = item.version;
                }
                continue;
            }

            const keys = Object.keys(item);
            if (keys.length === 1) {
                const key = keys[0];
                if (!key.startsWith(DEP_PREFIX_TO_FILTER)) {
                    normalized[key] = item[key];
                }
                continue;
            }

            if (item.packageId) {
                const key = item.packageId;
                const ver = item.version || item.value || item[Object.keys(item)[0]];
                if (!key.startsWith(DEP_PREFIX_TO_FILTER)) normalized[key] = ver;
            }
        }
        return normalized;
    }

    return {};
}

export const generatePackageManifest = async () => {
    const igFilePath = path.join(getFshOutputFolder(), `ImplementationGuide-${readSushiConfig().id}.json`);
    const igResource = JSON.parse(fs.readFileSync(igFilePath, 'utf8'));
    
    // Simplified manifest generation without jsonata
    const packageManifest = {
        name: igResource.packageId,
        version: igResource.version,
        canonical: igResource.url,
        url: igResource.manifest?.rendering,
        title: igResource.title,
        description: igResource.description,
        fhirVersions: igResource.fhirVersion || [],
        author: igResource.publisher,
        license: igResource.license
    };

    if (igResource.dependsOn && igResource.dependsOn.length > 0) {
        const deps = {};
        igResource.dependsOn.forEach(dep => {
            deps[dep.packageId] = dep.version;
        });
        const filtered = filterDependencies(deps);
        if (Object.keys(filtered).length > 0) {
            packageManifest.dependencies = filtered;
        }
    }

    if (igResource.contact && igResource.contact.length > 0) {
        packageManifest.maintainers = igResource.contact.map(c => ({
            name: c.name,
            email: c.telecom?.find(t => t.system === 'email')?.value,
            url: c.telecom?.find(t => t.system === 'url')?.value
        }));
    }

    if (igResource.jurisdiction && igResource.jurisdiction.length > 0) {
        const coding = igResource.jurisdiction[0].coding?.find(c => c.system === 'urn:iso:std:iso:3166');
        if (coding) {
            packageManifest.jurisdiction = `${coding.system}#${coding.code}`;
        }
    }

    fs.writeFileSync(path.join(getFshOutputFolder(), 'package.json'), JSON.stringify(packageManifest, null, 2));
    return true;
}
