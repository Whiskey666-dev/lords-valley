import Phaser from "phaser";
import { CHUNK_PX } from "../game/world/Terrain";

/**
 * DeadDragon.ts - NPC Dead Dragon
 * Aliado/Enemigo con stats 1500 salud / 900 energia, inventario 20 (5 libres), 2 equips Montura/Mochila,
 * 6 órdenes y barra de vida oculta hasta recibir daño.
 */

export type DeadDragonOrder =
  | "Agresivo"
  | "Defensivo"
  | "Pasivo"
  | "Espera aqui"
  | "Ve a casa"
  | "Rastrea";

// — Nuevo sistema 3 categorías (pueden activarse combinadas entre categorías) —
export type DeadDragonComportamiento = "Agresivo" | "Defensivo" | "Pacifico";
export const COMPORTAMIENTOS: DeadDragonComportamiento[] = ["Agresivo", "Defensivo", "Pacifico"];

export type DeadDragonFuncion = "Espera aqui" | "Sigueme" | "Ve a casa";
export const FUNCIONES: DeadDragonFuncion[] = ["Espera aqui", "Sigueme", "Ve a casa"];

export type DeadDragonHabilidadCategoria = "Magia" | "Ataques Fisicos" | "Invocaciones" | "Soporte";
export const HABILIDAD_CATEGORIAS: DeadDragonHabilidadCategoria[] = ["Magia", "Ataques Fisicos", "Invocaciones", "Soporte"];

// Mapa detallado para menú de habilidades (4 categorías × 3 habilidades)
export const HABILIDADES_DETALLE: Record<DeadDragonHabilidadCategoria, string[]> = {
  "Ataques Fisicos": ["Zarpaso", "Mordida", "Coletazo"],
  "Magia": ["Aliento de fuego macabro", "Aliento gelido", "Mordida venenosa"],
  "Soporte": ["Rugido desmoralizante", "Robo de vida", "Robo de energia"],
  "Invocaciones": ["Invocar Dead Knights", "Invocar Plaga", "Revivir cadaver"],
};

// Labels UI para categoría Magia → "Ataques Magicos"
export const HABILIDAD_LABELS: Record<DeadDragonHabilidadCategoria, string> = {
  "Ataques Fisicos": "Ataques Fisicos",
  "Magia": "Ataques Magicos",
  "Soporte": "Soporte",
  "Invocaciones": "Invocaciones",
};

// Compat: mantiene DEAD_DRAGON_ORDERS para código legacy
export const DEAD_DRAGON_ORDERS: DeadDragonOrder[] = [
  "Agresivo",
  "Defensivo",
  "Pasivo",
  "Espera aqui",
  "Ve a casa",
  "Rastrea",
];

export const DEAD_DRAGON_MAX_SALUD = 1500;
export const DEAD_DRAGON_MAX_ENERGIA = 900;
export const DEAD_DRAGON_INVENTORY_TOTAL = 20;
export const DEAD_DRAGON_INVENTORY_FREE = 5;
export const DEAD_DRAGON_INVENTORY_LOCKED = 15;

export interface DeadDragonInventoryItem {
  id: string;
  nombre: string;
  cantidad: number;
  categoria: string;
}

export class DeadDragonStats {
  public maxSalud: number = DEAD_DRAGON_MAX_SALUD;
  public salud: number = DEAD_DRAGON_MAX_SALUD;
  public maxEnergia: number = DEAD_DRAGON_MAX_ENERGIA;
  public energia: number = DEAD_DRAGON_MAX_ENERGIA;

  recibirDano(cantidad: number) {
    this.salud = Math.max(0, this.salud - cantidad);
  }

  curar(cantidad: number) {
    this.salud = Math.min(this.maxSalud, this.salud + cantidad);
  }

  consumirEnergia(cantidad: number) {
    this.energia = Math.max(0, this.energia - cantidad);
  }
}

export class DeadDragonEquipment {
  public montura: DeadDragonInventoryItem | null = null;
  public mochila: DeadDragonInventoryItem | null = null;

