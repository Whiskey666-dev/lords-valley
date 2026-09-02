# src/common/context.md — Utilidades Comunes

> Funciones y tipos compartidos entre todos los módulos del proyecto.

## Archivos

### `bigint.ts` — Token LVY y Aritmética de Precisión
- **Problema**: el token LVY usa 18 decimales (como ETH). `Number` pierde precisión con valores > 2^53.
- **Solución**: todas las cantidades LVY se representan como `string` con 18 dígitos decimales.
- **Funciones exportadas**:
  - `formatLVY(raw: string): string` → formatea cantidad raw a string legible (ej. `"1000000000000000000"` → `"1.00 LVY"`)
  - `parseLVY(human: string): string` → inverso: `"1.5"` → `"1500000000000000000"`
  - `addLVY(a: string, b: string): string` → suma segura con BigInt
  - `compareLVY(a: string, b: string): -1 | 0 | 1` → comparación
- Usado en: `ui/inventory/`, `ui/settlement/`, `characters/Stats`, `app/api/`

### `types.ts` (si existe)
Tipos compartidos entre capas (Phaser y React) que no tienen un módulo de dominio propio.
