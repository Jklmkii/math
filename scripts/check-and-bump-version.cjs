const fs = require('fs');
const path = require('path');

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

  const outputFile = process.env.GITHUB_OUTPUT;

  if (res.status === 200) {
    console.log(`Release ${currentTag} already exists. Skipping build and release.`);
    if (outputFile) {
      fs.appendFileSync(outputFile, `should_release=false\n`);
    }
  } else {
    console.log(`Release ${currentTag} does not exist yet. Proceeding with release of version ${pkg.version}.`);
    if (outputFile) {
      fs.appendFileSync(outputFile, `should_release=true\n`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
