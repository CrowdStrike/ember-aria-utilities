/**
 * Hoping this is a temporary workaround due to the issues described below with
 * dependenciesMeta injection.
 *
 * This sync file forces pnpm to hard link the dependencies one way or another
 * so that we don't have to continually `pnpm i -f` anytime we make a change
 * in the addon source and want to see it in the test-app/docs-app.
 *
 * - https://github.com/vercel/turbo/issues/2306#issuecomment-1433561563
 * - https://github.com/pnpm/pnpm/issues/4965
 */
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

import { getPackages } from '@manypkg/get-packages';
import { findRoot } from '@manypkg/find-root';
import { readJson, pathExists } from 'fs-extra/esm';
import { hardLinkDir } from '@pnpm/fs.hard-link-dir';
import resolvePackagePath from 'resolve-package-path';

const require = createRequire(import.meta.url);

const syncDir = './dist';

export default async function syncPnpm(dir = process.cwd()) {
  const root = await findRoot(dir);
  const ownPackageJson = await readJson(join(dir, 'package.json'));
  const ownDependencies = [
    ...Object.keys(ownPackageJson.dependencies ?? {}),
    ...Object.keys(ownPackageJson.devDependencies ?? {}),
  ];

  const localPackages = (await getPackages(root.rootDir)).packages;

  const packagesToSync = localPackages.filter(
    (p) =>
      p.packageJson.name !== 'sync-pnpm' &&
      ownDependencies.includes(p.packageJson.name)
  );

  for (const pkg of packagesToSync) {
    const syncFrom = join(pkg.dir, syncDir);
    const resolvedPackagePath = dirname(
      resolvePackagePath(pkg.packageJson.name, dir)
    );
    const syncTo = join(resolvedPackagePath, syncDir);

    if (await pathExists(syncFrom)) {
      await hardLinkDir(syncFrom, [syncTo]);
    }
  }
}
