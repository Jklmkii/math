const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const [envOwner, envRepo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const OWNER = envOwner || 'Jklmkii';
const REPO = envRepo || 'quantora';

async function main() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Quantora-CI'
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  console.log(`Current version in package.json: ${pkg.version}`);

  // 1. Fetch all releases from GitHub
  let existingTags = [];
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100`, { headers });
    if (res.ok) {
      const releases = await res.json();
      existingTags = releases.map(r => r.tag_name).filter(Boolean);
    } else {
      console.warn(`Could not list GitHub releases (${res.status} ${res.statusText}), falling back to git tags.`);
    }
  } catch (err) {
    console.warn('Network error listing releases, falling back to git tags:', err.message);
  }

  // Fallback / merge with local git tags
  try {
    const localTags = execSync('git tag -l', { encoding: 'utf8' })
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    for (const tag of localTags) {
      if (!existingTags.includes(tag)) existingTags.push(tag);
    }
  } catch {
    // git tag error ignored
  }

  console.log(`Found ${existingTags.length} existing release tags on repository.`);

  let targetVersion = pkg.version;
  let targetTag = 'v' + targetVersion;
  let wasBumped = false;

  // Check if targetTag already exists
  if (existingTags.includes(targetTag)) {
    console.log(`Release tag ${targetTag} already exists. Finding next available patch version...`);

    const versionParts = pkg.version.split('.').map(n => parseInt(n, 10) || 0);
    const major = versionParts[0] || 1;
    const minor = versionParts[1] || 0;
    const patch = versionParts[2] || 0;

    // Scan all existing tags for matching major.minor.*
    const regex = new RegExp(`^v?${major}\\.${minor}\\.(\\d+)$`);
    let maxPatch = patch;
    for (const tag of existingTags) {
      const match = tag.match(regex);
      if (match) {
        const p = parseInt(match[1], 10);
        if (p > maxPatch) maxPatch = p;
      }
    }

    const nextPatch = maxPatch + 1;
    targetVersion = `${major}.${minor}.${nextPatch}`;
    targetTag = `v${targetVersion}`;
    wasBumped = true;

    console.log(`Auto-bumping version from ${pkg.version} to ${targetVersion} (${targetTag}).`);

    // Write updated version back to package.json
    pkg.version = targetVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

    // Also update package-lock.json if it exists
    const pkgLockPath = path.join(__dirname, '..', 'package-lock.json');
    if (fs.existsSync(pkgLockPath)) {
      try {
        const pkgLock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf8'));
        pkgLock.version = targetVersion;
        if (pkgLock.packages && pkgLock.packages['']) {
          pkgLock.packages[''].version = targetVersion;
        }
        fs.writeFileSync(pkgLockPath, JSON.stringify(pkgLock, null, 2) + '\n', 'utf8');
      } catch {}
    }
  } else {
    console.log(`Release tag ${targetTag} is new and ready for publication.`);
  }

  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `should_release=true\n`);
    fs.appendFileSync(outputFile, `bumped=${wasBumped}\n`);
    fs.appendFileSync(outputFile, `version=${targetVersion}\n`);
    fs.appendFileSync(outputFile, `tag=${targetTag}\n`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
