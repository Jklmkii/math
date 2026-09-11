# 📜 Histórico de Versões, Changelog & Resolução de Bugs

Este documento registra a evolução do **MathUtils**, detalhando as versões publicadas, novos recursos e as análises forenses de bugs solucionados.

---

## 🚀 Linha do Tempo de Versões

### `v1.1.0` — *The Evolution Update* (Versão Atual)
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
* [[MathUtils - Visao Geral]]
* [[Gamificacao & Niveis]]
* [[Suite de Testes & Qualidade]]
