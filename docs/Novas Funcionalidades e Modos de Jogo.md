# 🎮 Novas Funcionalidades & Modos de Jogo — MathUtils

Documentação rápida das novas mecânicas de jogo, gamificação e utilidades implementadas na versão `v1.1.0` (*The Evolution Update*).

Para análises aprofundadas com fórmulas e código, consulte:
* [[Modos de Treino & Jogos]] — Análise detalhada dos motores de cálculo.
* [[Lousa de Rascunho (Scratchpad)]] — Arquitetura da lousa digital em HTML5 Canvas.
* [[Gamificacao & Niveis]] — Fórmulas de XP, títulos e catálogo das 16 Conquistas.

---

## 1. 🏅 Sistema Completo de Conquistas (16 Medalhas)
O aplicativo premia marcos de aprendizagem e regularidade:
* **Habilidade:** Primeiro Passo (`first_calculation`), Desafiante (`quiz_starter`), Relâmpago (`blitz_speedster`) e Precisão Cirúrgica (`crit_master`).
* **Consistência:** Foco Constante (`streak_3`), Hábito de Aço (`streak_7`), Compromisso Diário (`daily_starter`) e Guardião da Rotina (`daily_champion`).
* **Mestria:** Mestre de Bhaskara (`bhaskara_master`), Especialista em Proporção (`rule_three_expert`), Aprendiz Dedicado (`level_5`) e Mestre dos Números (`level_10`).
* **Desafios:** Sobrevivente (`survival_10`), Mente Criativa (`scratchpad_thinker`), Matador de Chefes (`boss_slayer`) e Invicto (`boss_flawless`).

Ao desbloquear qualquer conquista:
* Um alerta flutuante animado (`AchievementToast.tsx`) surge no topo/canto da tela.
* É disparada uma chuva de confetes (`canvas-confetti`).
* A conquista é salva permanentemente no perfil do jogador.

---

## 2. 📝 Lousa de Rascunho Digital (Scratchpad)
* Botão de lápis flutuante acessível no canto inferior direito sobre qualquer tela.
* Permite rabiscar livremente sobre a tela com HTML5 Canvas transparente.
* Oferece caneta com 5 opções de cores, borracha, botão de limpar e botão de minimizar (sem perder o desenho).
* Uso monitorado para desbloqueio da conquista *Mente Criativa*.

---

## 3. 📅 Desafio Diário (Daily Challenge)
* Questão determinística única gerada a partir da data (`YYYY-MM-DD`) via hash FNV-1a e PRNG Mulberry32.
* Concede **+150 XP**, avança a ofensiva diária e inclui botão para copiar o resultado formatado com emojis para redes sociais.
* Contador regressivo em tempo real até a meia-noite local para o próximo desafio.

---

## 4. ⚡ Modo Blitz (60 Segundos)
* Modo frenético contra o relógio: cada acerto adiciona **+2 segundos**, enquanto erros penalizam com **-3 segundos**.
* Multiplicadores de combo de XP ($1\times \to 2\times \to 3\times$) por sequências rápidas de acertos sem errar.

---

## 5. ⚔️ Batalha de Chefe Matemático (Boss Rush)
* Chefe com 100 Pontos de Vida (HP) e jogador com 3 escudos de proteção.
* Respostas corretas em menos de 3 segundos causam **ataques críticos** (30 a 35 de dano).
* Respostas normais causam 15 a 20 de dano; erros removem 1 escudo do jogador.
* Bônus especial de +350 XP para vitória perfeita (*Flawless*).

---

## 🔗 Links Relacionados
* [[MathUtils - Visao Geral]]
* [[Modos de Treino & Jogos]]
* [[Gamificacao & Niveis]]
* [[Dashboard]]
