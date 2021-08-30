import got from 'got';
import { NPMDependencies, NPMPackage } from './types';
import { maxSatisfying } from 'semver';
import pLimit from 'p-limit';

const connectionPool = pLimit(32);

export async function getNpmData(name: string): Promise<NPMPackage | null> {
  const request = connectionPool(() => got(`https://registry.npmjs.org/${name}`, { retry: 0, throwHttpErrors: false }));
  // throws only if no server response
  const { statusCode, body } = await request;
  if (statusCode === 200) {
    return JSON.parse(body);
  } else if (statusCode === 404 && body === '{"error":"Not found"}') {
    return null;
  }
  // handle unexpected server response
  throw new Error(`Server rejected with status:${statusCode}\n${body}`);
}

export async function getDependencies(name: string, version: string): Promise<NPMDependencies | null> {
  const npmData = await getNpmData(name);
  if (npmData) {
    const npmVersionData = npmData?.versions?.[version];
    if (npmVersionData) {
      return npmVersionData.dependencies || {};
    }
  }
  return null;
}

export async function getDependenciesDeep(name: string, version: string): Promise<NPMDependencies | null> {
  // TODO unroll to avoid duplicated call for each package to getNpmData() unless memoized
  const dependencies = await getDependencies(name, version);
  if (dependencies) {
    // traverse list, triggering retrievals in parallel (limited by connectionPool)
    const dependencyRecords = await Promise.all(
      Object.entries(dependencies).map(async ([ desiredName, desiredVersion ]) => {
        const desiredEntry = await getNpmData(desiredName);
        const availableVersions = desiredEntry?.versions;
        if (availableVersions) {
          const maxVersion = maxSatisfying(Object.keys(availableVersions), desiredVersion);
          if (maxVersion) {
            const maxVersionDependencies = await getDependenciesDeep(desiredName, maxVersion);
            return {
              name: desiredName,
              version: maxVersion,
              dependencies: maxVersionDependencies,
            };
          }
        }
        throw new Error(`Package ${name} has non-existent dependency ${desiredName}:${desiredVersion}`);
      })
    );
    // transform list to map
    const dependencyTree = {};
    for (const { name, version, dependencies } of dependencyRecords) {
      dependencyTree[name] = { version, dependencies };
    }
    return dependencyTree;
  }
  return null;
}
