import { type ItemCategory } from "../../../items/Item";
import { INVENTORY_FILTERS, CATEGORY_ICON } from "../../../hooks/inventory/usePlayerInventory";

interface Props {
  filter: ItemCategory | "Todos";
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onSelectFilter: (cat: ItemCategory | "Todos") => void;
}

export function InventoryCategoryFilter({
  filter,
  isDropdownOpen,
  onToggleDropdown,
  onSelectFilter,
}: Props) {
  return (
    <div
      data-inventory-filter
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <label style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: 0.3 }}>
        Filtrar por tipo
      </label>
      <button
        onClick={onToggleDropdown}
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          background: '#1e1e1e',
          color: '#ddd',
          border: '1px solid #333',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
        }}
      >
        <span>
          {filter === "Todos" ? "Todos los items" : `${CATEGORY_ICON[filter as ItemCategory]} ${filter}`}
        </span>
        <span style={{ fontSize: 10, color: '#888', transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>
      {isDropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          zIndex: 10,
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: 6,
          boxShadow: '0 8px 16px #00000066',
          maxHeight: 140,
          overflowX: 'hidden',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {INVENTORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => onSelectFilter(cat)}
              style={{
                padding: '7px 10px',
                textAlign: 'left',
                background: filter === cat ? '#1e2a3a' : 'transparent',
                color: filter === cat ? '#8ab4ff' : '#bbb',
                border: 'none',
                borderBottom: '1px solid #2a2a2a',
                fontSize: 11,
                fontWeight: filter === cat ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cat === "Todos" ? "Todos los items" : `${CATEGORY_ICON[cat as ItemCategory]} ${cat}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
