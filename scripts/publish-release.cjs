const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN environment variable.');
  process.exit(1);
}
const OWNER = 'Jklmkii';
const REPO = 'math';
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const TAG = 'v' + pkg.version;

function getReleaseNotes(version) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const content = fs.readFileSync(changelogPath, 'utf8');
    const escaped = version.replace(/\./g, '\\.');
    const regex = new RegExp(`##\\s*\\[?v?${escaped}\\]?[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
    const match = content.match(regex);
    if (match && match[1].trim()) {
      return `## O que há de novo na Versão ${version}\n\n` + match[1].trim() + `\n\n### Arquivos disponíveis\n- \`MathUtils-Setup-${version}.exe\` (Instalador oficial com auto-update)\n- \`MathUtils-${version}-portable.exe\` (Versão portátil sem instalação)\n- \`MathUtils.apk\` (Aplicativo para Android)`;
    }
  }
  return `## Novidades da versão ${version}\n\n- Atualizações de desempenho, recursos e estabilidade geral.\n\n### Arquivos disponíveis\n- \`MathUtils-Setup-${version}.exe\`\n- \`MathUtils-${version}-portable.exe\`\n- \`MathUtils.apk\``;
}

async function main() {
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MathUtils-Publisher'
  };

  const releaseTitle = `MathUtils ${TAG} — Atualizações e melhorias`;
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
    { name: `MathUtils-Setup-${pkg.version}.exe.blockmap`, type: 'application/octet-stream' },
    { name: `MathUtils-Setup-${pkg.version}.exe`, type: 'application/octet-stream' },
    { name: `MathUtils-${pkg.version}-portable.exe`, type: 'application/octet-stream' },
    { name: `MathUtils-${pkg.version}.apk`, type: 'application/vnd.android.package-archive' },
    { name: 'MathUtils.apk', type: 'application/vnd.android.package-archive' }
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
        'User-Agent': 'MathUtils-Publisher'
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
