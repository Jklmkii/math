# 📐 Quantora — Suíte Científica, Física Clássica & Desafios Mentais (Desktop & Mobile)

Um aplicativo moderno, educativo e 100% offline para cálculos analíticos avançados, simulação de física, treinamento mental gamificado, lousa de rascunho digital, **Física Clássica (10 modos de mecânica)**, **Equações do 2º Grau (Bhaskara)** e **Regra de Três (Simples e Composta)**, com resolução didática passo a passo, gráficos dinâmicos e exportação de backups.

Disponível como **Web App (PWA)**, **Executável Nativo do Windows (.exe)** e **Aplicativo Android (.apk)**.

---

## ✨ Funcionalidades

### 1. ⚛️ Módulo de Física Clássica & Mecânica Analítica
- **10 Modos de Resolução Analítica Didática:**
  1. **MRU (Movimento Retilíneo Uniforme):** Posição horária, velocidade constante e tempo, suportando isolamento de qualquer variável ($S, S_0, v, t$).
  2. **MRUV & Torricelli:** Aceleração linear, distância e tempo de frenagem com limites de desaceleração.
  3. **Queda Livre com Arrasto Aerodinâmico:** Modelo analítico exato para o vácuo ou com resistência do ar via velocidade terminal ($v(t) = v_t \tanh(gt/v_t)$), tempo via $\operatorname{arcosh}$ e presets paraquedista/gota.
  4. **Lançamento Vertical:** Subida desacelerada, altura máxima, tempo de permanência e velocidade de retorno.
  5. **Lançamento Horizontal:** Composição independente de Galileu, alcance e velocidade de impacto.
  6. **Lançamento Oblíquo (Balística 2D):** Ângulo de disparo, alcance parabólico, vetor resultante e ápice da trajetória.
  7. **MCU (Movimento Circular Uniforme):** Frequência, período, velocidade angular ($\omega$), aceleração centrípeta e velocidade linear.
  8. **MHS (Movimento Harmônico Simples):** Pêndulo simples e oscilador massa-mola com equações senoidais.
  9. **Plano Inclinado & Leis de Newton:** Modo simples e avançado com força externa aplicada ao longo da rampa, decomposição de forças ($P_x, P_y, N$), atrito estático/cinético e determinação da direção do movimento.
  10. **Conservação de Energia & Trabalho:** Energia cinética, potencial gravitacional e mecânica total; trabalho de forças constantes e potência mecânica (com conversões para CV e HP).
- **5 Gráficos SVG Vetoriais Interativos (`PhysicsChart.tsx`):**
  - Curvas temporais contínuas ($S \times t, v \times t, y \times t$).
  - Balística 2D cartesiana com solo pontilhado, ápice ($h_{max}$) e alcance ($A$).
  - Órbita circular 2D com vetores tangenciais e centrípetos.
  - Diagrama de corpo livre com até 6 vetores de força dinâmicos em rampa inclinada.
  - Gráficos de barras proporcionais de energias mecânicas e trabalho/potência.

### 2. 🔍 Módulo Bhaskara (Equação do 2º Grau)
- **Cálculo Completo:** Suporte a $\Delta > 0$ (duas raízes), $\Delta = 0$ (raiz real única) e $\Delta < 0$ (raízes no conjunto dos números complexos $\mathbb{C}$ no formato $p \pm qi$).
- **Gráfico Interativo da Parábola em SVG:** Curva desenhada com autoescala dinâmica (inclusive para coeficientes extremos).
- **Vértice e Eixo de Simetria:** Determinação exata de $V(X_v, Y_v)$ e ponto de máximo/mínimo.
- **Parser de Equações por Texto:** Permite colar expressões diretamente (ex: `2x² - 4x + 2 = 0` ou `x^2 = 9`).
- **Passo a Passo Didático:** Visualização detalhada de todas as substituições na fórmula.

### 3. ⚖️ Módulo Regra de Três
- **Simples (2x2):** Incógnita flexível em qualquer posição ($A_1, B_1, A_2, B_2$), proporção direta ou inversa.
- **Composta (3+ Grandezas):** Grade dinâmica com adição/remoção de grandezas e definição individual de proporcionalidade.
- **Resolução Passo a Passo:** Demonstração do produto das frações até o isolamento de $x$.

