# 📐 Quantora — Suíte Matemática & Desafios Mentais (Desktop & Mobile)

Um aplicativo moderno, educativo e 100% offline para cálculos avançados, treino com gamificação, lousa de rascunho digital, **Equações do 2º Grau (Bhaskara)** e **Regra de Três (Simples e Composta)**, com resolução didática passo a passo, gráficos dinâmicos e exportação de backups.

Disponível como **Web App (PWA)**, **Executável Nativo do Windows (.exe)** e **Aplicativo Android (.apk)**.

---

## ✨ Funcionalidades

### 1. Módulo Bhaskara (Equação do 2º Grau)
- **Cálculo Completo:** Suporte a $\Delta > 0$ (duas raízes), $\Delta = 0$ (raiz real única) e $\Delta < 0$ (raízes no conjunto dos números complexos $\mathbb{C}$).
- **Gráfico Interativo da Parábola em SVG:** Curva desenhada com autoescala dinâmica (inclusive para coeficientes extremos, como $x^2 - 1000x + 500 = 0$).
- **Vértice e Eixo de Simetria:** Determinação exata de $V(X_v, Y_v)$ e ponto de máximo/mínimo.
- **Parser de Equações por Texto:** Permite colar ou digitar expressões diretamente (ex: `2x² - 4x + 2 = 0` ou `x^2 = 9`) e preenche os coeficientes automaticamente.
- **Passo a Passo Didático:** Visualização detalhada de todas as substituições na fórmula.

### 2. Módulo Regra de Três
- **Simples (2x2):** Incógnita flexível em qualquer posição ($A_1, B_1, A_2, B_2$), proporção direta ou inversa e sugestão heurística automática com base no contexto (ex: velocidade $\times$ tempo).
- **Composta (3+ Grandezas):** Grade dinâmica com adição/remoção de grandezas e definição individual de proporcionalidade em relação ao alvo.
- **Resolução Passo a Passo:** Demonstração do produto das frações até o isolamento de $x$.

### 3. Modo Treino & Quiz
- Gerador automático de exercícios de Bhaskara e Regra de Três com gabarito didático e contador de sequência de acertos (*streak* 🔥).

### 4. Histórico Local & Backup
- Armazenamento 100% privado e local no dispositivo.
- Busca textual rápida e filtros por tipo e favoritos.
- Exportação e importação de histórico em **JSON** e **CSV** (compatível com Excel/Google Sheets).

### 5. Desktop Nativo (.exe)
- Empacotado com **Electron** e **electron-builder**.
- Diálogos nativos do Windows (`Salvar Como` e `Abrir Arquivo`) com validação de integridade.
- Ícone nativo multi-resolução (`.ico` em 16, 32, 48 e 256px).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Motor Matemático:** `big.js` (eliminando erros de precisão de ponto flutuante do JavaScript).
- **Gerenciamento de Estado:** Zustand (persistência local leve e performática).
- **Desktop:** Electron, electron-builder.
- **Testes Automatizados:** Vitest.

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

### 4. Executar Testes Unitários
```bash
npx vitest run
```

### 5. Compilar o Executável (.exe) para Windows
```bash
npm run electron:build
```
Os arquivos gerados estarão na pasta `release/`:
* `Quantora-Setup-1.1.1.exe` (Instalador tradicional NSIS)
* `Quantora-1.1.1-portable.exe` (Executável portátil autônomo)

Você também pode baixar os executáveis prontos diretamente na página de [Releases do GitHub](https://github.com/Jklmkii/math/releases).

### 6. Mobile Android (.apk via Capacitor)
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
