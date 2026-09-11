# 📜 Histórico de Versões — Quantora

Todas as alterações notáveis deste projeto são documentadas neste arquivo.

---

## [1.2.0] — Módulo de Física Clássica & Gráficos Interativos (2026-09-11)

### ⚛️ Módulo de Física Clássica & Mecânica Analítica
- **10 Modos de Resolução Passo a Passo:**
  1. **MRU (Movimento Retilíneo Uniforme):** Posição horária, velocidade constante e tempo.
  2. **MRUV & Torricelli:** Aceleração linear, distância e tempo de frenagem automática.
  3. **Queda Livre:** Altura inicial, aceleração da gravidade, tempo de queda e velocidade de impacto.
  4. **Lançamento Vertical:** Subida desacelerada, altura máxima, tempo total e velocidade de retorno.
  5. **Lançamento Horizontal:** Decomposição independente de Galileu, alcance horizontal e velocidade resultante.
  6. **Lançamento Oblíquo (Balística 2D):** Ângulo de disparo, alcance parabólico e ápice da trajetória.
  7. **MCU (Movimento Circular Uniforme):** Frequência, período, velocidade angular ($\omega$), velocidade linear e aceleração centrípeta.
  8. **MHS (Movimento Harmônico Simples):** Pêndulo simples e oscilador massa-mola com funções senoidais.
  9. **Plano Inclinado & Leis de Newton:** Decomposição $P_x$ e $P_y$, força normal, atrito estático/cinético e aceleração na rampa.
  10. **Conservação de Energia & Trabalho:** Energia cinética, potencial gravitacional e mecânica total; trabalho de forças constantes e potência mecânica (com conversões para CV e HP).
- **5 Motores de Gráficos SVG Vetoriais Interativos (`PhysicsChart.tsx`):**
  - Gráficos cartesianos temporais contínuos ($S \times t, v \times t$).
  - Balística 2D com solo pontilhado, solo $y=0$, nós interativos de ápice ($h_{max}$) e alcance horizontal ($A$).
  - Órbita circular com raio e vetores de velocidade e aceleração centrípeta.
  - Diagrama de corpo livre do plano inclinado com 5 vetores de força renderizados dinamicamente.
  - Gráficos de barras proporcionais para energias e trabalho.
- **Integração Completa:**
  - Aba de Física com ícone `Atom` na barra de navegação superior (`Navbar.tsx`).
  - Tipo `'physics'` integrado ao validador e persistência de Histórico (`HistoryModule.tsx`).
  - Suporte bilingue (Português e Inglês) em todos os modos e unidades.

### 🧪 Expansão e Qualidade de Testes
- **342 Testes Unitários Aprovados:** 17 suítes de teste executando 100% verde em Vitest.
- **Zero Avisos no Linter:** Oxlint aprovado com 0 erros e 0 avisos em 74 arquivos.
- **Build de Produção Limpo:** TypeScript strict mode compilado sem falhas.

---

## [1.1.1] — Atualização de Estabilidade, Segurança & Jules AI (2026-09-11)

### 🔥 Correção Crítica de Ofensiva (Streak Diário)
- **Data Local do Dispositivo:** A ofensiva agora é estritamente vinculada ao relógio local do usuário (`getDeviceLocalDateString`), evitando que noites (a partir das 21h em fusos como UTC-3) avancem o calendário indevidamente para o dia seguinte.
- **Prevenção de Falsos Incrementos:** Recarregar a tela (`F5`) ou reabrir o app agora executa apenas a manutenção passiva (`checkStreakMaintenance`); o streak **nunca** soma dias sem a conclusão de uma atividade real.

### 🌓 Temas & Internacionalização (i18n)
- **Modo Claro Instantâneo:** Correção na alternância entre temas Claro e Escuro, garantindo sincronização imediata no elemento raiz sem retenção de classes CSS.
- **Configurações 100% Bilíngues:** Mapeamento completo e reativo de todos os rótulos, botões e status do modal de Configurações em Português e Inglês.

### 🔒 Segurança & Confiabilidade (Contribuições Jules AI)
- **Proteção contra Sobrecarga (DoS):** Limite de 5MB no upload de arquivos de histórico com mensagem amigável de erro, prevenindo travamentos do navegador.
- **IDs Criptograficamente Seguros:** Geração de identificadores de histórico com `crypto.randomUUID()`.
- **Navegação Segura no Electron:** Validação rigorosa de URLs externas no `shell.openExternal` utilizando `parsedUrl.href`.

### ⚡ Performance & Qualidade de Código
- **Otimização de Expressões Regulares:** Reutilização de regex (`QUOTE_REGEX` no exportador CSV e `BOLD_REGEX` no passo a passo) em escopo de módulo para evitar recompilações em loops de renderização.
- **Log Semântico:** Uso de `console.error` para registro de falhas de registro do Service Worker.
- **Refatoração:** Criação da função auxiliar `showTemporaryStatus` no modal de configurações.

