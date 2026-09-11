# 🎨 Interface, Temas & Design System

Este documento detalha o sistema de design, estilos, componentes modulares e suporte a temas e internacionalização no **MathUtils**.

Arquivos-fonte:
* `src/presentation/components/*`
* `src/presentation/modules/*`
* `src/core/i18n/translations.ts`
* `src/App.tsx`

---

## ⚡ Estilização com Tailwind CSS v4

O projeto adota o **Tailwind CSS v4** integrado ao Vite via `@tailwindcss/vite`:
* Compilação instantânea no CSS engine Rust.
* Design Tokens baseados na paleta Slate, Indigo, Emerald, Rose e Amber.
* Variáveis CSS dinâmicas para suporte fluído a temas claros e escuros.
* Utilitários `clsx` e `tailwind-merge` para composição condicional de classes.

---

## 🌓 Gestão de Temas (Claro, Escuro e Sistema)

O usuário pode escolher entre três comportamentos no modal de Configurações:
1. **Claro (`light`):** Força fundo branco/cinza claro e tipografia escura.
2. **Escuro (`dark`):** Força paleta em tons de grafite profundo e contraste otimizado para baixa luminosidade.
3. **Sistema (`system`):** Responde automaticamente às preferências do sistema operacional via media query `(prefers-color-scheme: dark)`.

### 🛠️ Resolução Técnica de Bug de Tema
* No `App.tsx`, o efeito sincroniza a classe `.dark` no elemento raiz (`document.documentElement`).
* Foi corrigido um bug onde a classe `.dark` permanecia fixada caso o tema fosse alterado para `light`. A remoção explícita (`classList.toggle('dark', isDark)`) e a observação de mudanças nas preferências do sistema garantiram a alternância imediata sem recarregar a página.

---

## 🌐 Internacionalização (i18n — Português & Inglês)

Todas as strings da interface são centralizadas em `src/core/i18n/translations.ts`:
* **Idiomas Suportados:** Português do Brasil (`pt`) e Inglês (`en`).
* **Hook Reativo:** Os componentes consomem a chave selecionada de `settings.language`.
* **Resolução Técnica de Bug de Tradução:** O modal de Configurações anteriormente mantinha rótulos estáticos em português. Foi realizada a refatoração para vincular todos os labels, tooltips e botões ao dicionário reativo de traduções.

---

## 🧩 Componentes Centrais da Interface

### 1. `Navbar.tsx` (Barra Superior)
* Exibe a marca MathUtils e a versão ativa.
* **Badge de Nível:** Mostra o nível atual do jogador e o título histórico.
* **Badge de Ofensiva (Streak):** Ícone de chama com a contagem de dias consecutivos.
* **Badge do Desafio Diário:** Indicador visual de status (🟢 Concluído ou 🔴 Pendente).
* Botões de acesso rápido ao Perfil, Lousa e Configurações.

### 2. `ProfileModal.tsx` (Vitrine de Conquistas & Perfil)
* Visão geral do XP acumulado, nível atual e barra de progresso percentual até o próximo nível.
* Grid de estatísticas: total de cálculos, recorde de sobrevivência, vitórias em chefes, etc.
* **Vitrine de Medalhas (16 Conquistas):** Abas de filtro (*Todas*, *Habilidade*, *Consistência*, *Mestria*, *Desafios*), progresso geral ($X/16$) e exibição de troféus liberados vs cadeados bloqueados.

### 3. `AchievementToast.tsx` & `ConfettiCanvas.tsx`
* Toast animado que surge suavemente no topo/canto da tela ao desbloquear uma conquista.
* Aciona a biblioteca `canvas-confetti` disparando explosão de confetes coloridos sem congelar o thread de renderização da UI.

### 4. `ParabolaChart.tsx` (Gráfico Interativo de Bhaskara)
* Renderizador SVG que projeta no plano cartesiano a curva da função quadrática $f(x) = ax^2 + bx + c$.
* Destaque gráfico do vértice $V(x_v, y_v)$, do eixo de simetria e das raízes reais $x_1$ e $x_2$.

### 5. `NumericInput.tsx` (Entrada Numérica Higienizada)
* Campo de input com filtragem automática de caracteres espúrios, permitindo apenas dígitos, sinal negativo (`-`) e o separador decimal correto configurado (vírgula ou ponto).

---

## 🔗 Links Relacionados
* [[MathUtils - Visao Geral]]
* [[Gamificacao & Niveis]]
* [[Lousa de Rascunho (Scratchpad)]]
