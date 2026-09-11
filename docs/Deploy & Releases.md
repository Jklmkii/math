# 📦 Deploy, Releases & Automação Multiplataforma (CI/CD)

Todo o pipeline de compilação, empacotamento desktop/mobile e distribuição é automatizado via scripts locais e GitHub Actions no repositório oficial [`Jklmkii/math`](https://github.com/Jklmkii/math).

---

## 💻 1. Distribuição Desktop Windows (Electron)

Arquivos de configuração:
* `electron/main.cjs` — Processo principal com ciclo de vida da janela, segurança e atualizador.
* `electron/preload.cjs` — Bridge de segurança segura com `contextBridge.exposeInMainWorld()`.
* `scripts/build-electron.cjs` — Script de orquestração de build.

### 🔨 Comandos de Compilação Local
```powershell
# Executar em modo de desenvolvimento (Vite + Electron com HMR)
npm run electron:dev

# Gerar instalador executável (.exe) de produção
npm run electron:build
```

### 📦 Artefatos Gerados no Diretório `release/`:
* `MathUtils-Setup-1.1.1.exe` — Instalador padrão via NSIS com criação de atalhos e desinstalador limpo.
* `MathUtils-1.1.1-portable.exe` — Versão portátil autocontida que roda diretamente sem instalação.
* `latest.yml` — Manifesto criptográfico de hash e versão consumido pelo `electron-updater`.

---

## 📱 2. Distribuição Mobile Android (Capacitor 8)

Arquivos de configuração:
* `capacitor.config.ts` — Identificador do pacote (`com.mathutils.app`), nome e configurações da WebView.
* `android/` — Projeto nativo Android em Gradle e Java 21.
* `scripts/build-apk.cjs` — Script de automação do build Android.

### 🔨 Comandos de Compilação Local
```powershell
# Sincronizar os arquivos web compilados com a pasta nativa Android
npm run cap:sync

# Abrir o projeto no Android Studio
npm run cap:android

# Compilar diretamente o APK de produção via Gradle CLI
npm run apk:build
```

### 📱 Requisitos do Ambiente de Build
* **Java Development Kit (JDK):** Versão 21 (`JAVA_HOME` configurado).
* **Android SDK:** API Level 36 (Build Tools 36.x).
* **Gradle:** 8.x compatível com Capacitor 8.

---

## 🤖 3. Pipelines de Automação no GitHub Actions

O repositório possui 3 workflows em `.github/workflows/`:

### 1. `release.yml` (Windows Build & Release)
* **Gatilho:** Disparado em pushes na branch `main` ou criação de tags `v*`.
* **Ações:**
  1. Instala dependências e roda `npx vitest run`.
  2. Compila a aplicação com `npm run build`.
  3. Executa o `electron-builder` em ambiente Windows Server.
  4. Publica os binários `.exe` e o arquivo `latest.yml` diretamente nas Releases do GitHub.

### 2. `build-apk.yml` (Android Build & Upload)
* **Gatilho:** Disparado em conjunto nos releases ou disparado manualmente via `workflow_dispatch`.
* **Ações:**
  1. Prepara o ambiente Java 21 e Android SDK 36.
  2. Executa `npx cap sync android`.
  3. Compila `gradlew assembleRelease`.
  4. Assina o APK gerado e faz upload para a página de Releases do repositório.

### 3. `auto-merge-jules.yml` (Agente Jules AI)
* **Gatilho:** Criação ou atualização de Pull Requests abertos pelo bot/agente Jules da Google.
* **Ações:**
  1. Executa a suíte de 154 testes com Vitest.
  2. Executa o linter `oxlint`.
  3. Se todos os testes passarem, aprova e faz o merge automático (*squash & merge*) na branch `main`.

---

## 🔑 4. Autenticação Segura & Git Push via PAT

Para envios remotos via terminal no Windows sem interrupções por pop-ups do Git Credential Manager:
* Utilizar o Personal Access Token (PAT) registrado em [[Credenciais & Tokens]].
* Comando padrão:
  ```powershell
  git push https://<YOUR_GITHUB_PAT>@github.com/Jklmkii/math.git main
  ```

---

## 🔗 Links Relacionados
* [[MathUtils - Visao Geral]]
* [[Mapa de Dependencias]]
* [[Credenciais & Tokens]]
* [[Suite de Testes & Qualidade]]
