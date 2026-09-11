# 📐 Núcleo Matemático & Calculadoras Didáticas

Este documento detalha o funcionamento algébrico, fórmulas, validações e tratamento de precisão das ferramentas de cálculo do **Quantora**.

Arquivos-fonte:
* `src/core/math/bhaskara.ts`
* `src/core/math/regraDeTresSimples.ts`
* `src/core/math/regraDeTresComposta.ts`
* `src/core/math/precision.ts`

---

## 1. 🔍 Calculadora de Bhaskara (Equação de 2º Grau)

A calculadora resolve equações completas e incompletas da forma geral:
$$ax^2 + bx + c = 0 \quad (a \neq 0)$$

### 🧮 Cálculo do Discriminante ($\Delta$)
$$\Delta = b^2 - 4ac$$

O valor de $\Delta$ determina a natureza geométrica e algébrica das raízes:

1. **$\Delta > 0$ (Duas raízes reais e distintas):**
   $$x_1 = \frac{-b + \sqrt{\Delta}}{2a}, \quad x_2 = \frac{-b - \sqrt{\Delta}}{2a}$$
2. **$\Delta = 0$ (Raiz real única / dupla):**
   $$x = \frac{-b}{2a}$$
3. **$\Delta < 0$ (Raízes complexas conjugadas):**
   $$x_{1,2} = -\frac{b}{2a} \pm \frac{\sqrt{-\Delta}}{2a} i$$
   * Formatação amigável: `p ± qi` onde $p$ é a parte real e $q$ é a imaginária.

### 📍 Vértice da Parábola & Eixo de Simetria
Para subsidiar a renderização visual do gráfico interativo (`ParabolaChart.tsx`), a função calcula:
* **Abscissa do vértice ($x_v$):**
  $$x_v = -\frac{b}{2a}$$
* **Ordenada do vértice ($y_v$):**
  $$y_v = -\frac{\Delta}{4a}$$
* **Eixo de simetria:** A reta vertical $x = x_v$.
* **Concavidade:** Se $a > 0$, voltada para cima (ponto de mínimo em $y_v$); se $a < 0$, voltada para baixo (ponto de máximo em $y_v$).

### 📝 Geração do Passo a Passo Didático
A função `solveBhaskara(a, b, c)` retorna um array `steps: string[]` contendo a decomposição pedagógica:
1. Identificação formal dos coeficientes $a, b, c$.
2. Substituição na fórmula do $\Delta = b^2 - 4ac$.
3. Simplificação aritmética de $b^2$ e $(-4ac)$.
4. Análise do sinal de $\Delta$.
5. Substituição na fórmula de Bhaskara $x = \frac{-b \pm \sqrt{\Delta}}{2a}$.
6. Cálculo isolado de $x_1$ e $x_2$ (ou separação real/imaginária para números complexos).
7. Coordenadas do vértice $V(x_v, y_v)$.

---

## 2. ⚖️ Regra de Três Simples

Resolve relações de proporção linear direta e inversa entre duas grandezas $A$ e $B$.

### 📊 Estrutura da Matriz $2 \times 2$
$$\begin{pmatrix} A_1 & B_1 \\ A_2 & B_2 \end{pmatrix}$$

O usuário pode posicionar a incógnita $x$ em qualquer um dos 4 quadrantes (`a1`, `b1`, `a2`, `b2`).

### 🔄 Diretamente Proporcionais (DP)
Grandezas que variam no mesmo sentido (aumento de uma acarreta aumento proporcional da outra).
* Exemplo: Quantidade de produtos vs. Custo total.
* Multiplicação em cruz:
  $$A_1 \cdot B_2 = A_2 \cdot B_1$$
* Para $x = B_2$:
  $$x = \frac{A_2 \cdot B_1}{A_1}$$

### 🔀 Inversamente Proporcionais (IP)
Grandezas que variam em sentidos opostos (aumento de uma acarreta redução proporcional da outra).
* Exemplo: Velocidade média vs. Tempo de viagem, ou Número de operários vs. Dias de obra.
* Multiplicação em linha:
  $$A_1 \cdot B_1 = A_2 \cdot B_2$$
* Para $x = B_2$:
  $$x = \frac{A_1 \cdot B_1}{A_2}$$

---

## 3. 🧩 Regra de Três Composta

Permite resolver problemas envolvendo $N$ grandezas simultâneas com relações mistas (diretas e inversas) em relação à grandeza-alvo $X$.

### ⚙️ Algoritmo de Resolução
1. **Identificação da Coluna-Alvo:** O usuário define qual coluna contém a incógnita $x$ (com valor conhecido $T_1$ e incógnita $x = T_2$).
2. **Análise de Proporcionalidade:** Cada uma das outras grandezas $C_k$ é classificada como **Diretamente Proporcional (DP)** ou **Inversamente Proporcional (IP)** em relação à coluna-alvo.
3. **Montagem da Equação:**
   $$\frac{T_1}{x} = \prod_{k \neq \text{target}} F_k$$
   * Se $C_k$ for **Direta (DP)**: $F_k = \frac{V_{k,1}}{V_{k,2}}$
   * Se $C_k$ for **Inversa (IP)**: $F_k = \frac{V_{k,2}}{V_{k,1}}$ (inverte a fração)
4. **Isolamento de $x$:**
   $$x = T_1 \cdot \frac{1}{\prod F_k}$$

O sistema gera a explicação passo a passo exibindo cada fração comparativa e a simplificação dos numeradores e denominadores acumulados.

---

## 4. 🎯 Precisão Aritmética & `big.js` (`precision.ts`)

Para evitar distorções clássicas do padrão IEEE 754 em Javascript (como `0.1 + 0.2 = 0.30000000000000004`):
* Todas as multiplicações de frações e reduções de divisões utilizam a biblioteca `big.js`.
* Suporte a precisão configurável pelo usuário nas Configurações: **2, 4 ou 6 casas decimais**, com separador de vírgula (`,` - padrão PT-BR) ou ponto (`.` - padrão EN-US).
* Função `cleanTrailingZeros(val)`: remove zeros redundantes após a casa decimal para uma leitura limpa.

---

## 🔗 Links Relacionados
* [[Quantora - Visao Geral]]
* [[Modos de Treino & Jogos]]
* [[Suite de Testes & Qualidade]]
