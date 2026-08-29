import { useState, useMemo, useEffect } from "react";
import { ALL_ITEM_CATEGORIES, createMockPlayerInventory, type ItemCategory, type PlayerInventoryItem } from "../../items/Item";
import { setInventoryOpen } from "../input/KeyBindings";

interface Props {
  onClose: () => void;
}

/**
 * PlayerInventoryPanel.tsx - Panel lateral derecho para el inventario del jugador.
 * Mismo tamaño y comportamiento que NpcPanel (285px, fixed right 0 top 32).
 * Se abre con la tecla de inventario (I) designada en KeyBindings.
 * Filtros superiores: Todos + 10 categorías (Armas, Equipo, Consumibles Magicos, etc.)
 */

const FILTERS: (ItemCategory | "Todos")[] = ["Todos", ...ALL_ITEM_CATEGORIES];

const CATEGORY_ICON: Record<ItemCategory, string> = {
  "Armas": "⚔️",
  "Equipo": "🛡️",
  "Consumibles Magicos": "✨",
  "Consumibles Comunes": "💊",
  "Comida y Bebida": "🍞",
  "Recurso Refinado": "🔧",
  "Recursos en Bruto": "🪨",
  "Utiles": "🔨",
  "Crias": "🐣",
  "Documentos": "📜",
};

