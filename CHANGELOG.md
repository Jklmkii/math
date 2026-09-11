# 📜 Histórico de Versões — MathUtils

Todas as alterações notáveis deste projeto são documentadas neste arquivo.

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