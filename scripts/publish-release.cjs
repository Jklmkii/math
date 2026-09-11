const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN environment variable.');
  process.exit(1);
}
const OWNER = 'Jklmkii';
const { execSync } = require('child_process');
const REPO = 'math';
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const TAG = 'v' + pkg.version;

function getCommitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const msg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    return { hash, msg };
  } catch {
    return { hash: '', msg: '' };
  }
}

function getReleaseNotes(version) {
  const appName = pkg.productName || 'Quantora';
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  let bodyContent = '';
  if (fs.existsSync(changelogPath)) {
    const content = fs.readFileSync(changelogPath, 'utf8');
    const escaped = version.replace(/\./g, '\\.');
    const regex = new RegExp(`##\\s*\\[?v?${escaped}\\]?[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
    const match = content.match(regex);
    if (match && match[1].trim()) {
      bodyContent = match[1].replace(/\n---\s*$/, '').trim();
    }
  }

  const commitInfo = getCommitInfo();
  const commitLine = commitInfo.hash
    ? `\n\n**Commit Compilado:** \`${commitInfo.hash}\` — *${commitInfo.msg}*`
    : '';

  if (!bodyContent) {
    bodyContent = `- Atualizações, otimizações e novos recursos compilados a partir do commit mais recente.${commitLine}`;
  } else {
    bodyContent += commitLine;
  }

  return `## O que há de novo na Versão ${version}\n\n` + bodyContent + `\n\n### Arquivos disponíveis\n- \`${appName}-Setup-${version}.exe\` (Instalador oficial com auto-update)\n- \`${appName}-${version}-portable.exe\` (Versão portátil sem instalação)\n- \`${appName}.apk\` (Aplicativo para Android)`;
}

async function main() {
  const appName = pkg.productName || 'Quantora';
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': `${appName}-Publisher`
  };

  const changelogContent = fs.existsSync(path.join(__dirname, '..', 'CHANGELOG.md'))
    ? fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8')
    : '';
  const titleMatch = changelogContent.match(new RegExp(`##\\s*\\[?v?${pkg.version.replace(/\\./g, '\\.')}\\]?\\s*—\\s*([^\\n(]*)`));
  const commitInfo = getCommitInfo();
  let subtitle = titleMatch && titleMatch[1].trim() ? titleMatch[1].trim() : '';
  if (!subtitle && commitInfo.msg && !commitInfo.msg.startsWith('chore(release)')) {
    subtitle = commitInfo.msg;
  }
  if (!subtitle) {
    subtitle = 'Atualizações e melhorias';
  }
  const releaseTitle = `${appName} ${TAG} — ${subtitle}`;
  const releaseBody = getReleaseNotes(pkg.version);

  console.log(`Checking existing releases for ${OWNER}/${REPO}...`);
  const listRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, { headers });
  if (!listRes.ok) {
    throw new Error(`Failed to list releases: ${listRes.status} ${listRes.statusText}`);
  }
  const releases = await listRes.json();
  let targetRelease = releases.find(r => r.tag_name === TAG);

  if (!targetRelease) {
    console.log(`Creating release ${TAG}...`);
    const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${errText}`);
    }
    targetRelease = await createRes.json();
    console.log(`Release ${TAG} created with ID ${targetRelease.id}.`);
  } else {
    console.log(`Release ${TAG} already exists (ID: ${targetRelease.id}). Updating release notes...`);
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${targetRelease.id}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: releaseBody
      })
    });
  }

  const uploadBaseUrl = targetRelease.upload_url.split('{')[0];
  const releaseDir = path.join(__dirname, '..', 'release');
  const filesToUpload = [
    { name: 'latest.yml', type: 'application/x-yaml' },
    { name: `${appName}-Setup-${pkg.version}.exe.blockmap`, type: 'application/octet-stream' },
    { name: `${appName}-Setup-${pkg.version}.exe`, type: 'application/octet-stream' },
    { name: `${appName}-${pkg.version}-portable.exe`, type: 'application/octet-stream' },
    { name: `${appName}-${pkg.version}.apk`, type: 'application/vnd.android.package-archive' },
    { name: `${appName}.apk`, type: 'application/vnd.android.package-archive' }
  ];

  for (const file of filesToUpload) {
    const filePath = path.join(releaseDir, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filePath} not found, skipping.`);
      continue;
    }

    const existingAsset = (targetRelease.assets || []).find(a => a.name === file.name);
    if (existingAsset) {
      console.log(`Asset ${file.name} already exists (ID ${existingAsset.id}), deleting before re-upload...`);
      await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers
      });
    }

    console.log(`Uploading ${file.name} (${(fs.statSync(filePath).size / (1024*1024)).toFixed(2)} MB)...`);
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    const uploadRes = await fetch(`${uploadBaseUrl}?name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': file.type,
        'Content-Length': fileSize.toString(),
        'User-Agent': `${appName}-Publisher`
      },
      body: fileStream,
      duplex: 'half'
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error(`Failed to upload ${file.name}: ${uploadRes.status} ${err}`);
    } else {
      console.log(`Successfully uploaded ${file.name}!`);
    }
  }

  console.log('\n--- Release publication completed successfully! ---');
}

main().catch(err => {
  console.error('Error publishing release:', err);
  process.exit(1);
});
