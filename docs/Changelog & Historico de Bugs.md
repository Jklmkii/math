# 📜 Histórico de Versões, Changelog & Resolução de Bugs

Este documento registra a evolução do **Quantora**, detalhando as versões publicadas, novos recursos e as análises forenses de bugs solucionados.

---

## 🚀 Linha do Tempo de Versões

### `v1.1.1` — *Estabilidade, Segurança & Jules AI* (Versão Atual)
* **Correção Crítica de Ofensiva (Streak):** Data vinculada estritamente ao relógio do dispositivo (`getDeviceLocalDateString`), evitando avanço prematuro de dia em fusos como UTC-3. Recarregamento de página/app (`F5`) agora apenas realiza checagem passiva (`checkStreakMaintenance`) e nunca incrementa a ofensiva sem atividade real.
* **Correções de Tema & i18n:** Alternância imediata entre Modo Claro e Escuro sem retenção de classe; modal de configurações 100% bilíngue (Português e Inglês).
* **Segurança Reforçada:** Limite de 5MB no upload de histórico JSON (prevenção contra DoS e travamento de navegador), identificadores de histórico com `crypto.randomUUID()` e validação rigorosa de URLs no Electron com `parsedUrl.href`.
* **Performance:** Reutilização de expressões regulares (`QUOTE_REGEX` no CSV e `BOLD_REGEX` no passo a passo) em escopo de módulo.
* **Expansão de Testes:** Cobertura de 172 testes unitários em 12 suítes com nova suíte para `precision.ts` e testes de divisão por zero.
* **Diretrizes de Agentes:** Adicionado `AGENTS.md` na raiz do repositório para o Google Jules.

### `v1.1.0` — *The Evolution Update*
* **Sistema de Conquistas (16 Medalhas):** Catálogo de troféus dividido em 4 categorias (Habilidade, Consistência, Mestria e Desafios), exibido na vitrine do Perfil.
* **Lousa de Rascunho (Scratchpad):** Ferramenta flutuante com HTML5 Canvas transparente para desenhar contas de cabeça diretamente na tela, com suporte a mouse e touch.
* **Desafio Diário Determinístico:** Questão diária universal baseada em semente PRNG Mulberry32 com hash FNV-1a da data (`YYYY-MM-DD`), recompensa de +150 XP e botão de compartilhamento social.
* **Modo Blitz (60 Segundos):** Jogo contra o relógio com bônus de acerto (+2s), penalidade de erro (-3s) e multiplicador de combo ($1\times \to 2\times \to 3\times$).
* **Batalha de Chefe Matemático (Boss Rush):** Confronto com chefe de 100 HP e 3 escudos do jogador, com golpes críticos para respostas em menos de 3s.
* **Expansão da Suíte de Testes:** Cobertura de 154 testes unitários automatizados com Vitest.

### `v1.0.1` — *Multiplatform & Refinements*
* Adicionado empacotador Electron para desktop Windows (instalador NSIS e versão portátil).
* Adicionada ponte Capacitor para compilação nativa em Android APK via Gradle.
* Suporte inicial a internacionalização (Português e Inglês).
* Gráfico interativo da parábola no cálculo de Bhaskara (`ParabolaChart.tsx`).

### `v1.0.0` — *Initial Release*
* Calculadora completa de Bhaskara com discriminante ($\Delta$), raízes reais e complexas.
* Calculadora didática de Regra de Três Simples (Direta e Inversa) e Regra de Três Composta multi-colunas.
* Histórico local de cálculos com persistência via Zustand e `localStorage`.
* Modo Treino aritmético básico (soma, subtração, multiplicação e divisão).

---

## 🐞 Registro Forense de Resolução de Bugs

### 1. 🐛 Bug do Streak Incrementando a Cada Recarregamento (`F5`)
* **Sintoma Relatado:** A cada vez que a página ou o aplicativo era recarregado, o contador de ofensiva (`streakDays`) aumentava em +1 dia, mesmo que o usuário não tivesse feito nenhuma atividade.
* **Diagnóstico & Causa Raiz:**
  1. **Divergência de Fuso Horário (UTC vs Local):** O código original usava `new Date().toISOString().split('T')[0]`. No Brasil (fuso UTC-3), a partir das 21:00 o horário UTC já correspondia ao dia seguinte. Logo, a diferença em relação à data anterior tornava-se `diffDays === 1`.
  2. **Conflito de Ciclo de Vida:** O componente `Navbar.tsx` executava `checkAndUpdateStreak()` em seu `useEffect` de montagem. A função invocava `calculateStreakUpdate()`, que foi projetada para *conclusão de atividade*, incrementando a ofensiva em vez de apenas manter a integridade passiva do streak.
* **Solução Definitiva:**
  * Criada a função `getDeviceLocalDateString()` em `leveling.ts`, extraindo ano, mês e dia locais do próprio aparelho do usuário (`date.getFullYear()`, `date.getMonth() + 1`, `date.getDate()`).
  * Criada a função passiva `checkStreakMaintenance()`: chamada na montagem do app. Se a última atividade foi hoje ou ontem (`diffDays <= 1`), o streak é preservado **sem nenhum incremento**. Se houve inatividade superior a 1 dia (`diffDays > 1`), o streak expira para 0.
  * O avanço ativo de ofensiva (`calculateStreakUpdate`) foi isolado estritamente para conclusões de atividades reais (ex: `completeDailyChallenge`).
  * Adicionados testes unitários no Vitest cobrindo todos os cenários de recarregamento e fuso horário.

---

### 2. 🐛 Bug do Tema Claro Permanecendo Escuro
* **Sintoma Relatado:** Ao alternar para o tema "Claro" no modal de configurações, a interface permanecia no visual escuro.
* **Causa Raiz:** A classe CSS `.dark` no elemento `<html>` (`document.documentElement`) não era removida caso estivesse previamente injetada pelo Tailwind.
* **Solução Definitiva:** Refatorado o `useEffect` no `App.tsx` para sincronizar explicitamente o elemento raiz com `document.documentElement.classList.toggle('dark', isDark)` e adicionar listeners para alteração dinâmica de preferências do sistema (`prefers-color-scheme: dark`).

---

### 3. 🐛 Bug de Idioma nas Configurações ao Selecionar Inglês
* **Sintoma Relatado:** Ao trocar o idioma para Inglês (`en`), os textos e seletores do modal de Configurações continuavam em Português.
* **Causa Raiz:** O componente `SettingsModal.tsx` possuía trechos de texto estáticos (*hardcoded*) que não consultavam o dicionário de traduções `translations.ts`.
* **Solução Definitiva:** Mapeadas todas as chaves de configuração no dicionário i18n (`t.settings.*`), tornando a alternância de idioma instantânea e fluída em todos os modais.

---

## 🔗 Links Relacionados
* [[Quantora - Visao Geral]]
* [[Gamificacao & Niveis]]
* [[Suite de Testes & Qualidade]]
