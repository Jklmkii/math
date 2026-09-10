const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('1. Compilando o frontend React...');
execSync('tsc -b && vite build', { stdio: 'inherit' });

const tempOutputDir = path.join(os.tmpdir(), 'mathutils-electron-build');
if (fs.existsSync(tempOutputDir)) {
  try {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore
  }
}

console.log(`2. Empacotando com electron-builder na pasta isolada: ${tempOutputDir}`);

try {
  // Run electron-builder targeting the temp folder to avoid OneDrive file locking on intermediate unpack directories
  execSync(`npx electron-builder --win -c.directories.output="${tempOutputDir.replace(/\\/g, '/')}"`, {
    stdio: 'inherit',
  });

  const projectReleaseDir = path.join(__dirname, '../release');
  if (!fs.existsSync(projectReleaseDir)) {
    fs.mkdirSync(projectReleaseDir, { recursive: true });
  }

  console.log('3. Copiando executáveis finais para a pasta release/ do projeto...');
  const files = fs.readdirSync(tempOutputDir);
  for (const file of files) {
    if (file.endsWith('.exe') || file.endsWith('.yml') || file.endsWith('.blockmap')) {
      const src = path.join(tempOutputDir, file);
      const dest = path.join(projectReleaseDir, file);
      fs.copyFileSync(src, dest);
      console.log(` -> Copiado para release/: ${file}`);
    }
  }

  console.log('\n=============================================');
  console.log('SUCESSO! Executáveis gerados com êxito na pasta release/:');
  files.filter((f) => f.endsWith('.exe')).forEach((f) => console.log(` * ${f}`));
  console.log('=============================================\n');
} finally {
  try {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
  } catch (e) {
    // Cleanup temporary intermediate files
  }
}
