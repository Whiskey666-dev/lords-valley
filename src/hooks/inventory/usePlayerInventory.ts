import { useState, useMemo, useEffect } from "react";
import {
  ALL_ITEM_CATEGORIES,
  createMockPlayerInventory,
  type ItemCategory,
  type PlayerInventoryItem,
} from "../../items/Item";
import { setInventoryOpen } from "../../ui/input/KeyBindings";

export const INVENTORY_FILTERS: (ItemCategory | "Todos")[] = ["Todos", ...ALL_ITEM_CATEGORIES];

export const CATEGORY_ICON: Record<ItemCategory, string> = {
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

export function usePlayerInventory(onClose?: () => void) {
  const [filter, setFilter] = useState<ItemCategory | "Todos">("Todos");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [items] = useState<PlayerInventoryItem[]>(() => createMockPlayerInventory());

  // Registrar flag de inventario abierto para control de inputs
  useEffect(() => {
    setInventoryOpen(true);
    return () => setInventoryOpen(false);
  }, []);

  // Cierre con tecla Escape
  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Cierre de dropdown al hacer click fuera
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-inventory-filter]")) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, [isDropdownOpen]);

  const filteredItems = useMemo(() => {
    if (filter === "Todos") return items;
    return items.filter(it => it.categoria === filter);
  }, [items, filter]);

  const toggleDropdown = () => setIsDropdownOpen(v => !v);
  const closeDropdown = () => setIsDropdownOpen(false);
  const selectFilter = (cat: ItemCategory | "Todos") => {
    setFilter(cat);
    setIsDropdownOpen(false);
  };

  return {
    items,
    filteredItems,
    filter,
    setFilter,
    selectFilter,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    availableSlotsCount: 20,
    lockedSlotsCount: 30,
    maxSlotsCount: 50,
  };
}

export default usePlayerInventory;
