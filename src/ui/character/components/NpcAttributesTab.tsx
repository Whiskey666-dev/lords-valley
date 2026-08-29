import { type NpcPanelData } from "../../../hooks/character/useNpcPanel";

interface Props {
  npc: NpcPanelData;
  isCore: boolean;
}

export function NpcAttributesTab({ npc, isCore }: Props) {
  if (isCore && npc.attributes) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
        {Object.entries(npc.attributes).map(([k, v]) => (
          <div
            key={k}
            style={{
              background: '#222',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ textTransform: 'capitalize' }}>{k}</span>
            <b style={{ color: '#8cf' }}>{v as number}</b>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ fontSize: 11, color: '#666' }}>
      Sin atributos core — es mock local. Usa survivors del settlement.
    </div>
  );
}
