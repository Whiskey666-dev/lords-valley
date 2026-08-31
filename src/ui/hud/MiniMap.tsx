import { useMiniMap } from "../../hooks/hud/useMiniMap";
import { useWorldInfo } from "../../hooks/hud/useWorldInfo";
import { WorldInfoPanel } from "./components/WorldInfoPanel";

export function MiniMap() {
  const {
    canvasRef,
    currentSize,
    isExpanded,
    miniZoom,
    showMissions,
    showAlerts,
    position,
    isVisible,
    fogEnabled,
    exploredPercent,
    toggleExpand,
    toggleMissions,
    toggleAlerts,
    togglePosition,
    toggleVisibility,
    toggleFog,
    clearFog,
    zoomIn,
    zoomOut,
    handleMiniMapClick,
  } = useMiniMap();

  const { isOpen, toggle, close, worldData } = useWorldInfo();

  const isTop = position === "top-right";

  // — Minimapa oculto: mostrar solo botón flotante para restaurarlo —
  if (!isVisible) {
    return (
      <div
        style={{
          position: 'absolute',
          ...(isTop ? { top: 44, bottom: 'auto' } : { bottom: 12, top: 'auto' }),
          right: 12,
          zIndex: 25,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <button
          onClick={toggleVisibility}
          title="Mostrar minimapa"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#0e1622',
            border: '1.5px solid #1e2c3e',
            color: '#7a8e9e',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#142436';
            e.currentTarget.style.borderColor = '#4a90e2';
            e.currentTarget.style.color = '#8ab4ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0e1622';
            e.currentTarget.style.borderColor = '#1e2c3e';
            e.currentTarget.style.color = '#7a8e9e';
          }}
        >
          👁️
        </button>
        <span style={{ fontSize: 10, color: '#445566', background: 'rgba(0,0,0,0.55)', padding: '2px 6px', borderRadius: 4 }}>Minimapa oculto</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        ...(isTop ? { top: 44, bottom: 'auto' } : { bottom: 12, top: 'auto' }),
        right: 12,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        transition: 'top 0.25s ease, bottom 0.25s ease',
      }}
    >
      {/* Panel flotante de fecha, hora, estación y clima */}
      {isOpen && <WorldInfoPanel worldData={worldData} onClose={close} anchor={isTop ? "top" : "bottom"} />}

      {/* Contenedor principal: barra horizontal arriba/abajo + fila minimapa+zoom */}
      <div style={{ display: 'flex', flexDirection: isTop ? 'column-reverse' : 'column', alignItems: 'center', gap: 6 }}>
        {/* ── Barra horizontal de botones (arriba si minimapa abajo, abajo si minimapa arriba) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 5,
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0c1520',
            border: '1px solid #1a2a3c',
            borderRadius: 14,
            padding: '3px 6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}
        >
          {/* Botón: Expandir / Disminuir */}
          <CircleBtn
            title={isExpanded ? 'Reducir tamaño del minimapa' : 'Expandir minimapa local'}
            active={isExpanded}
            activeColor="#4a90e2"
            onClick={toggleExpand}
          >
            {isExpanded ? '🗗' : '⛶'}
          </CircleBtn>

          {/* Botón: Fecha / Hora / Clima */}
          <div data-world-info-panel>
            <CircleBtn
              title="Fecha, Hora y Clima del juego"
              active={isOpen}
              activeColor="#4a90e2"
              onClick={toggle}
            >
              📅
            </CircleBtn>
          </div>

          {/* Botón: Misiones */}
          <CircleBtn
            title={showMissions ? 'Ocultar misiones del minimapa' : 'Mostrar misiones en el minimapa'}
            active={showMissions}
            activeColor="#ffcc00"
            onClick={toggleMissions}
          >
            🎯
          </CircleBtn>

          {/* Botón: Alertas */}
          <CircleBtn
            title={showAlerts ? 'Ocultar alertas del minimapa' : 'Mostrar alertas en el minimapa'}
            active={showAlerts}
            activeColor="#ff4444"
            onClick={toggleAlerts}
          >
            ⚠️
          </CircleBtn>

          {/* Botón: Niebla de Guerra */}
          <CircleBtn
            title={fogEnabled ? `Niebla activada — ${exploredPercent}% explorado. Click para desactivar. Doble-click para limpiar.` : 'Niebla desactivada — Click para activar'}
            active={fogEnabled}
            activeColor={fogEnabled ? "#9d7cff" : "#3a3a3a"}
            onClick={toggleFog}
          >
            🌫️
          </CircleBtn>

          {/* Separador vertical */}
          <div style={{ width: 1, height: 18, background: '#1a2a3c', margin: '0 2px', borderRadius: 1 }} />

          {/* Botón: Cambiar ubicación (superior / inferior derecha) */}
          <CircleBtn
            title={isTop ? 'Mover minimapa a inferior derecha' : 'Mover minimapa a superior derecha'}
            active={isTop}
            activeColor="#ffa500"
            onClick={togglePosition}
          >
            {isTop ? '⬇️' : '⬆️'}
          </CircleBtn>

          {/* Botón: Reset niebla (solo si niebla activa) */}
          {fogEnabled && (
            <CircleBtn
              title="Reiniciar niebla (volver a oscurecer todo)"
              active={false}
              activeColor="#7a8e9e"
              onClick={clearFog}
            >
              🧹
            </CircleBtn>
          )}

          {/* Botón: Ocultar minimapa */}
          <CircleBtn
            title="Ocultar minimapa"
            active={false}
            activeColor="#7a8e9e"
            onClick={toggleVisibility}
          >
            👁️
          </CircleBtn>
        </div>

        {/* ── Fila: minimapa cuadrado + barra vertical de zoom ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* ── Contenedor del minimapa cuadrado (esquinas visibles) ── */}
          <div style={{ position: 'relative', width: currentSize, height: currentSize }}>
            {/* Canvas cuadrado */}
            <div
              onClick={handleMiniMapClick}
              title="Click para centrar cámara"
              style={{
                width: currentSize,
                height: currentSize,
                borderRadius: 8,
                background: '#040b10',
                border: '2px solid #334455',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'crosshair',
                boxShadow: '0 4px 20px rgba(0,0,0,0.85), inset 0 0 10px #000',
                transition: 'width 0.2s ease, height 0.2s ease',
              }}
            >
              <canvas
                ref={canvasRef}
                width={currentSize}
                height={currentSize}
                style={{
                  width: currentSize,
                  height: currentSize,
                  display: 'block',
                }}
              />

              {/* Borde interior cuadrado sutil */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }}
              />

              {/* Cruz retícula centro */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 8,
                  height: 1,
                  background: 'rgba(255,255,255,0.25)',
                  transform: 'translate(-50%,-50%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 1,
                  height: 8,
                  background: 'rgba(255,255,255,0.25)',
                  transform: 'translate(-50%,-50%)',
                  pointerEvents: 'none',
                }}
              />

              {/* 8 puntos cardinales en los bordes */}
              {/* Norte */}
              <div title="Norte" style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', fontSize: isExpanded ? 9 : 8, fontWeight: 800, color: '#e0ebff', background: 'rgba(12,22,38,0.72)', border: '1px solid rgba(90,120,160,0.35)', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>N</div>
              {/* Sur */}
              <div title="Sur" style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', fontSize: isExpanded ? 9 : 8, fontWeight: 800, color: '#e0ebff', background: 'rgba(12,22,38,0.72)', border: '1px solid rgba(90,120,160,0.35)', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>S</div>
              {/* Este */}
              <div title="Este" style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)', fontSize: isExpanded ? 9 : 8, fontWeight: 800, color: '#e0ebff', background: 'rgba(12,22,38,0.72)', border: '1px solid rgba(90,120,160,0.35)', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>E</div>
              {/* Oeste */}
              <div title="Oeste" style={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)', fontSize: isExpanded ? 9 : 8, fontWeight: 800, color: '#e0ebff', background: 'rgba(12,22,38,0.72)', border: '1px solid rgba(90,120,160,0.35)', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>O</div>
              {/* Noreste */}
              <div title="Noreste" style={{ position: 'absolute', top: 3, right: 3, fontSize: isExpanded ? 8 : 7, fontWeight: 800, color: '#c8d8f0', background: 'rgba(12,22,38,0.62)', border: '1px solid rgba(90,120,160,0.28)', padding: '1px 2px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.3, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>NE</div>
              {/* Noroeste */}
              <div title="Noroeste" style={{ position: 'absolute', top: 3, left: 3, fontSize: isExpanded ? 8 : 7, fontWeight: 800, color: '#c8d8f0', background: 'rgba(12,22,38,0.62)', border: '1px solid rgba(90,120,160,0.28)', padding: '1px 2px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.3, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>NO</div>
              {/* Sureste */}
              <div title="Sureste" style={{ position: 'absolute', bottom: 3, right: 3, fontSize: isExpanded ? 8 : 7, fontWeight: 800, color: '#c8d8f0', background: 'rgba(12,22,38,0.62)', border: '1px solid rgba(90,120,160,0.28)', padding: '1px 2px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.3, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>SE</div>
              {/* Suroeste */}
              <div title="Suroeste" style={{ position: 'absolute', bottom: 3, left: 3, fontSize: isExpanded ? 8 : 7, fontWeight: 800, color: '#c8d8f0', background: 'rgba(12,22,38,0.62)', border: '1px solid rgba(90,120,160,0.28)', padding: '1px 2px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', letterSpacing: 0.3, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>SO</div>

              {/* Indicador de niebla */}
              {fogEnabled && (
                <div
                  title={`${exploredPercent}% del mundo explorado — La niebla se disipa permanentemente al explorar`}
                  style={{
                    position: 'absolute',
                    bottom: -18,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 7,
                    fontWeight: 700,
                    color: '#9d7cff',
                    background: 'rgba(20,12,36,0.85)',
                    border: '1px solid rgba(157,124,255,0.35)',
                    padding: '1px 5px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    fontFamily: 'monospace',
                    letterSpacing: 0.3,
                    lineHeight: 1.2,
                  }}
                >
                  🌫️ {exploredPercent}% explorado
                </div>
              )}
            </div>
          </div>

          {/* ── Barra vertical de zoom al lado derecho ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#0c1520',
              border: '1px solid #1a2a3c',
              borderRadius: 14,
              padding: '3px 2px',
              gap: 3,
              boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
            }}
          >
            {/* Botón + */}
            <button
              onClick={zoomIn}
              title="Aumentar zoom del minimapa"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#162434',
                border: '1px solid #243850',
                color: miniZoom >= 4 ? '#445566' : '#8acfff',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: miniZoom >= 4 ? 'default' : 'pointer',
                padding: 0,
              }}
            >
              +
            </button>

            {/* Barra indicadora vertical de nivel de zoom */}
            <div
              style={{
                width: 6,
                height: 48,
                background: '#060d14',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #142230',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${((miniZoom - 1) / 3) * 100}%`,
                  minHeight: 4,
                  background: 'linear-gradient(to top, #2e86ab, #00e5ff)',
                  borderRadius: 2,
                  transition: 'height 0.15s ease',
                }}
              />
            </div>

            {/* Botón − */}
            <button
              onClick={zoomOut}
              title="Reducir zoom del minimapa"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#162434',
                border: '1px solid #243850',
                color: miniZoom <= 1 ? '#445566' : '#8acfff',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: miniZoom <= 1 ? 'default' : 'pointer',
                padding: 0,
              }}
            >
              −
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CircleBtn({
  children,
  onClick,
  title,
  active = false,
  activeColor = '#4a90e2',
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: active ? '#142436' : '#0e1622',
        border: `1.5px solid ${active ? activeColor : '#1e2c3e'}`,
        color: active ? activeColor : '#7a8e9e',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: active ? `0 0 8px ${activeColor}44` : '0 2px 6px rgba(0,0,0,0.5)',
        transition: 'all 0.15s ease',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

export default MiniMap;
