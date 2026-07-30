# HLY-UI-004 — Sequência Canônica de Produção

**Status:** APROVADO
**Data:** 2026-07-30

## Decisão

```text
DESIGN TOKENS
↓
COMPONENTES REACT CANÔNICOS
↓
IMPLEMENTAÇÃO CODE-FIRST
↓
INTEGRAÇÃO NA BRANCH DE TRABALHO
↓
RENDERIZAÇÃO REAL NO WORK
↓
SCREENSHOTS OFICIAIS
↓
TESTES AUTOMATIZADOS
↓
QA
↓
APPROVED_FROZEN
↓
INTEGRAÇÃO DEFINITIVA
```

## Estados

- `BRANCH_INTEGRATED`: código presente e executável na branch oficial de trabalho.
- `APPROVED_FROZEN`: o mesmo commit passou em build, testes, acessibilidade, responsividade, regressão visual e QA, com screenshots, manifesto, relatório e hashes.
- `WORK_INTEGRATED`: o commit congelado foi incorporado à branch principal autorizada sem alterações não validadas.

Canva, mockups e PNGs exportados não são fontes editáveis nem critérios de aceite.
