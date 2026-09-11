# 📝 Lousa de Rascunho Digital (Scratchpad)

A **Lousa de Rascunho** (*Scratchpad*) é uma ferramenta flutuante de rabisco e cálculo intermediário que permite ao usuário rascunhar contas de cabeça diretamente sobre a interface do aplicativo, sem precisar de papel ou calculadora externa.

Arquivo-fonte: `src/presentation/components/Scratchpad.tsx`

---

## 🎨 Arquitetura Técnica & Canvas HTML5

O componente renderiza uma camada transparente com aceleração gráfica via elemento `<canvas>`:

* **Eventos de Ponteiro Unificados (`PointerEvent`):**
  Utiliza `onPointerDown`, `onPointerMove` e `onPointerUp` com `touch-action: none`. Isso garante suporte simultâneo e uniforme para:
  * Mouse convencional no Desktop Windows.
  * Toque com os dedos em smartphones e tablets Android.
  * Canetas Stylus (Apple Pencil, S-Pen ou Surface Pen) com precisão de coordenadas.
* **Resolução Dinâmica:** O canvas ajusta suas dimensões físicas (`width`/`height`) conforme a escala de densidade de pixels (`window.devicePixelRatio`), prevenindo traços borrados em telas Retina ou telas mobile de alta densidade.

---

## 🛠️ Controles & Ferramentas

| Ferramenta | Ícone | Função |
| :--- | :---: | :--- |
| **Caneta** | ✏️ | Desenha traços contínuos suaves com `lineCap = 'round'` e `lineJoin = 'round'`. |
| **Paleta de Cores** | 🎨 | Permite alternar entre 5 cores contrastantes (Grafite/Branco, Índigo, Esmeralda, Rosa e Âmbar). |
| **Borracha** | 🧹 | Ativa o modo de limpeza seletiva com raio expandido (`globalCompositeOperation = 'destination-out'`). |
| **Limpar Lousa** | 🗑️ | Executa `ctx.clearRect(0, 0, width, height)` limpando toda a superfície em 1 clique. |
| **Minimizar / Fechar**| ➖ | Oculta a lousa preservando o bitmap desenhado em memória (não perde o rascunho temporário). |

---

## 🎮 Integração com a Gamificação

* Cada abertura da lousa dispara a ação `incrementScratchpadUse()` na store global (`useAppStore.ts`).
* O contador de uso é acumulado no perfil do usuário: `profile.stats.scratchpadUses`.
* Ao atingir **3 utilizações**, desbloqueia automaticamente a conquista:
  * ✏️ **Mente Criativa (`scratchpad_thinker`)** — Recompensa: **+100 XP**.

---

## 🔗 Links Relacionados
* [[MathUtils - Visao Geral]]
* [[Gamificacao & Niveis]]
* [[Modos de Treino & Jogos]]
