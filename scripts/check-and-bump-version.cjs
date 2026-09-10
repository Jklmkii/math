const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const OWNER = 'Jklmkii';
const REPO = 'math';

async function main() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentTag = 'v' + pkg.version;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MathUtils-CI'
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  console.log(`Checking if release ${currentTag} already exists...`);
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${currentTag}`, { headers });

  if (res.status === 200) {
    console.log(`Release ${currentTag} already exists. Automatically bumping patch version...`);
    execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });
    const updatedPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`Bumped version from ${pkg.version} to ${updatedPkg.version}`);

    try {
      execSync('git config user.name "github-actions[bot]"');
      execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
      execSync('git add package.json');
      if (fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))) {
        execSync('git add package-lock.json');
      }
      execSync(`git commit -m "chore(release): bump version to v${updatedPkg.version} [skip ci]"`);
      execSync('git push origin main');
      console.log(`Pushed version bump to main.`);
    } catch (e) {
      console.warn('Git commit/push skipped or failed:', e.message);
    }
  } else {
    console.log(`Release ${currentTag} does not exist yet. Proceeding with version ${pkg.version}.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
