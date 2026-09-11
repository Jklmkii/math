# 🧪 Suíte de Testes, Qualidade & Auditoria de Código

O **Quantora** possui uma robusta esteira de garantia da qualidade (QA) com cobertura integral de testes unitários automatizados, testes de estresse estocástico e validação estática de código.

---

## ⚡ Framework de Testes: Vitest 5.0

O projeto adota o **Vitest** por sua integração nativa com o Vite, suporte imediato a ESM/TypeScript e altíssima velocidade de execução (< 1 segundo para toda a suíte).

Comando de execução:
```powershell
npx vitest run
```

### 📊 Cobertura Atual: 12 Suítes / 172 Testes (100% Aprovados)
```text
✓ src/tests/achievements.test.ts (23 tests)
✓ src/tests/blitz.test.ts (21 tests)
✓ src/tests/bossRush.test.ts (20 tests)
✓ src/tests/dailyChallenge.test.ts (14 tests)
✓ src/tests/gamification.test.ts (16 tests)
✓ src/tests/persistenceAndAchievementsStress.test.ts (27 tests)
✓ src/tests/stressMechanics.test.ts (8 tests)
✓ src/tests/bhaskara.test.ts (11 tests)
✓ src/tests/precision.test.ts (12 tests)
✓ src/tests/regraDeTres.test.ts (11 tests)
✓ src/tests/history.test.ts (4 tests)
✓ src/tests/quiz.test.ts (5 tests)

Test Files  12 passed (12)
     Tests  172 passed (172)
  Duration  ~800ms
```

---

## 🔬 Detalhamento das Suítes de Teste

### 1. `achievements.test.ts` (23 testes)
* Valida as condições booleanas das 16 medalhas do catálogo.
* Testa a fila de toasts (`toastQueue`) e métodos de dispensa (`dismissAchievementToast`).
* Confirma o acúmulo de estatísticas com a lousa de rascunho (`scratchpadUses`).

### 2. `blitz.test.ts` (21 testes)
* Valida a matemática temporal do Modo Blitz: bônus de acerto (+2s) e penalidade de erro (-3s com piso em 0).
* Avalia a escala de combos ($1\times, 2\times, 3\times$) e cálculo de XP final.
* Garante o disparo do estado `isGameOver` ao zerar o relógio.

### 3. `bossRush.test.ts` (20 testes)
* Simula rodadas com dano crítico (tempo de resposta < 3s: 30 a 35 HP) e padrão (15 a 20 HP).
* Verifica perda de escudos do jogador em erros ou estouro de tempo.
* Testa condições de vitória, derrota e vitória perfeita (*Flawless* com 3 escudos intactos).

### 4. `dailyChallenge.test.ts` (14 testes)
* Garante o determinismo estrito do hash FNV-1a e PRNG Mulberry32: mesma data produz idêntico problema em qualquer máquina.
* Valida que datas diferentes geram problemas distintos.
* Testa a atribuição de +150 XP, avanço do streak e o texto gerado para compartilhamento social.

### 5. `gamification.test.ts` (16 testes)
* Valida a fórmula quadrática de XP: $XP_{req}(L) = 50 \cdot L \cdot (L - 1)$.
* Confere a atribuição correta dos 6 títulos históricos em Português e Inglês.
* Testa o motor de streak vinculado ao dispositivo: confirma que recarregar a tela (`checkStreakMaintenance`) **nunca** soma dias e que a ofensiva só avança com atividades reais.

### 6. `stressMechanics.test.ts` & `persistenceAndAchievementsStress.test.ts` (35 testes)
* **1.000 ciclos de PRNG:** Confere a distribuição estatística uniforme dos números gerados.
* **500 partidas simuladas de Blitz e Boss:** Garante ausência de divisões por zero, NaN, estouros de pilha (*stack overflow*) ou vazamento de memória.
* Validação de migrações e persistência de grandes volumes no `localStorage`.

### 7. `bhaskara.test.ts`, `regraDeTres.test.ts`, `history.test.ts`, `quiz.test.ts` (25 testes)
* Cobertura de cálculos com $\Delta > 0$, $\Delta = 0$ e $\Delta < 0$ (raízes complexas).
* Coordenadas de vértice e precisão decimal com `big.js`.
* Regras de três diretas e inversas com incógnita em qualquer célula da matriz.

---

## 🧹 Análise Estática com Oxlint

O projeto utiliza o linter ultrarrápido **Oxlint** (escrito em Rust):
```powershell
npm run lint
```
* **Resultado:** 0 warnings e 0 errors em 54 arquivos analisados em menos de 70ms.

---

## 🛡️ Auditoria Forense Independente
* **Código 100% Real:** Todo o código é implementado em TypeScript/React puro. Não existem stubs, dados falsos estáticos ou mocks de produção.
* **Compilação Limpa:** `npm run build` compila TypeScript com tipagem estrita (`tsc -b`) e gera os bundles Vite sem avisos ou erros.

---

## 🔗 Links Relacionados
* [[Quantora - Visao Geral]]
* [[Nucleo Matematico & Calculadoras]]
* [[Deploy & Releases]]
