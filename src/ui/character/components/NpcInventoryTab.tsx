import { type NpcPanelData } from "../../../hooks/character/useNpcPanel";

interface Props {
  npc: NpcPanelData;
  isCore: boolean;
}

export function NpcInventoryTab({ npc, isCore }: Props) {
  if (isCore && npc.inventory?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {npc.inventory.map(it => (
          <div
            key={it.id}
            style={{
              background: '#222',
              padding: 6,
              borderRadius: 6,
              fontSize: 11,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{it.type}</span>
            <span style={{ color: '#8cf' }}>
              {(BigInt(it.quantity) / BigInt(10) ** BigInt(18)).toString()}{" "}
              <span style={{ color: '#666' }}>{it.weight}kg</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 4, textAlign: 'center' }}>
      <div style={{ fontSize: 20, opacity: 0.3 }}>📦</div>
      <div style={{ fontSize: 11, color: '#666' }}>Inventario vacío / mock</div>
    </div>
  );
}
