import { useGameStore } from '../../app/store/useGameStore';
import { formatLvy } from '../../common/bigint';

export function InventoryPanel() {
  const inventory = useGameStore((s) => s.inventory);
  if (!inventory || inventory.length === 0) return <div style={{ fontSize: 11, color: '#666' }}>Inventario vacío</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h4 style={{ margin: 0, fontSize: 12, color: '#ccc' }}>Inventario Central ({inventory.length})</h4>
      <div style={{ maxHeight: 180, overflowY: 'auto', background: '#111', borderRadius: 6, padding: 6 }}>
        {inventory.map((it: any) => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', borderBottom: '1px solid #222' }}>
            <span>{it.type}</span>
            <span style={{ color: '#ffd700' }}>{formatLvy(it.quantity)} <small style={{ color: '#777' }}>{it.weight}kg/u</small></span>
          </div>
        ))}
      </div>
      <small style={{ color: '#666', fontSize: 10 }}>Cantidades string BigInt 256 bits, formato recortado 2 decimales</small>
    </div>
  );
}