### 4. 🎮 Modos de Treino, Jogos & Desafios
- **Treino Aritmético (MatSpeed):** Trilhas de Adição, Subtração, Multiplicação, Divisão e Regra de Três, além do Modo Sobrevivência progressivo.
- **Desafio Diário (Daily Challenge):** Questão determinística única mundial gerada a partir da data via hash FNV-1a e PRNG Mulberry32, concedendo +150 XP e avanço de ofensiva (*streak*).
- **Modo Blitz (60 Segundos):** Corrida contra o relógio (+2s acerto / -3s erro) com multiplicadores de combo ($1\times \to 2\times \to 3\times$).
- **Batalha de Chefe (Boss Rush):** Chefe com 100 HP, 3 escudos para o jogador, acertos críticos em respostas rápidas (<3s) e bônus de vitória perfeita (*Flawless*).

### 5. 📝 Lousa de Rascunho Digital (Scratchpad)
- Camada flutuante em HTML5 Canvas transparente sobre qualquer módulo.
- Caneta com 6 cores contrastantes, 3 espessuras de traço, paleta sanfona recolhível para mobile, borracha e botão unificado de fechar preservando desenhos na memória.

### 6. 🏅 Gamificação & Perfil do Jogador
- Fórmula quadrática de XP: $XP_{req}(L) = 50 \cdot L \cdot (L - 1)$.
- 6 Patentes históricas em PT e EN (*Aprendiz* a *Lenda dos Números*).
- 16 Conquistas desbloqueáveis com animação de troféu e efeito de confetes.
- Ofensiva diária (*Streak*) estritamente atrelada ao relógio local do dispositivo.

### 7. 💾 Histórico Local, Backup & Modos de Tema
- Armazenamento 100% privado e local no dispositivo via Zustand e `localStorage`.
- Busca rápida e filtros por tipo (`'bhaskara'`, `'regra-de-tres'`, `'physics'`).
- Exportação e importação de histórico em **JSON** e **CSV**.
- Suporte fluido a temas Claro, Escuro e Sistema, além de internacionalização em Português e Inglês.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas-Confetti.
- **Motor Matemático & Físico:** `big.js` (eliminando erros de precisão de ponto flutuante IEEE 754).
- **Gerenciamento de Estado:** Zustand com persistência e validador de schema.
- **Desktop:** Electron 44, Electron-Builder, Electron-Updater.
- **Mobile:** Capacitor 8.5, Android SDK 36, Gradle 8.x, Java 21.
- **Qualidade & Testes:** Vitest (357 testes unitários em 18 suítes), Oxlint (76 arquivos).

---

## 🚀 Como Executar

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Modo Desenvolvimento Web
```bash
npm run dev
```

### 3. Modo Desenvolvimento Desktop (Electron)
```bash
npm run electron:dev
```

### 4. Executar Testes Unitários (357 Testes / 18 Suítes)
```bash
npx vitest run
```

### 5. Executar Linter
```bash
npm run lint
```

### 6. Compilar o Executável (.exe) para Windows
```bash
npm run electron:build
```
Os arquivos gerados estarão na pasta `release/`:
* `Quantora-Setup-1.2.1.exe` (Instalador tradicional NSIS)
* `Quantora-1.2.1-portable.exe` (Executável portátil autônomo)

Você também pode baixar os executáveis prontos diretamente na página de [Releases do GitHub](https://github.com/Jklmkii/math/releases).

### 7. Mobile Android (.apk via Capacitor)
```bash
# Compilar frontend e sincronizar com o projeto nativo Android
npm run cap:sync

# Abrir no Android Studio para gerar o .apk ou rodar no emulador/dispositivo
npm run cap:android
```

---

## 👤 Autor

Desenvolvido por **Lucas**  
Contato: `lucascaminha06@gmail.com`

---

## 🔗 Navegação na Documentação (Obsidian)
* [[Quantora - Visao Geral]]
* [[Dashboard]]
* [[CHANGELOG]]
* [[AGENTS]]
* [[Deploy & Releases]]
