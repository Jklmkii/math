const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

console.log('1. Sincronizando frontend com o projeto Android...');
execSync('npm run cap:sync', { stdio: 'inherit' });

console.log('2. Compilando o APK Android com Gradle...');
const androidDir = path.join(__dirname, '..', 'android');
const isWindows = process.platform === 'win32';
const gradlewCmd = isWindows ? '.\\gradlew.bat' : './gradlew';

if (!isWindows) {
  try {
    execSync('chmod +x ./gradlew', { cwd: androidDir });
  } catch {
    // Ignore if not permitted
  }
}

execSync(`${gradlewCmd} assembleRelease`, {
  cwd: androidDir,
  stdio: 'inherit',
});

// Try finding app-release.apk or app-debug.apk
let apkSource = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(apkSource)) {
  const debugApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (fs.existsSync(debugApk)) {
    apkSource = debugApk;
  } else {
    throw new Error(`APK não encontrado em ${apkSource}`);
  }
}

const releaseDir = path.join(__dirname, '..', 'release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const destVersioned = path.join(releaseDir, `MathUtils-${pkg.version}.apk`);
const destGeneric = path.join(releaseDir, 'MathUtils.apk');

fs.copyFileSync(apkSource, destVersioned);
fs.copyFileSync(apkSource, destGeneric);

console.log('\n=============================================');
console.log('SUCESSO! APK gerado com êxito:');
console.log(` * ${destVersioned} (${(fs.statSync(destVersioned).size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(` * ${destGeneric}`);
console.log('=============================================\n');
