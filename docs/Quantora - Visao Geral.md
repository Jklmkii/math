# 🧮 Quantora — Visão Geral do Projeto

Aplicativo educacional gamificado para treinamento mental, resolução passo a passo de problemas matemáticos e desafios cronometrados, com suporte nativo multiplataforma (Web, Desktop Windows e Android APK).

**Versão Atual:** `v1.1.1` *(Estabilidade, Segurança, Streak Local & Jules AI)*
**Repositório Oficial:** [`github.com/Jklmkii/math`](https://github.com/Jklmkii/math)
**Licença:** Proprietária / Pessoal
**Autor:** Lucas

---

## 🧭 Índice da Documentação (Obsidian Vault)

Toda a documentação técnica, fórmulas, arquitetura de software e guias operacionais estão organizados nos seguintes documentos:

1. [[Quantora - Visao Geral]] — Esta nota (painel geral e índice).
2. [[Nucleo Matematico & Calculadoras]] — Resolução passo a passo de Bhaskara, Regra de Três Simples e Composta, raízes complexas e precisão com `big.js`.
3. [[Modos de Treino & Jogos]] — Modo Treino (MatSpeed e Sobrevivência), Desafio Diário determinístico, Modo Blitz 60s e Batalha de Chefe Matemático.
4. [[Lousa de Rascunho (Scratchpad)]] — Camada de desenho digital em HTML5 Canvas transparente com suporte a touch e mouse.
5. [[Gamificacao & Niveis]] — Fórmulas matemáticas de XP por nível, 6 patentes (PT/EN), catálogo das 16 Conquistas e motor de Ofensiva Diária (Streak) atrelado à data local do dispositivo.
6. [[Arquitetura de Estado & Persistencia]] — Gerenciamento de estado global com Zustand, persistência em `localStorage`, validador de schema (`historyValidator`) e integridade de dados.
7. [[Interface, Temas & Design System]] — Tailwind CSS v4, sistema de temas (Claro/Escuro/Sistema), internacionalização (PT/EN), acessibilidade e modais.
8. [[Deploy & Releases]] — Pipelines de build no GitHub Actions, compilação de instaladores Windows (`.exe` NSIS e portátil), APK Android assinado e agente Jules AI.
9. [[Mapa de Dependencias]] — Diagrama arquitetural Mermaid de dependências de produção, desenvolvimento e plataformas.
10. [[Suite de Testes & Qualidade]] — Vitest com 154 testes unitários em 11 suítes, testes de estresse de PRNG, oxlint e auditoria de código.
11. [[Changelog & Historico de Bugs]] — Linha do tempo detalhada das versões v1.0.0 a v1.1.0 e resolução forense de bugs (streak, tema, i18n).

---

## 🛠️ Stack Tecnológica Completa

| Camada | Tecnologias & Bibliotecas |
| :--- | :--- |
| **Frontend Core** | React 19.2, TypeScript 6.0, Vite 8.2 |
| **Estilização & UI** | Tailwind CSS v4.3, `@tailwindcss/vite`, Lucide React, Canvas-Confetti |
| **Estado & Persistência** | Zustand 5.0, `localStorage` com validação de schema customizada |
| **Aritmética & Precisão** | `big.js` (operações sem erros de ponto flutuante IEEE 754) |
| **Desktop (Windows)** | Electron 44.3, Electron-Builder 26.15, Electron-Updater 6.8 |
| **Mobile (Android)** | Capacitor 8.5, Android SDK 36, Gradle 8.x, Java 21 |
| **Qualidade & Testes** | Vitest 5.0, Oxlint 1.79 |
| **CI/CD & Automação** | GitHub Actions, Jules AI (auto-merge), PAT Authentication |

---

## 📂 Árvore de Diretórios do Projeto

```
matematica-app/
├── .github/
│   └── workflows/             # Pipelines CI/CD (release.yml, build-apk.yml, auto-merge-jules.yml)
├── android/                   # Projeto nativo Android gerado pelo Capacitor
├── build/                     # Ícones (.ico, .png) para instaladores
├── electron/
│   ├── main.cjs               # Processo principal do Electron (janela, auto-update, IPC)
│   └── preload.cjs            # Bridge de segurança contextBridge (exposição seletiva da API)
├── scripts/                   # Utilitários de build (build-electron.cjs, build-apk.cjs, etc.)
├── src/
│   ├── core/
│   │   ├── daily/             # dailyEngine.ts (PRNG FNV-1a + Mulberry32)
│   │   ├── gamification/      # leveling.ts (XP, níveis, streak local, conquistas)
│   │   ├── i18n/              # translations.ts (dicionário PT/EN completo)
│   │   ├── math/              # bhaskara.ts, regraDeTresSimples.ts, regraDeTresComposta.ts, precision.ts
│   │   ├── quiz/              # quizGenerator.ts, blitzEngine.ts, bossEngine.ts
│   │   └── storage/           # historyValidator.ts (validação de schema JSON)
│   ├── presentation/
│   │   ├── components/        # Navbar, Scratchpad, BlitzGame, BossBattle, ProfileModal, Toasts...
│   │   └── modules/           # BhaskaraModule, RegraDeTresModule, QuizModule, HistoryModule
│   ├── store/
│   │   └── useAppStore.ts     # Store global Zustand com persistência
│   ├── tests/                 # 11 suítes de testes unitários (154 testes com Vitest)
│   ├── types/                 # Definições centrais de tipagem TypeScript
│   ├── App.tsx                # Componente raiz com roteamento de abas e modais
│   └── main.tsx               # Ponto de entrada React
├── package.json
└── vite.config.ts
```

---

## 🔗 Navegação Rápida
* [[Dashboard]] — Painel Central do Obsidian Vault.
* [[Gamificacao & Niveis]] — Fórmulas e Conquistas.
* [[Deploy & Releases]] — Automação de Builds.
