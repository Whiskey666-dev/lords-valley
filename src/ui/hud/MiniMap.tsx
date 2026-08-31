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
    toggleExpand,
    toggleMissions,
    toggleAlerts,
    togglePosition,
    toggleVisibility,
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

      {/* Contenedor flexible principal con botones laterales a la izquierda, minimapa en el centro y barra de zoom a la derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* ── Botones de opciones a la izquierda del minimapa ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            alignItems: 'center',
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

          {/* Separador sutil */}
          <div style={{ width: 18, height: 1, background: '#1a2a3c', margin: '2px 0', borderRadius: 1 }} />

          {/* Botón: Cambiar ubicación (superior / inferior derecha) */}
          <CircleBtn
            title={isTop ? 'Mover minimapa a inferior derecha' : 'Mover minimapa a superior derecha'}
            active={isTop}
            activeColor="#ffa500"
            onClick={togglePosition}
          >
            {isTop ? '⬇️' : '⬆️'}
          </CircleBtn>

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

        {/* ── Contenedor del minimapa circular central ── */}
        <div style={{ position: 'relative', width: currentSize, height: currentSize }}>
          {/* Canvas circular */}
          <div
            onClick={handleMiniMapClick}
            title="Click para centrar cámara"
            style={{
              width: currentSize,
              height: currentSize,
              borderRadius: '50%',
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

            {/* Borde interior circular sutil */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
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

            {/* Indicador de escala / zoom en la parte inferior interior */}
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.65)',
                padding: '1px 5px',
                borderRadius: 4,
                fontSize: 8,
                fontFamily: 'monospace',
                color: '#8ab4ff',
                pointerEvents: 'none',
                letterSpacing: 0.5,
              }}
            >
              {miniZoom}x
            </div>
          </div>

          {/* Botón superior derecho: Información de fecha / hora / clima */}
          <button
            data-world-info-panel
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              toggle();
            }}
            title="Fecha, Hora y Clima del juego"
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: isOpen ? '#1e2d40' : '#141e28',
              border: isOpen ? '1.5px solid #4a90e2' : '1.5px solid #2a3c50',
              color: isOpen ? '#8ab4ff' : '#ccd',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
              zIndex: 30,
              transition: 'all 0.15s ease',
              padding: 0,
            }}
          >
            📅
          </button>
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
