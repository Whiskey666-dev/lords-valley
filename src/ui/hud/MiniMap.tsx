import { useMiniMap } from "../../hooks/hud/useMiniMap";
import { useWorldInfo } from "../../hooks/hud/useWorldInfo";
import { WorldInfoPanel } from "./components/WorldInfoPanel";

export function MiniMap() {
  const {
    canvasRef,
    currentSize,
    isExpanded,
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

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'absolute',
          ...(isTop ? { top: 50, bottom: 'auto' } : { bottom: 16, top: 'auto' }),
          right: 16,
          zIndex: 25,
        }}
      >
        <button
          onClick={toggleVisibility}
          title="Abrir Minimapa (RPG Clásico)"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #253342 0%, #0d1520 100%)',
            border: '2px solid #c59b27',
            color: '#ffd700',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.8), 0 0 8px rgba(197,155,39,0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          🗺️
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        ...(isTop ? { top: 48, bottom: 'auto' } : { bottom: 14, top: 'auto' }),
        right: 14,
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

      {/* ── Contenedor Marco Diamante RPG Medieval Isométrico ── */}
      <div style={{ position: 'relative', width: currentSize + 16, height: currentSize + 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Bisel decorativo exterior de piedra y bronce con remaches */}
        <div
          style={{
            position: 'absolute',
            width: currentSize + 8,
            height: currentSize + 8,
            clipPath: 'polygon(50% 25%, 100% 50%, 50% 75%, 0% 50%)',
            background: 'linear-gradient(135deg, #d4af37 0%, #3e2710 30%, #151d28 50%, #3e2710 70%, #d4af37 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 14px rgba(212,175,55,0.35)',
            pointerEvents: 'none',
          }}
        />

        {/* Marco de resalte metálico interior */}
        <div
          style={{
            position: 'absolute',
            width: currentSize + 2,
            height: currentSize + 2,
            clipPath: 'polygon(50% 25%, 100% 50%, 50% 75%, 0% 50%)',
            background: '#0a0f16',
            pointerEvents: 'none',
          }}
        />

        {/* ── Contenedor Canvas del Minimapa con recorte 2:1 ── */}
        <div
          onClick={handleMiniMapClick}
          title="Click para navegar (Rombo Isométrico)"
          style={{
            position: 'relative',
            width: currentSize,
            height: currentSize,
            background: '#04080d',
            cursor: 'crosshair',
            clipPath: 'polygon(50% 25%, 100% 50%, 50% 75%, 0% 50%)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={currentSize}
            height={currentSize}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />

          {/* Borde interior dorado sutil */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(212,175,55,0.4)',
              pointerEvents: 'none',
              clipPath: 'polygon(50% 25%, 100% 50%, 50% 75%, 0% 50%)',
            }}
          />

          {/* Retícula cruz central clásica */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 8,
              height: 1,
              background: 'rgba(255,215,0,0.6)',
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
              background: 'rgba(255,215,0,0.6)',
              transform: 'translate(-50%,-50%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* ── Rosa de los Vientos / Puntos Cardinales Simétricos Estilo RPG ── */}
        {/* Norte (Cresta Dorada) */}
        <div title="Norte" style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 8, fontWeight: 900, color: '#ffd700', background: 'radial-gradient(circle, #2a1a05, #100b02)', border: '1px solid #d4af37', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'serif', textShadow: '0 1px 2px #000', boxShadow: '0 0 6px rgba(212,175,55,0.5)', zIndex: 4 }}>N</div>
        {/* Sur */}
        <div title="Sur" style={{ position: 'absolute', top: '82%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 8, fontWeight: 900, color: '#e0ebff', background: 'radial-gradient(circle, #1a2230, #0c1017)', border: '1px solid #4a688a', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'serif', textShadow: '0 1px 2px #000', zIndex: 4 }}>S</div>
        {/* Este */}
        <div title="Este" style={{ position: 'absolute', top: '50%', left: '98%', transform: 'translate(-50%,-50%)', fontSize: 8, fontWeight: 900, color: '#e0ebff', background: 'radial-gradient(circle, #1a2230, #0c1017)', border: '1px solid #4a688a', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'serif', textShadow: '0 1px 2px #000', zIndex: 4 }}>E</div>
        {/* Oeste */}
        <div title="Oeste" style={{ position: 'absolute', top: '50%', left: '2%', transform: 'translate(-50%,-50%)', fontSize: 8, fontWeight: 900, color: '#e0ebff', background: 'radial-gradient(circle, #1a2230, #0c1017)', border: '1px solid #4a688a', padding: '1px 3px', borderRadius: 3, lineHeight: 1, pointerEvents: 'none', fontFamily: 'serif', textShadow: '0 1px 2px #000', zIndex: 4 }}>O</div>
        {/* Intermedios */}
        <div title="Noreste" style={{ position: 'absolute', top: '34%', left: '78%', transform: 'translate(-50%,-50%)', fontSize: 7, fontWeight: 700, color: '#c0a060', background: 'rgba(10,15,22,0.9)', border: '1px solid rgba(212,175,55,0.3)', padding: '1px 2px', borderRadius: 2, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', zIndex: 4 }}>NE</div>
        <div title="Noroeste" style={{ position: 'absolute', top: '34%', left: '22%', transform: 'translate(-50%,-50%)', fontSize: 7, fontWeight: 700, color: '#c0a060', background: 'rgba(10,15,22,0.9)', border: '1px solid rgba(212,175,55,0.3)', padding: '1px 2px', borderRadius: 2, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', zIndex: 4 }}>NO</div>
        <div title="Sureste" style={{ position: 'absolute', top: '66%', left: '78%', transform: 'translate(-50%,-50%)', fontSize: 7, fontWeight: 700, color: '#90a0b0', background: 'rgba(10,15,22,0.9)', border: '1px solid rgba(80,120,160,0.3)', padding: '1px 2px', borderRadius: 2, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', zIndex: 4 }}>SE</div>
        <div title="Suroeste" style={{ position: 'absolute', top: '66%', left: '22%', transform: 'translate(-50%,-50%)', fontSize: 7, fontWeight: 700, color: '#90a0b0', background: 'rgba(10,15,22,0.9)', border: '1px solid rgba(80,120,160,0.3)', padding: '1px 2px', borderRadius: 2, lineHeight: 1, pointerEvents: 'none', fontFamily: 'monospace', zIndex: 4 }}>SO</div>

        {/* ── Controles Integrados en la Esquina Superior Derecha (Zoom) ── */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 5,
          }}
        >
          <OrbBtn title="Aumentar Zoom (+)" onClick={zoomIn}>+</OrbBtn>
          <OrbBtn title="Reducir Zoom (−)" onClick={zoomOut}>−</OrbBtn>
        </div>

        {/* ── Indicador de Niebla / Exploración ── */}
        {fogEnabled && (
          <div
            title={`${exploredPercent}% explorado`}
            style={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 7,
              fontWeight: 800,
              color: '#d4b8ff',
              background: 'rgba(16, 10, 32, 0.92)',
              border: '1px solid rgba(160, 110, 255, 0.5)',
              padding: '1px 5px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontFamily: 'monospace',
              lineHeight: 1.2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
              zIndex: 5,
            }}
          >
            🌫️ {exploredPercent}%
          </div>
        )}
      </div>

      {/* ── Barra de Botones Acoplada Estilo Cresta Medieval RPG ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 3,
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1e2836 0%, #0d141e 100%)',
          border: '1px solid #c59b27',
          borderRadius: 14,
          padding: '2px 6px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.85), 0 0 6px rgba(197,155,39,0.25) inset',
          marginTop: -6,
          zIndex: 6,
        }}
      >
        <RpgActionBtn
          title={isExpanded ? 'Reducir tamaño' : 'Expandir minimapa'}
          active={isExpanded}
          activeColor="#ffd700"
          onClick={toggleExpand}
        >
          {isExpanded ? '🗗' : '⛶'}
        </RpgActionBtn>

        <div data-world-info-panel>
          <RpgActionBtn
            title="Fecha, Hora y Clima"
            active={isOpen}
            activeColor="#4a90e2"
            onClick={toggle}
          >
            📅
          </RpgActionBtn>
        </div>

        <RpgActionBtn
          title={showMissions ? 'Ocultar misiones' : 'Mostrar misiones'}
          active={showMissions}
          activeColor="#ffcc00"
          onClick={toggleMissions}
        >
          🎯
        </RpgActionBtn>

        <RpgActionBtn
          title={showAlerts ? 'Ocultar alertas' : 'Mostrar alertas'}
          active={showAlerts}
          activeColor="#ff4444"
          onClick={toggleAlerts}
        >
          ⚠️
        </RpgActionBtn>

        <RpgActionBtn
          title={fogEnabled ? 'Niebla activada' : 'Niebla desactivada'}
          active={fogEnabled}
          activeColor="#b89dff"
          onClick={toggleFog}
        >
          🌫️
        </RpgActionBtn>

        <div style={{ width: 1, height: 12, background: 'rgba(197,155,39,0.4)', margin: '0 1px' }} />

        <RpgActionBtn
          title={isTop ? 'Mover a inferior derecha' : 'Mover a superior derecha'}
          active={isTop}
          activeColor="#ffa500"
          onClick={togglePosition}
        >
          {isTop ? '⬇️' : '⬆️'}
        </RpgActionBtn>

        {fogEnabled && (
          <RpgActionBtn
            title="Reiniciar niebla"
            active={false}
            activeColor="#7a8e9e"
            onClick={clearFog}
          >
            🧹
          </RpgActionBtn>
        )}

        <RpgActionBtn
          title="Ocultar minimapa"
          active={false}
          activeColor="#7a8e9e"
          onClick={toggleVisibility}
        >
          ✕
        </RpgActionBtn>
      </div>
    </div>
  );
}

function OrbBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #2c3848 0%, #101822 100%)',
        border: '1px solid #c59b27',
        color: '#ffd700',
        fontSize: 11,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
        transition: 'transform 0.1s ease',
        padding: 0,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}

function RpgActionBtn({
  children,
  onClick,
  title,
  active = false,
  activeColor = '#ffd700',
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
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: active ? 'radial-gradient(circle, #382810 0%, #181206 100%)' : 'radial-gradient(circle, #1c2634 0%, #0b1118 100%)',
        border: `1px solid ${active ? activeColor : 'rgba(197,155,39,0.45)'}`,
        color: active ? activeColor : '#a8b6c4',
        fontSize: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: active ? `0 0 8px ${activeColor}66` : '0 1px 4px rgba(0,0,0,0.6)',
        transition: 'all 0.15s ease',
        padding: 0,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}

export default MiniMap;