  getResumen(): string[] {
    const res: string[] = [];
    res.push(`Montura: ${this.montura ? this.montura.nombre : "Vacío"}`);
    res.push(`Mochila: ${this.mochila ? this.mochila.nombre + " (+" + DEAD_DRAGON_INVENTORY_LOCKED + " slots)" : "Vacío"}`);
    return res;
  }

  get hasMochila(): boolean {
    return !!this.mochila;
  }

  equipMontura(item: DeadDragonInventoryItem | null) {
    this.montura = item;
  }

  equipMochila(item: DeadDragonInventoryItem | null) {
    this.mochila = item;
  }

  desequipar(slot: "montura" | "mochila") {
    if (slot === "montura") this.montura = null;
    if (slot === "mochila") this.mochila = null;
  }
}

export class DeadDragonInventory {
  public items: DeadDragonInventoryItem[] = [];
  private equipment: DeadDragonEquipment;
  // capacidad real depende de si tiene mochila
  constructor(equipment: DeadDragonEquipment) {
    this.equipment = equipment;
    // inicia vacío (0 items) — 5 slots libres visibles
  }

  get capacidadTotal(): number {
    return DEAD_DRAGON_INVENTORY_TOTAL;
  }

  get slotsDisponibles(): number {
    return this.equipment.hasMochila ? DEAD_DRAGON_INVENTORY_TOTAL : DEAD_DRAGON_INVENTORY_FREE;
  }

  get slotsBloqueados(): number {
    return this.equipment.hasMochila ? 0 : DEAD_DRAGON_INVENTORY_LOCKED;
  }

  get slotsOcupados(): number {
    return this.items.length;
  }

  canAdd(): boolean {
    return this.items.length < this.slotsDisponibles;
  }

  addItem(item: DeadDragonInventoryItem): boolean {
    if (!this.canAdd()) return false;
    const existing = this.items.find((it) => it.nombre === item.nombre);
    if (existing) {
      existing.cantidad += item.cantidad;
    } else {
      this.items.push(item);
    }
    return true;
  }

  removeItem(id: string): boolean {
    const idx = this.items.findIndex((it) => it.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }

  getResumen(): string[] {
    if (this.items.length === 0) return ["Inventario vacío"];
    return this.items.map((it) => `${it.nombre} x${it.cantidad}`);
  }
}

// ---------------------------------------------------------------------------
// Sprite Phaser para Dead Dragon — 200x200 8 frames
// ---------------------------------------------------------------------------
export class DeadDragonSprite extends Phaser.Physics.Arcade.Sprite {
  public isAlly: boolean;
  private healthBarBg: Phaser.GameObjects.Rectangle | null = null;
  private healthBarFill: Phaser.GameObjects.Rectangle | null = null;
  private healthBarVisibleUntil: number = 0;
  private hasTakenDamage = false;

  constructor(scene: Phaser.Scene, x: number, y: number, isAlly: boolean) {
    // Usamos idle sheet como textura inicial (quieto)
    const initialTex = scene.textures.exists("dead_dragon_idle_sheet") ? "dead_dragon_idle_sheet" : "dead_dragon_sheet";
    super(scene, x, y, initialTex, 0);
    this.isAlly = isAlly;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Hitbox centrada: sprite 200x200, body 80x80 offset para estar centrado abajo
    body.setSize(80, 70);
    body.setOffset(60, 110);
    this.setOrigin(0.5, 0.5);
    this.setDepth(12);
    this.setScale(0.6); // 200*0.6=120 px aprox, tamaño creíble vs humano 48
    if (!isAlly) {
      // Enemigo tint rojizo leve
      this.setTint(0xff9999);
    }

    // Crear barra de vida (oculta inicialmente)
    this.healthBarBg = scene.add.rectangle(x, y - 75, 60, 6, 0x000000, 0.8);
    this.healthBarBg.setDepth(20);
    this.healthBarBg.setOrigin(0.5, 0.5);
    this.healthBarBg.setVisible(false);
    // borde
    this.healthBarBg.setStrokeStyle(1, 0x333333);

    this.healthBarFill = scene.add.rectangle(x, y - 75, 60, 6, 0x00ff88, 1);
    this.healthBarFill.setDepth(21);
    this.healthBarFill.setOrigin(0.5, 0.5);
    this.healthBarFill.setVisible(false);

    // Asegurar anims idle (quieto) y walk (movimiento) existen
    DeadDragonSprite.createAnimations(scene);
    this.playIdle();

    this.setInteractive({ useHandCursor: true });
  }

