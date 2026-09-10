## 2024-05-18 - React.memo() Performance Optimization
**Learning:** Using React.memo() on complex SVG charting components like `ParabolaChart` is critical when they are children of heavily interactive parents (like a text input component). The parent state changes trigger unnecessary re-renders on the child SVG tree, creating massive bottlenecks.
**Action:** Always consider memoizing pure components rendering heavy SVGs, lists, or complex DOM nodes when they exist in a view with fast-updating UI state (e.g. text inputs on every keystroke).