### 🧪 Expansão da Suíte de Testes (172 Testes)
- Nova suíte de testes unitários para o módulo `precision.ts` (`src/tests/precision.test.ts`).
- Novos testes para divisões por zero e tratamento de erros na Regra de Três Simples, Composta e Bhaskara.
- Cobertura expandida para 172 testes unitários em 12 suítes, 100% aprovados.

### 🤖 Automação & AGENTS.md
- Adicionado o manifesto `AGENTS.md` na raiz do projeto com diretrizes arquiteturais, regras de streak local e convenções para o agente autônomo Jules da Google.

---

## [1.1.0] — The Evolution Update (2026-09-10)

### 🏆 Conquistas & Troféus
- **16 Medalhas Desbloqueáveis:** Categorizadas em *Habilidade*, *Consistência*, *Mestria* e *Desafios*.
- **Vitrine no Perfil:** Acompanhe o progresso (X/16), filtros por categoria e status de bloqueado/desbloqueado.
- **Celebração em Tempo Real:** Alerta animado flutuante (*Achievement Toast*) com confetes coloridos.

### 📝 Lousa de Rascunho Digital (Scratchpad)
- Botão flutuante de lápis acessível em qualquer tela para rabiscos e cálculos rápidos.
- Suporte a toque (*touch*) e mouse com opções de caneta colorida e borracha.
- Persistência temporária ao fechar e reabrir.

### 📅 Desafio Diário (Daily Challenge)
- Motor determinístico de questões baseado na data ISO.
- Recompensa exclusiva de **+150 XP**, streak diário e contagem regressiva para a meia-noite.
- Botão de compartilhamento formatado para a área de transferência.

### ⚡ Modo Blitz (60 Segundos)
- Modo contra o relógio dinâmico: **+2s por acerto** e **-3s por erro**.
- Multiplicador de combo de XP progressivo ($1\times \to 2\times \to 3\times$).

### 👾 Batalha de Chefe Matemático (Boss Rush)
- Enfrente o Chefe com **100 HP** e proteja seus 3 escudos.
- Bônus de **dano crítico** por velocidade de resposta (<3s).

### 📱 Android & Infraestrutura
- Suporte a **Java 21** e **Android SDK 36** via Capacitor 8.
- Suíte completa de 149 testes unitários com Vitest.

---

## [1.0.6] (2026-09-10)
- 📱 **Compilação Oficial Android (.apk):** Integração com Capacitor 8, Java 21 e Android SDK 36.
- ⚙️ **Automação de Build:** Workflow dedicado no GitHub Actions para empacotar o APK assinado a cada versão.
- 🛠️ **Correções:** Ajuste na resolução de dependências no pipeline de integração contínua.

---

## [1.0.5] (2026-09-10)
- 🤖 **Integração com Jules:** Automação de revisão e merge inteligente com execução obrigatória da suíte Vitest.
- ⚡ **Otimização de Carregamento:** Redução de bundle com Vite e chunks dinâmicos.
- 🧪 **Testes:** Expansão da cobertura de testes para cálculos de fração e conversão.

---

## [1.0.4] (2026-09-10)
- 🎮 **Gamificação & Níveis:** Sistema de patentes matemáticas, cálculo de XP e barra de progressão de nível.
- 🔥 **Ofensiva Diária (Streak):** Monitoramento de dias consecutivos de estudo com bônus de XP.
- ⚙️ **Configurações:** Exibição dinâmica da versão instalada no modal de configurações.

---

## [1.0.3] (2026-09-10)
- 📈 **Gráficos 2D:** Renderização matemática aprimorada para funções quadráticas e parábolas.
- ♿ **Acessibilidade:** Navegação completa por teclado com foco visual nos campos de entrada.
- 🎨 **Interface:** Refinamento do contraste em temas escuros.

---

## [1.0.2] (2026-09-10)
- 🔄 **Atualizações Automáticas (Auto-Update):** Suporte ao Electron-Updater para download silencioso de updates no Windows.
- ⏱️ **Modo Quiz:** Novo motor de cronômetro com feedback sonoro/visual em respostas certas e erradas.

---

## [1.0.1] (2026-09-09)
- 🌐 **Internacionalização:** Suporte completo aos idiomas Português (Brasil) e Inglês (US) com troca dinâmica.

---

## [1.0.0] (2026-09-09)
- 🎉 **Lançamento Inicial Desktop:** Calculadora científica, gerador de gráficos 2D, conversor de unidades, fórmulas interativas e quiz matemático.

---

## 🔗 Navegação na Documentação (Obsidian)
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[Changelog & Historico de Bugs]]
* [[README]]
* [[Deploy & Releases]]