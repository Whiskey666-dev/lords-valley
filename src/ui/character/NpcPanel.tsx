import { useNpcPanel, type NpcPanelData, type NpcTab } from "../../hooks/character/useNpcPanel";
import { NpcStatusTab } from "./components/NpcStatusTab";
import { NpcAttributesTab } from "./components/NpcAttributesTab";
import { NpcProfessionsTab } from "./components/NpcProfessionsTab";
import { NpcInventoryTab } from "./components/NpcInventoryTab";

export type { NpcPanelData };

interface Props {
  npc: NpcPanelData;
  onClose: () => void;
}

const TABS: { id: NpcTab; label: string }[] = [
  { id: "estado", label: "Estado" },
  { id: "atributos", label: "Atributos" },
  { id: "profesiones", label: "Profesiones" },
  { id: "inventario", label: "Inventario" },
];

export function NpcPanel({ npc, onClose }: Props) {
  const {
    tab,
    setTab,
    isCore,
    displayName,
    displayProfession,
    displayLoyalty,
    displayHealth,
    maxHealth,
    hunger,
    thirst,
    fatigue,
    formattedLvy,
  } = useNpcPanel(npc);

  return (
    <div style={{
      width: '285px',
      minWidth: '240px',
      maxWidth: '90vw',
      borderLeft: '2px solid #00ff88',
      backgroundColor: '#151515',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      zIndex: 100,
      boxShadow: '-4px 0 24px #000000aa',
      padding: '16px 16px 20px 16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 8, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: '#ffd66b' }}>🏰 {displayName}</h2>
        <button
          onClick={onClose}
          style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
        >
          ✕
        </button>
      </div>

      {/* Info General & Stats */}
      <div style={{ backgroundColor: '#1c1c1c', padding: 12, borderRadius: 8, border: '1px solid #2e2e2e', flexShrink: 0 }}>
        <h3 style={{ color: '#6ab0ff', margin: '0 0 6px 0', fontSize: 13 }}>
          👤 {displayName} {npc.edad || npc.age ? <span style={{ color: '#777', fontWeight: 400, fontSize: 11 }}>({npc.edad ?? npc.age} años)</span> : null} {npc.gender ? <span style={{ color: '#999', fontSize: 10 }}> • {npc.gender}</span> : null}
        </h3>
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          <div><strong>Profesión:</strong> {displayProfession} {isCore && npc.professions?.[0] ? <span style={{ color: '#8cf' }}>Lv{npc.professions[0].level}</span> : null}</div>
          {npc.isPlayer ? (
            <div><strong>Username:</strong> {npc.username ?? displayName}</div>
          ) : isCore ? (
            <>
              <div><strong>Lealtad:</strong> {displayLoyalty}% {npc.isLoyalAbsolute ? '★ ABSOLUTA' : ''}</div>
              <div><strong>Pos:</strong> {Math.round(npc.positionX ?? 0)},{Math.round(npc.positionY ?? 0)}</div>
              {formattedLvy && <div><strong>LVY:</strong> {formattedLvy}</div>}
            </>
          ) : (
            <>
              <div><strong>Personalidad:</strong> {npc.personalidad} <span style={{ color: '#999' }}>({npc.temperamento})</span></div>
              <div><strong>Rasgos:</strong> {npc.traits?.join(", ")}</div>
              <div><strong>Gustos:</strong> {npc.gustos}</div>
            </>
          )}
        </div>

        {/* Barras de Estado */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>Lealtad</span>
            <span style={{ color: displayLoyalty === 100 ? '#ffd700' : '#aaa' }}>{Math.min(100, displayLoyalty)}% {displayLoyalty === 100 ? '★' : ''}</span>
          </div>
          <div style={{ width: '100%', background: '#2a2a2a', borderRadius: 4, height: 8, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, displayLoyalty)}%`, background: displayLoyalty === 100 ? '#ffd700' : '#4caf50', height: '100%', borderRadius: 4 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6 }}>
            <span>Salud</span>
            <span>{displayHealth}/{maxHealth} ({Math.round((displayHealth / maxHealth) * 100)}%)</span>
          </div>
          <div style={{ width: '100%', background: '#2a2a2a', borderRadius: 4, height: 8, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.round((displayHealth / maxHealth) * 100))}%`, background: displayHealth > 60 ? '#4caf50' : displayHealth > 20 ? '#ff9800' : '#e53935', height: '100%', borderRadius: 4 }} />
          </div>

          {isCore && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10 }}>
              <div>Hambre {hunger}%<div style={{ background: '#2a2a2a', height: 4, borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${hunger}%`, background: hunger > 80 ? '#e53935' : '#ff9800', height: '100%' }} /></div></div>
              <div>Sed {thirst}%<div style={{ background: '#2a2a2a', height: 4, borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${thirst}%`, background: thirst > 80 ? '#e53935' : '#29b6f6', height: '100%' }} /></div></div>
              <div>Fatiga {fatigue}%<div style={{ background: '#2a2a2a', height: 4, borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${fatigue}%`, background: '#ab47bc', height: '100%' }} /></div></div>
              <div>Cordura {npc.needs?.sanity ?? 100}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: 6, width: '100%', overflow: 'hidden', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              padding: '6px 4px',
              borderRadius: 6,
              border: tab === t.id ? '1px solid #4a90e2' : '1px solid #333',
              background: tab === t.id ? '#1e2a3a' : '#1e1e1e',
              color: tab === t.id ? '#8ab4ff' : '#aaa',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del Tab Activo */}
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: 10,
        flex: '0 1 auto',
        minHeight: 140,
        maxHeight: '42vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {tab === "estado" && <NpcStatusTab npc={npc} isCore={isCore} />}
        {tab === "atributos" && <NpcAttributesTab npc={npc} isCore={isCore} />}
        {tab === "profesiones" && <NpcProfessionsTab npc={npc} isCore={isCore} />}
        {tab === "inventario" && <NpcInventoryTab npc={npc} isCore={isCore} />}
      </div>
    </div>
  );
}
