import React, { useEffect, useState } from "react";
import { type ItemCategory, type PlayerInventoryItem } from "../../../items/Item";
import { CATEGORY_ICON } from "../../../hooks/inventory/usePlayerInventory";
import { removeItemRemote, activateItemRemote } from "../../../hooks/inventory/playerInventoryStore";

interface Props {
  items: PlayerInventoryItem[];
  filteredItems: PlayerInventoryItem[];
  filter: ItemCategory | "Todos";
  onResetFilter: () => void;
  availableSlots: number;
  lockedSlots: number;
  maxSlots: number;
}

const MENU_W = 176;

export function InventorySlotsGrid({
  items,
  filteredItems,
  filter,
  onResetFilter,
  availableSlots,
  lockedSlots,
  maxSlots,
}: Props) {
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<PlayerInventoryItem | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Stack en vivo si aún existe; si no, la foto al abrir el menú (para mostrar feedback)
  const selected = menu ? (items.find(it => it.id === menu.id) ?? snapshot) : undefined;

  // Cierra con Escape
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenu(null);
        setShowInfo(false);
        setFeedback(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const openMenu = (e: React.MouseEvent, item: PlayerInventoryItem) => {
    e.stopPropagation();
    const x = Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8));
    const y = Math.max(8, Math.min(e.clientY, window.innerHeight - 220));
    setMenu({ id: item.id, x, y });
    setSnapshot({ ...item });
    setShowInfo(false);
    setFeedback(null);
  };

  const closeMenu = () => {
    setMenu(null);
    setSnapshot(null);
    setShowInfo(false);
    setFeedback(null);
  };

  const flashAndClose = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setMenu(null);
      setSnapshot(null);
      setShowInfo(false);
      setFeedback(null);
    }, 1400);
  };

  const handleUse = () => {
    if (!selected || busy) return;
    setBusy(true);
    void activateItemRemote(selected.id).then((res) => {
      setBusy(false);
      flashAndClose(res.message);
    });
  };

  const handleDelete = () => {
    if (!selected || busy) return;
    setBusy(true);
    void removeItemRemote(selected.id).then((res) => {
      setBusy(false);
      flashAndClose(res.message);
    });
  };

  const slots: React.ReactNode[] = [];

  for (let i = 0; i < availableSlots; i++) {
    const it = filteredItems[i];
    if (it) {
      slots.push(
        <div
          key={it.id}
          title={`${it.nombre} x${it.cantidad} · ${it.categoria} (click para opciones)`}
          onClick={(e) => openMenu(e, it)}
          style={{
            aspectRatio: '1',
            minWidth: 0,
            background: menu?.id === it.id ? '#2a3a52' : '#252525',
            border: menu?.id === it.id ? '1px solid #4a90e2' : '1px solid #3a3a3a',
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
          <div style={{ fontSize: 13, lineHeight: 1 }}>{it.icono ?? CATEGORY_ICON[it.categoria]}</div>
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

  const isEmpty = items.length === 0;

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
          <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
            {isEmpty ? "Inventario vacío. Usa la consola: addItem:Madera5" : `Sin items en ${filter}`}
          </p>
          {filter !== "Todos" && (
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
          )}
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
        <span>Click en un item para opciones</span>
      </div>

      {/* Menú contextual del item */}
      {menu && selected && (
        <>
          <div
            onClick={closeMenu}
            style={{ position: 'fixed', inset: 0, zIndex: 290, background: 'transparent' }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: menu.x,
              top: menu.y,
              width: MENU_W,
              zIndex: 300,
              background: '#1e1e1e',
              border: '1px solid #444',
              borderRadius: 8,
              boxShadow: '0 10px 24px #000000aa',
              overflow: 'hidden',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', borderBottom: '1px solid #333', background: '#242424' }}>
              <span style={{ fontSize: 14 }}>{selected.icono ?? CATEGORY_ICON[selected.categoria]}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {selected.nombre}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#8ab4ff' }}>x{selected.cantidad}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: 4, gap: 2 }}>
              <button
                onClick={handleUse}
                disabled={busy}
                style={{ textAlign: 'left', background: 'transparent', color: '#8acfff', border: 'none', borderRadius: 5, padding: '6px 8px', fontSize: 11, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1e2a3a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                ✅ Usar
              </button>
              <button
                onClick={() => { setShowInfo(v => !v); setFeedback(null); }}
                style={{ textAlign: 'left', background: showInfo ? '#1e2a3a' : 'transparent', color: '#bbb', border: 'none', borderRadius: 5, padding: '6px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={(e) => { if (!showInfo) e.currentTarget.style.background = '#262626'; }}
                onMouseLeave={(e) => { if (!showInfo) e.currentTarget.style.background = 'transparent'; }}
              >
                ℹ️ Info
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                style={{ textAlign: 'left', background: 'transparent', color: '#ff7a7a', border: 'none', borderRadius: 5, padding: '6px 8px', fontSize: 11, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2a1a1a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                🗑️ Eliminar
              </button>
            </div>
            {showInfo && (
              <div style={{ borderTop: '1px solid #333', padding: '7px 9px', display: 'flex', flexDirection: 'column', gap: 3, background: '#191919' }}>
                <div style={{ fontSize: 9, color: '#888' }}>Categoría: <b style={{ color: '#ccc' }}>{selected.categoria}</b></div>
                <div style={{ fontSize: 9, color: '#888' }}>Cantidad: <b style={{ color: '#ccc' }}>x{selected.cantidad}{selected.stackable ? ` (máx ${selected.maxStack})` : " (no acumulable)"}</b></div>
                <div style={{ fontSize: 9, color: '#999', lineHeight: 1.35 }}>
                  {selected.descripcion ?? "Sin descripción."}
                </div>
              </div>
            )}
            {feedback && (
              <div style={{ borderTop: '1px solid #333', padding: '6px 9px', fontSize: 9, color: '#ffd54f', background: '#1e1508', lineHeight: 1.3 }}>
                {feedback}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
