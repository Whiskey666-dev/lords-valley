import React from "react";
import { type ItemCategory, type PlayerInventoryItem } from "../../../items/Item";
import { CATEGORY_ICON } from "../../../hooks/inventory/usePlayerInventory";

interface Props {
  items: PlayerInventoryItem[];
  filteredItems: PlayerInventoryItem[];
  filter: ItemCategory | "Todos";
  onResetFilter: () => void;
  availableSlots: number;
  lockedSlots: number;
  maxSlots: number;
}

export function InventorySlotsGrid({
  items,
  filteredItems,
  filter,
  onResetFilter,
  availableSlots,
  lockedSlots,
  maxSlots,
}: Props) {
  const slots: React.ReactNode[] = [];

  for (let i = 0; i < availableSlots; i++) {
    const it = filteredItems[i];
    if (it) {
      slots.push(
        <div
          key={it.id}
          title={`${it.nombre} x${it.cantidad} · ${it.categoria}`}
          style={{
            aspectRatio: '1',
            minWidth: 0,
            background: '#252525',
            border: '1px solid #3a3a3a',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
            padding: 2,
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1 }}>{CATEGORY_ICON[it.categoria]}</div>
          <div style={{
            fontSize: 6,
            color: '#fff',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            lineHeight: 1.1,
            marginTop: 1,
          }}>
            {it.nombre.slice(0, 5)}
          </div>
          <div style={{
            position: 'absolute',
            bottom: 1,
            right: 2,
            fontSize: 6,
            color: '#8ab4ff',
            background: '#1e2a3a',
            borderRadius: 2,
            padding: '0 2px',
            lineHeight: 1.1,
            fontWeight: 700,
          }}>
            x{it.cantidad}
          </div>
        </div>
      );
    } else {
      slots.push(
        <div
          key={`empty-${i}`}
          style={{
            aspectRatio: '1',
            minWidth: 0,
            background: '#1e1e1e',
            border: '1px solid #2a2a2a',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9,
          }}
        >
          <span style={{ fontSize: 10, color: '#444' }}>·</span>
        </div>
      );
    }
  }

  for (let i = 0; i < lockedSlots; i++) {
    slots.push(
      <div
        key={`locked-${i}`}
        title="Bloqueado - requiere mochila"
        style={{
          aspectRatio: '1',
          minWidth: 0,
          background: '#0f0f0f',
          border: '1px dashed #333',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5,
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.7 }}>🔒</span>
      </div>
    );
  }

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 8,
      padding: 10,
      flex: '1 1 auto',
      minHeight: 0,
      maxHeight: '42vh',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#888' }}>{filteredItems.length} items</span>
        <span style={{ fontSize: 9, color: '#555' }}>
          {items.length}/{availableSlots} · {lockedSlots} bloqueados · {maxSlots} máx
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', textAlign: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 20, opacity: 0.3 }}>📭</div>
          <p style={{ fontSize: 10, color: '#666', margin: 0 }}>Sin items en {filter}</p>
          <button
            onClick={onResetFilter}
            style={{
              marginTop: 4,
              background: '#1e2a3a',
              color: '#8ab4ff',
              border: '1px solid #4a90e2',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 9,
              cursor: 'pointer',
            }}
          >
            Ver todos
          </button>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, width: '100%', minWidth: 0 }}>
        {slots}
      </div>

      <div style={{ display: 'flex', gap: 6, fontSize: 8, color: '#555', justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0, paddingBottom: 4 }}>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#252525', border: '1px solid #3a3a3a', borderRadius: 2, verticalAlign: 'middle', marginRight: 3 }}></span>
          Disponible
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#111', border: '1px dashed #2a2a2a', borderRadius: 2, verticalAlign: 'middle', marginRight: 3 }}></span>
          Bloqueado (mochila)
        </span>
      </div>
    </div>
  );
}