  static createAnimations(scene: Phaser.Scene) {
    const hasIdle = scene.anims.exists("dead_dragon_idle");
    const hasWalk = scene.anims.exists("dead_dragon_walk");
    if (hasIdle && hasWalk) return;

    // Idle — sheet idle.png (200x200 8f)
    if (!hasIdle) {
      const idleTex = scene.textures.exists("dead_dragon_idle_sheet")
        ? "dead_dragon_idle_sheet"
        : scene.textures.exists("dead_dragon_sheet")
          ? "dead_dragon_sheet"
          : null;
      if (!idleTex) {
        console.warn("[DeadDragon] Texture idle no encontrada, anim idle no creada");
      } else {
        scene.anims.create({
          key: "dead_dragon_idle",
          frames: scene.anims.generateFrameNumbers(idleTex, { start: 0, end: 7 }),
          frameRate: 8,
          repeat: -1,
        });
        console.log(`[DeadDragon] Anim idle creada desde ${idleTex}`);
      }
    }

    // Walk — sheet walk.png (200x200 8f) — se reproduce al moverse
    if (!hasWalk) {
      const walkTex = scene.textures.exists("dead_dragon_walk_sheet")
        ? "dead_dragon_walk_sheet"
        : scene.textures.exists("dead_dragon_sheet")
          ? "dead_dragon_sheet"
          : null;
      if (!walkTex) {
        console.warn("[DeadDragon] Texture walk no encontrada, anim walk no creada");
      } else {
        scene.anims.create({
          key: "dead_dragon_walk",
          frames: scene.anims.generateFrameNumbers(walkTex, { start: 0, end: 7 }),
          frameRate: 12,
          repeat: -1,
        });
        console.log(`[DeadDragon] Anim walk creada desde ${walkTex} (movimiento)`);
      }
    }
  }

  showHealthBar(durationMs = 5000) {
    this.hasTakenDamage = true;
    this.healthBarBg?.setVisible(true);
    this.healthBarFill?.setVisible(true);
    this.healthBarVisibleUntil = this.scene.time.now + durationMs;
  }

  updateHealthBar(salud: number, maxSalud: number) {
    if (!this.healthBarBg || !this.healthBarFill) return;
    if (!this.visible || !this.active) {
      this.healthBarBg.setVisible(false);
      this.healthBarFill.setVisible(false);
      return;
    }
    const pct = Phaser.Math.Clamp(salud / maxSalud, 0, 1);
    const fullW = 60;
    this.healthBarFill.width = fullW * pct;
    // Color según vida
    if (pct > 0.6) this.healthBarFill.setFillStyle(0x4caf50);
    else if (pct > 0.3) this.healthBarFill.setFillStyle(0xff9800);
    else this.healthBarFill.setFillStyle(0xe53935);

    // Si nunca recibió daño, mantener oculta hasta primer golpe
    if (!this.hasTakenDamage) {
      this.healthBarBg.setVisible(false);
      this.healthBarFill.setVisible(false);
      return;
    }
    // Si salud llena, ocultar tras delay
    if (salud >= maxSalud) {
      // mantener visible hasta que expire timer, luego ocultar
      if (this.scene.time.now > this.healthBarVisibleUntil) {
        this.healthBarBg.setVisible(false);
        this.healthBarFill.setVisible(false);
      } else {
        this.healthBarBg.setVisible(true);
        this.healthBarFill.setVisible(true);
      }
      return;
    }
    // Salud no llena: siempre visible
    this.healthBarBg.setVisible(true);
    this.healthBarFill.setVisible(true);
    // refrescar timer para que no desaparezca mientras tenga daño
    // no ocultar hasta curar
  }

  updateHealthBarPosition() {
    if (!this.healthBarBg || !this.healthBarFill) return;
    const offsetY = -75 * this.scaleY; // ajustar con escala
    this.healthBarBg.setPosition(this.x, this.y + offsetY);
    this.healthBarFill.setPosition(this.x, this.y + offsetY);
  }

