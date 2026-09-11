# 📌 Quantora — Decisões de Arquitetura & Estado Atual

Documento de persistência rápida de contexto e decisões de projeto para consultas do agente e histórico permanente.

---

## ⚡ Estado Atual do Projeto
* **Nome Oficial:** Quantora
* **Versão no Repositório:** `1.1.1` (Pronta para bump para `1.2.0`)
* **Branch Ativa:** `main` (Commit: `6eae161`)
* **Testes Automatizados:** 172 testes passando em 12 suítes (`100% verde`)
* **Build de Produção:** Vite + TypeScript compilando limpo (<500ms)

---

## 💎 Identidade Visual & Branding
* **Logotipo Aprovado:** Conceito 4 (Cristal/Troféu + Letra 'Q' em tons de azul, índigo e violeta com base geométrica).
* **Assets Integrados:**
  * `build/icon.ico` (camadas 16, 32, 48, 256px para Windows)
  * `build/icon.png` (256x256)
  * `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png`
  * `android/app/src/main/res/mipmap-*/` (todas as densidades do launcher)
  * `src/presentation/components/Navbar.tsx` (emblema oficial no header)

---

## ⚙️ Decisões Técnicas Principais
1. **Migração de Storage:** Em `src/store/useAppStore.ts`, se `mathutils-storage` existir e `quantora-storage` for nulo, os dados locais (XP, streaks, histórico e medalhas) são migrados na inicialização sem perda.
2. **Pacote Android:** `com.quantora.app`, com `MainActivity.java` sob `com/quantora/app/`.
3. **Desktop (Electron):** Título da janela padronizado e rotina de auto-update configurada para instaladores `Quantora-Setup-<ver>.exe`.
4. **Modos de Jogo:**
   * Desafio Diário determinístico (Mulberry32 seeded por data ISO).
   * Modo Blitz 60s (+2s acerto / -3s erro / combos até 3x).
   * Modo Batalha de Chefe (100 HP, 3 escudos).
   * Lousa de Rascunho (*Scratchpad*) em Canvas transparente.
   * Catálogo de 16 Conquistas (*Achievements*).

---

## 🎯 Protocolo de Economia de Tokens & Contexto
* **Persistir Primeiro no Obsidian:** Toda nova regra, configuração ou decisão deve ser registrada diretamente no cofre para evitar re-pesquisas caras.
* **Comunicação Enxuta:** Manter respostas concisas, diretas e objetivas, evitando redundâncias.

---

## 🔗 Links Relacionados
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[CHANGELOG]]
* [[README]]
* [[Deploy & Releases]]
