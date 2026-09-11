# 🏆 Sistema de Gamificação, Níveis & Conquistas

O motor de gamificação do **Quantora** estimula o aprendizado e a regularidade do usuário por meio de pontos de experiência (XP), títulos matemáticos históricos, catálogo de medalhas desbloqueáveis e ofensiva diária vinculada ao dispositivo.

Arquivo-fonte: `src/core/gamification/leveling.ts`

---

## 📐 Fórmula Matemática de Progressão de Nível

A progressão segue uma curva quadrática suave projetada para premiar o início rápido e oferecer desafios sustentáveis em níveis avançados:

$$\text{XP Acumulado para o Nível } L = 50 \cdot L \cdot (L - 1)$$

### 📊 Tabela de XP por Nível
| Nível ($L$) | XP Total Necessário | XP para o Próximo Nível |
| :---: | :---: | :---: |
| **1** | $0$ XP | $100$ XP |
| **2** | $100$ XP | $200$ XP |
| **3** | $300$ XP | $300$ XP |
| **4** | $600$ XP | $400$ XP |
| **5** | $1.000$ XP | $500$ XP |
| **6** | $1.500$ XP | $600$ XP |
| **10** | $4.500$ XP | $1.000$ XP |
| **15** | $10.500$ XP | $1.500$ XP |
| **20** | $19.000$ XP | $2.000$ XP |
| **50** | $122.500$ XP | $5.000$ XP |

A porcentagem de progresso da barra no Perfil é calculada como:
$$\text{Progresso}(\%) = \left\lfloor \frac{\text{XP Atual} - \text{XP Base do Nível}}{\text{XP Necessário para o Próximo Nível}} \times 100 \right\rfloor$$

---

## 🎖️ Títulos Matemáticos Históricos (Patentes)

O título exibido no Perfil e na Navbar evolui dinamicamente com base no nível atingido e no idioma selecionado:

| Faixa de Nível | Título em Português (PT) | Title in English (EN) | Homenagem Histórica |
| :--- | :--- | :--- | :--- |
| **1 a 4** | Aprendiz de Pitágoras | Pythagoras Apprentice | Pitágoras de Samos |
| **5 a 9** | Explorador de Euclides | Euclidean Explorer | Euclides de Alexandria |
| **10 a 19** | Calculista Ágil | Swift Calculator | Agilidade de cálculo |
| **20 a 34** | Arquiteto de Descartes | Cartesian Architect | René Descartes |
| **35 a 49** | Mestre de Gauss | Master of Gauss | Carl Friedrich Gauss |
| **50+** | Oráculo dos Números | Oracle of Numbers | Nível Lendário Máximo |

---

## 🏅 Catálogo Completo das 16 Conquistas (Badges)

As conquistas são persistidas no array `profile.unlockedAchievements` e categorizadas na vitrine do Perfil:

### 1. Habilidade
| Ícone | ID | Título (PT / EN) | Requisito Técnico | XP |
| :---: | :--- | :--- | :--- | :---: |
| 🎯 | `first_calculation` | Primeiro Passo / First Step | Realizar 1 cálculo completo de Bhaskara ou Regra de Três | +50 |
| ⚡ | `quiz_starter` | Desafiante / Agile Mind | Acertar 5 questões no modo Treino | +100 |
| ⏱️ | `blitz_speedster` | Relâmpago / Lightning | Atingir 10 pontos no Modo Blitz | +150 |
| 💥 | `crit_master` | Precisão Cirúrgica / Surgical Precision | Acertar um golpe crítico em menos de 3s no Chefe | +150 |

### 2. Consistência
| Ícone | ID | Título (PT / EN) | Requisito Técnico | XP |
| :---: | :--- | :--- | :--- | :---: |
| 🔥 | `streak_3` | Foco Constante / Constant Focus | Manter 3 dias consecutivos de ofensiva | +150 |
| 🏆 | `streak_7` | Hábito de Aço / Steel Habit | Manter 7 dias consecutivos de ofensiva | +300 |
| 📅 | `daily_starter` | Compromisso Diário / Daily Commitment | Concluir o 1º Desafio Diário | +150 |
| 👑 | `daily_champion` | Guardião da Rotina / Routine Guardian | Concluir 5 Desafios Diários | +300 |

### 3. Mestria
| Ícone | ID | Título (PT / EN) | Requisito Técnico | XP |
| :---: | :--- | :--- | :--- | :---: |
| 📐 | `bhaskara_master` | Mestre de Bhaskara / Bhaskara Master | Resolver 5 equações completas de Bhaskara | +100 |
| ⚖️ | `rule_three_expert`| Especialista em Proporção / Proportion Expert | Resolver 5 problemas de Regra de Três | +100 |
| 🌟 | `level_5` | Aprendiz Dedicado / Dedicated Apprentice | Atingir o Nível 5 de Perfil (1.000 XP) | +250 |
| 👑 | `level_10` | Mestre dos Números / Master of Numbers | Atingir o Nível 10 de Perfil (4.500 XP) | +500 |

### 4. Desafios
| Ícone | ID | Título (PT / EN) | Requisito Técnico | XP |
| :---: | :--- | :--- | :--- | :---: |
| 🛡️ | `survival_10` | Sobrevivente / Survivor | Atingir a conta #10 no modo Sobrevivência | +200 |
| ✏️ | `scratchpad_thinker`| Mente Criativa / Creative Mind | Abrir e utilizar a lousa de rascunho 3 vezes | +100 |
| ⚔️ | `boss_slayer` | Matador de Chefes / Boss Slayer | Derrotar o Chefe no Modo Batalha de Chefe | +250 |
| 💎 | `boss_flawless` | Invicto / Flawless | Derrotar o Chefe sem sofrer dano (3 escudos intactos) | +350 |

---

## 🔥 Motor de Ofensiva Diária (Streak) Vinculado ao Dispositivo

### 🛡️ Prevenção de Falsos Incrementos & Fuso Local
Para garantir total integridade e evitar que a ofensiva avance indevidamente:

1. **Extração de Data Local (`getDeviceLocalDateString`):**
   ```ts
   export function getDeviceLocalDateString(date: Date = new Date()): string {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
   }
   ```
   * Evita o problema do formato UTC (`toISOString()`), que em fusos horários ocidentais como o Brasil (UTC-3) adiantava o dia às 21:00.
2. **Separação entre Refresh e Ação Ativa:**
   * **Ao abrir ou recarregar (`checkStreakMaintenance`):** O aplicativo apenas checa expiração. Se `diffDays > 1`, a ofensiva zera. Se `diffDays <= 1`, ela permanece inalterada. **Nunca incrementa por refresh.**
   * **Ao concluir uma atividade (`calculateStreakUpdate`):** Apenas quando o usuário finaliza um Desafio Diário ou treino no dia seguinte (`diffDays === 1`), a ofensiva é incrementada.

---

## 🔗 Links Relacionados
* [[Quantora - Visao Geral]]
* [[Modos de Treino & Jogos]]
* [[Arquitetura de Estado & Persistencia]]