  destroy(fromScene?: boolean): void {
    try {
      this.healthBarBg?.destroy();
      this.healthBarFill?.destroy();
    } catch {}
    super.destroy(fromScene);
  }

  setAlly(isAlly: boolean) {
    this.isAlly = isAlly;
    if (isAlly) this.clearTint();
    else this.setTint(0xff9999);
  }

  /** Helpers para anims idle/walk sin flicker */
  public playIdle() {
    const key = "dead_dragon_idle";
    if (this.anims.currentAnim?.key !== key && this.scene.anims.exists(key)) this.play(key, true);
  }

  public playWalk() {
    const key = "dead_dragon_walk";
    if (this.anims.currentAnim?.key !== key && this.scene.anims.exists(key)) this.play(key, true);
  }
}

// ---------------------------------------------------------------------------
// Entidad lógica DeadDragon
// ---------------------------------------------------------------------------
export class DeadDragon {
  public id: string;
  public nombre: string = "Dead Dragon";
  public isAlly: boolean;

  public stats: DeadDragonStats;
  public equipment: DeadDragonEquipment;
  public inventory: DeadDragonInventory;
  public orden: DeadDragonOrder = "Pasivo"; // legacy compat
  // — Nuevo sistema 3 categorías —
  public comportamiento: DeadDragonComportamiento = "Pacifico";
  public funcion: DeadDragonFuncion = "Espera aqui";
  public habilidadesActivas: Set<DeadDragonHabilidadCategoria> = new Set();
  public habilidadesSeleccionadas: Map<DeadDragonHabilidadCategoria, Set<string>> = new Map(
    HABILIDAD_CATEGORIAS.map(cat => [cat, new Set<string>()] as const)
  );
  private hogar: { x: number; y: number } | null = null;

  public sprite: DeadDragonSprite | null = null;

  // Posición hogar legacy para orden "Ve a casa" (compat)
  private homeX: number;
  private homeY: number;

  private static readonly NOMBRES_ALIADO = ["Drakon", "Umbra", "Cinder", "Obsidia", "Nocturne"];
  private static readonly NOMBRES_ENEMIGO = ["Mortus", "Necrosis", "Gorewing", "Blightmaw", "Dreadscale"];

  constructor(isAlly: boolean, x?: number, y?: number) {
    this.id = "dd_" + Math.random().toString(36).substring(2, 7);
    this.isAlly = isAlly;
    const pool = isAlly ? DeadDragon.NOMBRES_ALIADO : DeadDragon.NOMBRES_ENEMIGO;
    this.nombre = pool[Math.floor(Math.random() * pool.length)] + (isAlly ? " (Aliado)" : " (Enemigo)");

    this.stats = new DeadDragonStats();
    this.equipment = new DeadDragonEquipment();
    this.inventory = new DeadDragonInventory(this.equipment);

    this.homeX = x ?? 3072;
    this.homeY = y ?? 3072;
    this.hogar = null; // requiere designación explícita del jugador para "Ve a casa"

    // Inventario inicial vacío — el jugador lo llena. Dejamos 0 items para mostrar 5 slots vacíos.
  }