export function PlayerInventoryPanel({ onClose }: Props) {
  useEffect(() => {
    setInventoryOpen(true);
    return () => setInventoryOpen(false);
  }, []);
  const [filter, setFilter] = useState<ItemCategory | "Todos">("Todos");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [items] = useState<PlayerInventoryItem[]>(() => createMockPlayerInventory());

  useEffect(() => {
    if (!isDropdownOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-inventory-filter]')) setIsDropdownOpen(false);
    };
    window.addEventListener('click', onClickOutside);
    return () => window.removeEventListener('click', onClickOutside);
  }, [isDropdownOpen]);

  const filtered = useMemo(() => {
    if (filter === "Todos") return items;
    return items.filter(it => it.categoria === filter);
  }, [items, filter]);

  return (
    <div style={{
      position: 'fixed', right: 0, top: 32, bottom: 0, width: '285px', minWidth: '240px', maxWidth: '90vw',
      borderLeft: '2px solid #4a90e2', backgroundColor: '#151515', boxSizing: 'border-box',
      overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
      zIndex: 100, boxShadow: '-4px 0 24px #000000aa', padding: '16px 16px 20px 16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 8, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 14, color: '#8ab4ff' }}>🎒 Inventario</h2>
        <button onClick={onClose} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>

      {/* Equipados - 10 cuadros organizados */}
      <div style={{ backgroundColor: '#1c1c1c', padding: 8, borderRadius: 8, border: '1px solid #2e2e2e', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 6, letterSpacing: 0.3 }}>Equipado</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, width: '100%' }}>
          {[
            { id: 'arma1', label: 'Arma 1', icon: '⚔️' },
            { id: 'arma2', label: 'Arma 2', icon: '🗡️' },
            { id: 'escudo', label: 'Escudo', icon: '🛡️' },
            { id: 'casco', label: 'Casco', icon: '⛑️' },
            { id: 'pecho', label: 'Pecho', icon: '🦺' },
            { id: 'botas', label: 'Botas', icon: '👢' },
            { id: 'collar', label: 'Collar', icon: '📿' },
            { id: 'anillo', label: 'Anillo', icon: '💍' },
            { id: 'consumible', label: 'Consum.', icon: '🧪' },
            { id: 'mochila', label: 'Mochila', icon: '🎒' },
          ].map(slot => (
            <div key={slot.id} title={slot.label} style={{
              aspectRatio: '1', background: '#252525', border: '1px solid #333', borderRadius: 4,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 1, padding: 2, cursor: 'pointer', overflow: 'hidden'
            }}>
              <div style={{ fontSize: 13, lineHeight: 1 }}>{slot.icon}</div>
              <div style={{ fontSize: 6, color: '#888', fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1 }}>{slot.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro desplegable superior - muestra 5 y scroll vertical */}
      <div data-inventory-filter style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: '100%', boxSizing: 'border-box', flexShrink: 0, position: 'relative' }}>
        <label style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: 0.3 }}>Filtrar por tipo</label>
        <button
          onClick={() => setIsDropdownOpen(v => !v)}
          style={{
            width: '100%', maxWidth: '100%', boxSizing: 'border-box',
            background: '#1e1e1e', color: '#ddd', border: '1px solid #333', borderRadius: 6,
            padding: '8px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'
          }}
        >
          <span>{filter === "Todos" ? "Todos los items" : `${CATEGORY_ICON[filter as ItemCategory]} ${filter}`}</span>
          <span style={{ fontSize: 10, color: '#888', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>
        {isDropdownOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
            background: '#1e1e1e', border: '1px solid #333', borderRadius: 6, boxShadow: '0 8px 16px #00000066',
            maxHeight: 140, overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            {FILTERS.map(cat => (
              <button
                key={cat}
                onClick={() => { setFilter(cat); setIsDropdownOpen(false); }}
                style={{
                  padding: '7px 10px', textAlign: 'left', background: filter === cat ? '#1e2a3a' : 'transparent',
                  color: filter === cat ? '#8ab4ff' : '#bbb', border: 'none', borderBottom: '1px solid #2a2a2a',
                  fontSize: 11, fontWeight: filter === cat ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                {cat === "Todos" ? "Todos los items" : `${CATEGORY_ICON[cat as ItemCategory]} ${cat}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid de espacios - 10 por fila, 20 disponibles (2 filas) + 30 bloqueados (3 filas) = 50 - con scroll vertical */}
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 10,
        flex: '1 1 auto', minHeight: 0, maxHeight: '42vh', maxWidth: '100%', width: '100%', boxSizing: 'border-box',
        overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#888' }}>{filtered.length} items</span>
          <span style={{ fontSize: 9, color: '#555' }}>{items.length}/20 · 30 bloqueados · 50 máx</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', textAlign: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ fontSize: 20, opacity: 0.3 }}>📭</div>
            <p style={{ fontSize: 10, color: '#666', margin: 0 }}>Sin items en {filter}</p>
            <button onClick={() => setFilter("Todos")} style={{ marginTop: 4, background: '#1e2a3a', color: '#8ab4ff', border: '1px solid #4a90e2', borderRadius: 6, padding: '3px 8px', fontSize: 9, cursor: 'pointer' }}>Ver todos</button>
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, width: '100%', minWidth: 0 }}>
          {(() => {
            const availableSlots = 20;
            const lockedSlots = 30;
            const slots: React.ReactNode[] = [];
            for (let i = 0; i < availableSlots; i++) {
              const it = filtered[i];
              if (it) {
                slots.push(
                  <div key={it.id} title={`${it.nombre} x${it.cantidad} · ${it.categoria}`} style={{
                    aspectRatio: '1', minWidth: 0, background: '#252525', border: '1px solid #3a3a3a', borderRadius: 4,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', cursor: 'pointer', overflow: 'hidden', padding: 2
                  }}>
                    <div style={{ fontSize: 13, lineHeight: 1 }}>{CATEGORY_ICON[it.categoria]}</div>
                    <div style={{ fontSize: 6, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.1, marginTop: 1 }}>{it.nombre.slice(0, 5)}</div>
                    <div style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 6, color: '#8ab4ff', background: '#1e2a3a', borderRadius: 2, padding: '0 2px', lineHeight: 1.1, fontWeight: 700 }}>x{it.cantidad}</div>
                  </div>
                );
              } else {
                slots.push(
                  <div key={`empty-${i}`} style={{
                    aspectRatio: '1', minWidth: 0, background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9
                  }}>
                    <span style={{ fontSize: 10, color: '#444' }}>·</span>
                  </div>
                );
              }
            }
            for (let i = 0; i < lockedSlots; i++) {
              slots.push(
                <div key={`locked-${i}`} title="Bloqueado - requiere mochila" style={{
                  aspectRatio: '1', minWidth: 0, background: '#0f0f0f', border: '1px dashed #333', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5
                }}>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>🔒</span>
                </div>
              );
            }
            return slots;
          })()}
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 8, color: '#555', justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0, paddingBottom: 4 }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#252525', border: '1px solid #3a3a3a', borderRadius: 2, verticalAlign: 'middle', marginRight: 3 }}></span> Disponible</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#111', border: '1px dashed #2a2a2a', borderRadius: 2, verticalAlign: 'middle', marginRight: 3 }}></span> Bloqueado (mochila)</span>
        </div>
      </div>

      <p style={{ fontSize: 10, color: '#555', textAlign: 'center', margin: 0, flexShrink: 0 }}>
        Filtra por tipo arriba • <b>I</b> o <b>ESC</b> para cerrar
      </p>
    </div>
  );
}
