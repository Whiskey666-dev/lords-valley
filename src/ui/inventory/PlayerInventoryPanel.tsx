import { usePlayerInventory } from "../../hooks/inventory/usePlayerInventory";
import { EquippedSlotsGrid } from "./components/EquippedSlotsGrid";
import { InventoryCategoryFilter } from "./components/InventoryCategoryFilter";
import { InventorySlotsGrid } from "./components/InventorySlotsGrid";

interface Props {
  onClose: () => void;
}

/**
 * PlayerInventoryPanel.tsx - Panel lateral derecho para el inventario del jugador.
 * Mismo tamaño y comportamiento que NpcPanel (285px, fixed right 0 top 32).
 * Desacoplado y modularizado usando usePlayerInventory y subcomponentes.
 */
export function PlayerInventoryPanel({ onClose }: Props) {
  const {
    items,
    filteredItems,
    filter,
    selectFilter,
    isDropdownOpen,
    toggleDropdown,
    availableSlotsCount,
    lockedSlotsCount,
    maxSlotsCount,
  } = usePlayerInventory(onClose);

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 32,
      bottom: 0,
      width: '285px',
      minWidth: '240px',
      maxWidth: '90vw',
      borderLeft: '2px solid #4a90e2',
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
        <h2 style={{ margin: 0, fontSize: 14, color: '#8ab4ff' }}>🎒 Inventario</h2>
        <button
          onClick={onClose}
          style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
        >
          ✕
        </button>
      </div>

      {/* Equipados */}
      <EquippedSlotsGrid />

      {/* Filtro desplegable superior */}
      <InventoryCategoryFilter
        filter={filter}
        isDropdownOpen={isDropdownOpen}
        onToggleDropdown={toggleDropdown}
        onSelectFilter={selectFilter}
      />

      {/* Grid de espacios */}
      <InventorySlotsGrid
        items={items}
        filteredItems={filteredItems}
        filter={filter}
        onResetFilter={() => selectFilter("Todos")}
        availableSlots={availableSlotsCount}
        lockedSlots={lockedSlotsCount}
        maxSlots={maxSlotsCount}
      />

      <p style={{ fontSize: 10, color: '#555', textAlign: 'center', margin: 0, flexShrink: 0 }}>
        Filtra por tipo arriba • <b>I</b> o <b>ESC</b> para cerrar
      </p>
    </div>
  );
}