  getPaqueteUI() {
    // Serializa habilidades seleccionadas como objeto {categoria: string[]}
    const habilidadesSeleccionadasObj: Record<string, string[]> = {};
    for (const [cat, set] of this.habilidadesSeleccionadas.entries()) {
      habilidadesSeleccionadasObj[cat] = Array.from(set);
    }
    const hogarPos = this.hogar ?? { x: this.homeX, y: this.homeY };
    return {
      id: this.id,
      name: this.nombre,
      nombre: this.nombre,
      profession: this.isAlly ? "Dead Dragon (Aliado)" : "Dead Dragon (Enemigo)",
      professionLabel: "Dead Dragon",
      loyalty: this.isAlly ? 100 : 0,
      health: this.stats.salud,
      maxHealth: this.stats.maxSalud,
      salud: this.stats.salud,
      maxSalud: this.stats.maxSalud,
      energia: this.stats.energia,
      maxEnergia: this.stats.maxEnergia,
      isDeadDragon: true as const,
      isAlly: this.isAlly,
      orden: this.orden, // legacy
      ordenesDisponibles: DEAD_DRAGON_ORDERS,
      // — Nuevo sistema 3 categorías —
      comportamiento: this.comportamiento,
      funcion: this.funcion,
      comportamientosDisponibles: COMPORTAMIENTOS,
      funcionesDisponibles: FUNCIONES,
      habilidadesActivas: Array.from(this.habilidadesActivas),
      habilidadesActivasCategorias: Array.from(this.habilidadesActivas),
      habilidadCategorias: HABILIDAD_CATEGORIAS,
      habilidadesDetalle: HABILIDADES_DETALLE,
      habilidadLabels: HABILIDAD_LABELS,
      habilidadesSeleccionadas: habilidadesSeleccionadasObj,
      hogar: this.hogar,
      hasHogar: !!this.hogar,
      hogarPos,
      posHogar: hogarPos,
      inventario: this.inventory.getResumen(),
      inventoryItems: this.inventory.items,
      inventorySlots: {
        total: this.inventory.capacidadTotal,
        disponibles: this.inventory.slotsDisponibles,
        bloqueados: this.inventory.slotsBloqueados,
        ocupados: this.inventory.slotsOcupados,
      },
      equipamiento: this.equipment.getResumen(),
      equipment: {
        montura: this.equipment.montura,
        mochila: this.equipment.mochila,
        hasMochila: this.equipment.hasMochila,
      },
      posicion: this.sprite ? { x: this.sprite.x, y: this.sprite.y } : { x: hogarPos.x, y: hogarPos.y },
      positionX: this.sprite ? this.sprite.x : hogarPos.x,
      positionY: this.sprite ? this.sprite.y : hogarPos.y,
      x: this.sprite ? this.sprite.x : hogarPos.x,
      y: this.sprite ? this.sprite.y : hogarPos.y,
      // para compat con NpcPanel genérico
      edad: 999,
      traits: this.isAlly ? ["Leal", "Imponente"] : ["Hostil", "No-muerto"],
      personalidad: this.isAlly ? "Guardián" : "Depredador",
      temperamento: this.comportamiento,
      stats: { salud: this.stats.salud, maxSalud: this.stats.maxSalud, energia: this.stats.energia },
      needs: { hambre: 0, sed: 0, sueno: 0 },
    };
  }

  instanciarSprite(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = new DeadDragonSprite(scene, x, y, this.isAlly);
    this.homeX = x;
    this.homeY = y;

    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on("pointerdown", () => {
      // Solo aliados abren panel informativo pequeño, enemigos solo feedback
      console.log(`[DeadDragon] Click ${this.nombre} (${this.id}) aliado=${this.isAlly}`);
      const paquete = this.getPaqueteUI();
      window.dispatchEvent(new CustomEvent("phaser-dead-dragon-selected", { detail: paquete }));
      // También dispatch genérico para compat si se quiere
      // window.dispatchEvent(new CustomEvent('phaser-npc-selected', { detail: paquete }));
    });

    // Inicializa barra oculta
    this.sprite.updateHealthBar(this.stats.salud, this.stats.maxSalud);
    console.log(`[DeadDragon] Sprite instanciado ${this.nombre} (${this.id}) en ${x.toFixed(0)},${y.toFixed(0)} aliado=${this.isAlly}`);
  }

  desinstanciarSprite() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  recibirDano(cantidad: number) {
    this.stats.recibirDano(cantidad);
    if (this.sprite) {
      this.sprite.showHealthBar(5000);
      this.sprite.updateHealthBar(this.stats.salud, this.stats.maxSalud);
      // Tint rojo flash
      this.sprite.setTint(0xff4444);
      this.sprite.scene.time.delayedCall(200, () => {
        if (this.sprite) {
          if (this.isAlly) this.sprite.clearTint();
          else this.sprite.setTint(0xff9999);
        }
      });
    }
    // Dispatch evento para actualizar UI React
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
    if (this.stats.salud <= 0) {
      this.morir();
    }
  }

