# src/hooks/loading/context.md — Hook de Pantalla de Carga

> Lógica para la pantalla de carga inicial del juego.

## `useLoadingScreen.ts`

### Estado
```typescript
progress: number       // 0–100 porcentaje de carga
step: string           // mensaje del paso actual ("Cargando assets...")
isLoaded: boolean      // true cuando progress === 100
isVisible: boolean     // false → desmonta el componente (600ms tras isLoaded)
playerId: string       // ID del jugador para mostrar en pantalla
```

### Efectos
1. **Listener de progreso**: `lords-loading-progress {progress, step}` emitido por `Preloader.ts`
   - Actualiza `progress` y `step` en tiempo real
2. **Fallback timer**: si no hay eventos en 200ms → incrementa +5% cada 200ms hasta 90%
   - Asegura que la barra siempre se mueva visualmente aunque haya delays en Phaser
3. **Transición de cierre**: cuando `isLoaded = true` → delay 600ms → `setIsVisible(false)`

### Resolución de `playerId`
```
localStorage.playerId
  ↓ (no existe)
localStorage.player → JSON.parse → .id o .username
  ↓ (no existe)
localStorage.access_token → hash → "USR-XXXXXXXX"
  ↓ (no existe)
"Invitado"
```

### Integración
- Emisor: `game/scenes/Preloader.ts` → `window.dispatchEvent(new CustomEvent("lords-loading-progress", {detail: {progress, step}}))`
- Receptor: `ui/loading/LoadingScreen.tsx` → `useLoadingScreen()`
- Montado desde `app/App.tsx` mientras `isAuthed && isVisible`
