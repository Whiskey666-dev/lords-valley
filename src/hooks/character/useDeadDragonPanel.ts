import { useState, useEffect, useCallback, useRef } from "react";
import {
  COMPORTAMIENTOS,
  FUNCIONES,
  HABILIDAD_CATEGORIAS,
  HABILIDADES_DETALLE,
  HABILIDAD_LABELS,
  type DeadDragonComportamiento,
  type DeadDragonFuncion,
  type DeadDragonHabilidadCategoria,
} from "../../characters/DeadDragon";
import type { DeadDragonPanelData } from "../../ui/character/DeadDragonPanel";

export function useDeadDragonPanel(
  initialDragon: DeadDragonPanelData,
  onClose: () => void
) {
  const [dragon, setDragon] = useState<DeadDragonPanelData>(initialDragon);
  const [showHabilidadesMenu, setShowHabilidadesMenu] = useState(false);

  // Sync when parent prop changes (new dragon selected)
  useEffect(() => {
    setDragon(initialDragon);
  }, [initialDragon]);

  // Listen for Phaser updates to this dragon
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<DeadDragonPanelData>).detail;
      if (detail && detail.id === dragon.id) setDragon(detail);
    };
    const onSelected = (e: Event) => {
      const d = (e as CustomEvent<DeadDragonPanelData>).detail;
      if (d && d.id === dragon.id) setDragon(d);
    };
    window.addEventListener("phaser-dead-dragon-updated" as any, onUpdated as EventListener);
    window.addEventListener("phaser-dead-dragon-selected" as any, onSelected as EventListener);
    return () => {
      window.removeEventListener("phaser-dead-dragon-updated" as any, onUpdated as EventListener);
      window.removeEventListener("phaser-dead-dragon-selected" as any, onSelected as EventListener);
    };
  }, [dragon.id]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Close habilidades menu on outside click
  const habilidadesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!showHabilidadesMenu) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-dd-habilidades]")) setShowHabilidadesMenu(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [showHabilidadesMenu]);

  // Derived values
  const salud = dragon.salud ?? dragon.health ?? 1500;
  const maxSalud = dragon.maxSalud ?? dragon.maxHealth ?? 1500;
  const energia = dragon.energia ?? 900;
  const maxEnergia = dragon.maxEnergia ?? 900;
  const saludPct = Math.max(0, Math.min(100, Math.round((salud / maxSalud) * 100)));
  const energiaPct = Math.max(0, Math.min(100, Math.round((energia / maxEnergia) * 100)));

  const slotsTotal = dragon.inventorySlots?.total ?? 20;
  const disponibles = dragon.inventorySlots?.disponibles ?? (dragon.equipment?.hasMochila ? 20 : 5);
  const bloqueados = dragon.inventorySlots?.bloqueados ?? (dragon.equipment?.hasMochila ? 0 : 15);
  const ocupados = dragon.inventorySlots?.ocupados ?? dragon.inventoryItems?.length ?? 0;
  const items = dragon.inventoryItems ?? [];

  const comportamiento = (dragon.comportamiento ?? "Pacifico") as DeadDragonComportamiento;
  const funcion = (dragon.funcion ?? "Espera aqui") as DeadDragonFuncion;
  const habilidadesActivas = new Set<string>(dragon.habilidadesActivas ?? []);
  const habilidadesSeleccionadas: Record<string, string[]> = dragon.habilidadesSeleccionadas ?? {};
  const hasHogar = !!dragon.hasHogar;
  const hogarPos = dragon.hogar ?? dragon.hogarPos ?? null;

  // Handlers
  const handleComportamiento = useCallback(
    (c: DeadDragonComportamiento) => {
      window.dispatchEvent(
        new CustomEvent("phaser-dead-dragon-set-comportamiento" as any, {
          detail: { id: dragon.id, comportamiento: c },
        })
      );
      setDragon((prev) => ({ ...prev, comportamiento: c } as any));
    },
    [dragon.id]
  );

  const handleFuncion = useCallback(
    (f: DeadDragonFuncion) => {
      if (f === "Ve a casa" && !hasHogar) return; // guard without hogar
      window.dispatchEvent(
        new CustomEvent("phaser-dead-dragon-set-funcion" as any, {
          detail: { id: dragon.id, funcion: f },
        })
      );
      setDragon((prev) => ({ ...prev, funcion: f } as any));
    },
    [dragon.id, hasHogar]
  );

  const handleToggleHabilidadCat = useCallback(
    (cat: DeadDragonHabilidadCategoria) => {
      window.dispatchEvent(
        new CustomEvent("phaser-dead-dragon-toggle-habilidad-cat" as any, {
          detail: { id: dragon.id, categoria: cat },
        })
      );
      setDragon((prev) => {
        const cur = new Set(prev.habilidadesActivas ?? []);
        if (cur.has(cat)) cur.delete(cat);
        else cur.add(cat);
        return { ...prev, habilidadesActivas: Array.from(cur) } as any;
      });
    },
    [dragon.id]
  );

  const handleToggleHabilidad = useCallback(
    (cat: DeadDragonHabilidadCategoria, hab: string) => {
      window.dispatchEvent(
        new CustomEvent("phaser-dead-dragon-toggle-habilidad" as any, {
          detail: { id: dragon.id, categoria: cat, habilidad: hab },
        })
      );
      setDragon((prev) => {
        const cur = { ...(prev.habilidadesSeleccionadas ?? {}) } as Record<string, string[]>;
        const arr = new Set(cur[cat] ?? []);
        if (arr.has(hab)) arr.delete(hab);
        else arr.add(hab);
        cur[cat] = Array.from(arr);
        return { ...prev, habilidadesSeleccionadas: cur } as any;
      });
    },
    [dragon.id]
  );

  const handleSetHogar = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("phaser-dead-dragon-set-hogar" as any, {
        detail: { id: dragon.id },
      })
    );
    const px = dragon.positionX ?? dragon.x ?? 3072;
    const py = dragon.positionY ?? dragon.y ?? 3072;
    setDragon((prev) => ({
      ...prev,
      hogar: { x: px, y: py },
      hasHogar: true,
      hogarPos: { x: px, y: py },
    } as any));
  }, [dragon.id, dragon.positionX, dragon.positionY, dragon.x, dragon.y]);

  const handleEquip = useCallback(
    (slot: "montura" | "mochila") => {
      const isEquipped =
        slot === "mochila" ? !!dragon.equipment?.mochila : !!dragon.equipment?.montura;
      if (isEquipped) {
        window.dispatchEvent(
          new CustomEvent("phaser-dead-dragon-unequip" as any, {
            detail: { id: dragon.id, slot },
          })
        );
        if (slot === "mochila") {
          setDragon((prev) => ({
            ...prev,
            equipment: { ...prev.equipment!, mochila: null, hasMochila: false } as any,
            inventorySlots: {
              total: 20,
              disponibles: 5,
              bloqueados: 15,
              ocupados: Math.min(prev.inventorySlots?.ocupados ?? 0, 5),
            },
          }));
        } else {
          setDragon((prev) => ({
            ...prev,
            equipment: { ...prev.equipment!, montura: null } as any,
          }));
        }
      } else {
        window.dispatchEvent(
          new CustomEvent("phaser-dead-dragon-equip" as any, {
            detail: { id: dragon.id, slot },
          })
        );
        if (slot === "mochila") {
          setDragon((prev) => ({
            ...prev,
            equipment: {
              ...prev.equipment!,
              mochila: { id: "moch_demo", nombre: "Mochila de Cuero", cantidad: 1 },
              hasMochila: true,
            } as any,
            inventorySlots: {
              total: 20,
              disponibles: 20,
              bloqueados: 0,
              ocupados: prev.inventorySlots?.ocupados ?? 0,
            },
          }));
        } else {
          setDragon((prev) => ({
            ...prev,
            equipment: {
              ...prev.equipment!,
              montura: { id: "mnt_demo", nombre: "Montura Ósea", cantidad: 1 },
            } as any,
          }));
        }
      }
    },
    [dragon.id, dragon.equipment]
  );

  const handleDamage = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("phaser-dead-dragon-damage" as any, {
        detail: { id: dragon.id, cantidad: 250 },
      })
    );
  }, [dragon.id]);

  const handleAddTestItem = useCallback(() => {
    const mock = {
      id: `mat_${Date.now()}`,
      nombre: ["Carne", "Piel", "Hueso", "Escama"][Math.floor(Math.random() * 4)],
      cantidad: Math.floor(Math.random() * 5) + 1,
      categoria: "Recurso",
    };
    window.dispatchEvent(
      new CustomEvent("phaser-dead-dragon-add-item" as any, {
        detail: { id: dragon.id, item: mock },
      })
    );
    setDragon((prev) => {
      const curItems = prev.inventoryItems ?? [];
      const curDisp = prev.inventorySlots?.disponibles ?? 5;
      if (curItems.length >= curDisp) return prev;
      const n = [...curItems, mock];
      return {
        ...prev,
        inventoryItems: n,
        inventorySlots: { ...prev.inventorySlots!, ocupados: n.length },
      } as any;
    });
  }, [dragon.id]);

  return {
    // State
    dragon,
    showHabilidadesMenu,
    setShowHabilidadesMenu,
    habilidadesRef,
    // Derived
    salud, maxSalud, energia, maxEnergia,
    saludPct, energiaPct,
    slotsTotal, disponibles, bloqueados, ocupados,
    items,
    comportamiento, funcion,
    habilidadesActivas, habilidadesSeleccionadas,
    hasHogar, hogarPos,
    // Catalog constants
    COMPORTAMIENTOS, FUNCIONES, HABILIDAD_CATEGORIAS, HABILIDADES_DETALLE, HABILIDAD_LABELS,
    // Handlers
    handleComportamiento,
    handleFuncion,
    handleToggleHabilidadCat,
    handleToggleHabilidad,
    handleSetHogar,
    handleEquip,
    handleDamage,
    handleAddTestItem,
  };
}

export default useDeadDragonPanel;