  curar(cantidad: number) {
    this.stats.curar(cantidad);
    if (this.sprite) this.sprite.updateHealthBar(this.stats.salud, this.stats.maxSalud);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  setOrden(orden: DeadDragonOrder) {
    if (!DEAD_DRAGON_ORDERS.includes(orden)) return;
    this.orden = orden;
    // Mapeo legacy a nuevo sistema 3 categorías
    if (orden === "Agresivo" || orden === "Defensivo") this.comportamiento = orden as DeadDragonComportamiento;
    else if (orden === "Pasivo") this.comportamiento = "Pacifico";
    else if (orden === "Espera aqui" || orden === "Ve a casa") this.funcion = orden as DeadDragonFuncion;
    else if (orden === "Rastrea") this.funcion = "Sigueme";
    console.log(`[DeadDragon] ${this.nombre} orden legacy cambiada a ${orden} -> comp=${this.comportamiento} func=${this.funcion}`);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  // — Nuevo sistema 3 categorías —
  setComportamiento(comp: DeadDragonComportamiento) {
    if (!COMPORTAMIENTOS.includes(comp)) return;
    this.comportamiento = comp;
    this.orden = comp === "Pacifico" ? "Pasivo" : (comp as DeadDragonOrder);
    console.log(`[DeadDragon] ${this.nombre} comportamiento -> ${comp}`);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  setFuncion(func: DeadDragonFuncion) {
    if (!FUNCIONES.includes(func)) return;
    if (func === "Ve a casa" && !this.hogar) {
      console.warn(`[DeadDragon] Ve a casa requiere hogar designado`);
      // igual permite, pero UI mostrará aviso
    }
    this.funcion = func;
    // sync legacy
    if (func === "Sigueme") this.orden = "Rastrea";
    else this.orden = func as DeadDragonOrder;
    console.log(`[DeadDragon] ${this.nombre} funcion -> ${func}`);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  toggleHabilidadCategoria(cat: DeadDragonHabilidadCategoria) {
    if (!HABILIDAD_CATEGORIAS.includes(cat)) return;
    if (this.habilidadesActivas.has(cat)) this.habilidadesActivas.delete(cat);
    else this.habilidadesActivas.add(cat);
    console.log(`[DeadDragon] ${this.nombre} habilidad cat toggle ${cat} -> ${Array.from(this.habilidadesActivas).join(",")}`);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  setHabilidadCategoria(cat: DeadDragonHabilidadCategoria, active: boolean) {
    if (active) this.habilidadesActivas.add(cat);
    else this.habilidadesActivas.delete(cat);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  toggleHabilidadSeleccionada(cat: DeadDragonHabilidadCategoria, habilidad: string) {
    const set = this.habilidadesSeleccionadas.get(cat);
    if (!set) return;
    if (!HABILIDADES_DETALLE[cat].includes(habilidad)) return;
    if (set.has(habilidad)) set.delete(habilidad);
    else set.add(habilidad);
    console.log(`[DeadDragon] ${this.nombre} habilidad ${habilidad} (${cat}) -> ${Array.from(set).join(",")}`);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  setHogar(x: number, y: number) {
    this.hogar = { x, y };
    this.homeX = x;
    this.homeY = y;
    console.log(`[DeadDragon] ${this.nombre} hogar establecido en ${x.toFixed(0)},${y.toFixed(0)}`);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-hogar-set" as any, { detail: { id: this.id, x, y } }));
  }

  hasHogar(): boolean {
    return !!this.hogar;
  }

  getHogar(): { x: number; y: number } | null {
    return this.hogar;
  }

  equipMontura(item: DeadDragonInventoryItem | null) {
    this.equipment.equipMontura(item);
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  equipMochila(item: DeadDragonInventoryItem | null) {
    this.equipment.equipMochila(item);
    // Al equipar mochila, desbloquea slots — notificar UI
    window.dispatchEvent(new CustomEvent("phaser-dead-dragon-updated", { detail: this.getPaqueteUI() }));
  }

  private morir() {
    console.log(`[DeadDragon] ${this.nombre} ha muerto`);
    if (this.sprite) {
      this.sprite.setTint(0x555555);
      this.sprite.setAlpha(0.6);
      // Play death? no anim específica
    }
  }

  updateEntity() {
    if (!this.sprite || !this.sprite.body) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Actualizar barra vida posición
    this.sprite.updateHealthBarPosition();
    this.sprite.updateHealthBar(this.stats.salud, this.stats.maxSalud);

    // — Comportamiento: lógica de combate (Agresivo/Defensivo/Pacifico) —
    // Pacifico no ataca nunca; Defensivo solo si el jugador es atacado; Agresivo busca enemigos en 10 chunks del jugador
    // Nota: 10 chunks = 10 * 1024 = 10240 px (cuadrados pequeños). Se usa para detección.
    if (this.comportamiento === "Agresivo") {
      const playerPos = (window as any).__PLAYER_POS__ as { x: number; y: number } | undefined;
      if (playerPos) {
        const enemyList = ((window as any).__DEAD_DRAGONS_POS__ as any[] | undefined)?.filter(e => !e.isAlly) ?? [];
        // También considera NPCs enemigos si existieran — stub
        const radius = 10 * CHUNK_PX;
        const enemiesInRadius = enemyList.filter(e => Math.hypot(e.x - playerPos.x, e.y - playerPos.y) < radius);
        if (enemiesInRadius.length > 0) {
          // Placeholder: si hay enemigos en radio y función no es "Espera aqui" con prioridad, podría interceptar
          // Por ahora solo log para debug; movimiento sigue controlado por Función
          // Si la función es "Espera aqui" pero hay enemigos, Agresivo podría romper espera para atacar (opcional)
          // Aquí mantenemos comportamiento separado de movimiento: no forzamos movimiento, solo marca intención
          // Para demostrar, si hay enemigos y está en Espera, no se mueve (respeta Función). Combate real se delega a futuro CombatSystem.
        }
      }
    } else if (this.comportamiento === "Defensivo") {
      // Solo ataca si el jugador ha sido atacado — flag global __PLAYER_ATTACKED__ manejado por futuro Damage system
      // Stub: consulta window.__PLAYER_WAS_ATTACKED__ (boolean + timestamp)
      const wasAttacked = (window as any).__PLAYER_WAS_ATTACKED__ as { attacked: boolean; time: number } | undefined;
      if (wasAttacked?.attacked && Date.now() - wasAttacked.time < 5000) {
        // Ventana de 5s para contraatacar
      }
    }
    // Pacifico: no hace nada

    // — Función: control de movimiento (Espera/Sigueme/Ve a casa) —
    switch (this.funcion) {
      case "Espera aqui":
        body.setVelocity(0);
        this.sprite.playIdle();
        break;
      case "Sigueme": {
        const playerPos = (window as any).__PLAYER_POS__ as { x: number; y: number } | undefined;
        if (playerPos) {
          const distToPlayer = Math.hypot(this.sprite.x - playerPos.x, this.sprite.y - playerPos.y);
          if (distToPlayer < 40) {
            body.setVelocity(0);
            this.sprite.playIdle();
          } else {
            this.moverHacia(playerPos.x, playerPos.y, 110);
          }
        } else {
          body.setVelocity(0);
          this.sprite.playIdle();
        }
        break;
      }
      case "Ve a casa": {
        const hogar = this.hogar ?? { x: this.homeX, y: this.homeY };
        if (!this.hogar) {
          // Sin hogar designado: se queda y avisa (UI muestra advertencia)
          body.setVelocity(0);
          this.sprite.playIdle();
        } else {
          this.moverHacia(hogar.x, hogar.y, 80);
        }
        break;
      }
      default:
        body.setVelocity(0);
        this.sprite.playIdle();
        break;
    }

    // — Habilidades activas (multi-opción) afectan consumo de energía en combate —
    // Si tiene "Ataques Fisicos" activo, usará Zarpaso/Mordida/Coletazo seleccionados, etc.
    // Por ahora solo se almacena y muestra en UI; el CombatSystem futuro filtrará por habilidadesActivas + habilidadesSeleccionadas.
  }

  private moverHacia(targetX: number, targetY: number, speed: number) {
    if (!this.sprite) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      body.setVelocity(0);
      this.sprite.playIdle();
      return;
    }
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    body.setVelocity(vx, vy);
    this.sprite.playWalk();
    this.sprite.setFlipX(vx < 0);
  }
}
