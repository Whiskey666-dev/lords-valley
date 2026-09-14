import Phaser from 'phaser';
import { Stats } from './Stats';
import { Needs } from './Needs';
import { Loyalty } from './Loyalty';
import { BaseHuman } from './BaseHuman';
import type { Direction8 } from './Animations';
import { CombatSystem } from '../combat/CombatSystem';
import { Traits } from './Traits';
import { Personality } from './Personality';
import { Skills } from './Skills';
import { Gustos } from './Gustos';
import { Inventory } from '../items/Inventory';
import { Equipment } from '../items/Equipment';
import { reportCombatHit } from '../app/socket';

/** Rango cuerpo a cuerpo con el que un superviviente se defiende (sin perseguir) */
const SURVIVOR_DEFENSE_RANGE = 70;
/** Cooldown local entre golpes (el servidor aplica el suyo: 1500ms) */
const SURVIVOR_DEFENSE_COOLDOWN = 1500;

/** Objetivo de combate (forma estructural: evita imports circulares con Ghost/DeadDragon) */
export interface CombatTargetLike {
    id: string;
    estaVivo: boolean;
    /** Solo en dragones: los aliados nunca son objetivo */
    isAlly?: boolean;
    sprite: { x: number; y: number; active: boolean } | null;
}

/**
 * Sprite concreto para humanos NPC, reutiliza el sistema de animaciones de BaseHuman/Animations.
 * Escalable: para nuevos tipos humanos crea otra subclase con distinto animPrefix/texturePrefix.
 * Ej: class VillagerSprite extends BaseHuman { constructor(s,x,y){ super(s,x,y,"player_idle_down","villager_","villager_") } }
 */
class SurvivorSprite extends BaseHuman {
    public healthBarBg: Phaser.GameObjects.Rectangle | null = null;
    public healthBarHp: Phaser.GameObjects.Rectangle | null = null;
    public healthBarEn: Phaser.GameObjects.Rectangle | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Modular: animPrefix "npc_" genera "npc_walk_*" etc., textura "npc_*" con fallback a "player_*"
        super(scene, x, y, 'player_idle_down', 'npc_', 'npc_');
        this.play('npc_idle_down', true);
        this.createBars(scene, x, y);
    }

    private createBars(scene: Phaser.Scene, x: number, y: number) {
        const barY = y - 56;
        this.healthBarBg = scene.add.rectangle(x, barY, 42, 13, 0x000000, 0.75);
        this.healthBarBg.setDepth(9000);
        this.healthBarBg.setOrigin(0.5, 0.5);
        this.healthBarHp = scene.add.rectangle(x - 20, barY - 3, 40, 4, 0xff2222, 1);
        this.healthBarHp.setDepth(9001);
        this.healthBarHp.setOrigin(0, 0.5);
        this.healthBarEn = scene.add.rectangle(x - 20, barY + 3, 40, 4, 0x44aaff, 1);
        this.healthBarEn.setDepth(9001);
        this.healthBarEn.setOrigin(0, 0.5);
    }

    /** Barras en porcentaje sobre los máximos (0..1). */
    public syncBars(salud: number, maxSalud: number, energia: number, maxEnergia: number) {
        if (!this.healthBarBg || !this.healthBarHp || !this.healthBarEn) return;
        const barY = this.y - 56;
        this.healthBarBg.setPosition(this.x, barY);
        this.healthBarHp.setPosition(this.x - 20, barY - 3);
        this.healthBarEn.setPosition(this.x - 20, barY + 3);
        const hpPct = Math.max(0, Math.min(1, salud / Math.max(1, maxSalud)));
        const enPct = Math.max(0, Math.min(1, energia / Math.max(1, maxEnergia)));
        this.healthBarHp.setSize(Math.round(40 * hpPct), 4);
        this.healthBarEn.setSize(Math.round(40 * enPct), 4);
    }

    public destroyBars() {
        this.healthBarBg?.destroy();
        this.healthBarHp?.destroy();
        this.healthBarEn?.destroy();
        this.healthBarBg = null;
        this.healthBarHp = null;
        this.healthBarEn = null;
    }
}

export class Survivor {
    // Datos ligeros de simulación (persistentes, no dependen de Phaser) - cada instancia es única y aleatoria
    public id: string;
    public nombre: string;
    public edad: number;
    public profesion: string;
    
    public stats: Stats;
    public needs: Needs;
    public loyalty: Loyalty;
    public traits: Traits;
    public personality: Personality;
    public skills: Skills;
    public gustos: Gustos;
    public inventory: Inventory;
    public equipment: Equipment;

    // Vinculación gráfica opcional - sprite modular reutilizable (independiente del Player)
    public sprite: SurvivorSprite | null = null;
    private isJumping = false;
    private isDashing = false;
    private isDead = false;
    private lastDefenseAt = 0;

    private static readonly NOMBRES = ["Aldous", "Goffrey", "Eldric", "Wulfric", "Rowena", "Gisela", "Brom", "Yara", "Cedric", "Mira", "Hob", "Edda", "Joren", "Lysa", "Tormund", "Svala"];
    private static readonly PROFESIONES = ["Leñador", "Minero", "Granjero", "Cazador", "Carpintero", "Herrero", "Médico", "Explorador", "Guardia", "Cocinero"];

    /**
     * Crea un Survivor desde datos autoritativos del servidor.
     * Usar este método en lugar del constructor vacío para evitar datos aleatorios en el cliente.
     * @param serverData - Datos del survivor retornados por POST /settlements/:id/survivors/spawn
     */
    public static fromServerData(serverData: {
        id: string;
        firstName: string;
        lastName: string;
        age: number;
        professions?: Array<{ type: string }>;
        needs?: { hunger?: number; thirst?: number; fatigue?: number; health?: number; sanity?: number };
        attributes?: { strength?: number; agility?: number; endurance?: number; intelligence?: number };
        loyalty?: number;
        positionX?: number;
        positionY?: number;
        inventory?: any[];
    }): Survivor {
        const surv = new Survivor();
        surv.id = serverData.id;
        surv.nombre = `${serverData.firstName} ${serverData.lastName}`;
        surv.edad = serverData.age;
        surv.profesion = serverData.professions?.[0]?.type
            ? Survivor.mapBackendProfession(serverData.professions[0].type)
            : surv.profesion;
        // Stats canónicas del servidor (CombatService.COMBAT_STATS.survivor):
        // 200 salud / 50 energía. El servidor es la autoridad del HP.
        surv.stats.maxSalud = 200;
        surv.stats.salud = 200;
        surv.stats.maxEnergia = 50;
        surv.stats.energia = 50;
        if (serverData.needs) {
            surv.needs.hambre = serverData.needs.hunger ?? 0;
            surv.needs.sed = serverData.needs.thirst ?? 0;
            surv.needs.sueno = serverData.needs.fatigue ?? 0;
        }
        if (typeof serverData.loyalty === 'number') {
            surv.loyalty.nivel = serverData.loyalty;
        }
        return surv;
    }

    /** Mapea tipos de profesión del backend al nombre legible en español del frontend */
    private static mapBackendProfession(type: string): string {
        const map: Record<string, string> = {
            LENADOR: 'Leñador', MINERO: 'Minero', AGRICULTOR: 'Granjero',
            HERRERO: 'Herrero', SOLDADO: 'Guardia', MEDICO: 'Médico',
            CARPINTERO: 'Carpintero', COMERCIANTE: 'Explorador',
            CAZADOR: 'Cazador', COCINERO: 'Cocinero',
        };
        return map[type] ?? type;
    }

    /**
     * @deprecated Solo para desarrollo local / restauración de partida guardada.
     * En producción, usar Survivor.fromServerData() para garantizar que los datos vienen del servidor.
     */
    constructor() {
        this.id = "surv_" + Math.random().toString(36).substring(2, 7);
        this.nombre = Survivor.NOMBRES[Math.floor(Math.random() * Survivor.NOMBRES.length)];
        this.edad = Math.floor(Math.random() * 33) + 18;
        this.profesion = Survivor.PROFESIONES[Math.floor(Math.random() * Survivor.PROFESIONES.length)];

        // Cada NPC con habilidades, personalidad, rasgos, gustos, inventario, equipamiento y stats aleatorios (independiente)
        this.stats = new Stats();
        this.needs = new Needs();
        this.loyalty = new Loyalty();
        this.traits = new Traits();
        this.personality = new Personality();
        this.skills = new Skills();
        this.gustos = new Gustos();
        this.inventory = new Inventory();
        this.equipment = new Equipment();
    }

    public getPaqueteUI() {
        return {
            id: this.id,
            name: this.nombre,
            profession: this.profesion,
            loyalty: this.loyalty.nivel,
            health: this.stats.salud,
            edad: this.edad,
            traits: this.traits.lista,
            personalidad: this.personality.resumen,
            temperamento: this.personality.temperamento,
            habilidad: this.skills.resumen,
            gustos: this.gustos.resumen,
            inventario: this.inventory.getResumen(),
            equipamiento: this.equipment.getResumen(),
            habilidades: Object.entries(this.skills.niveles).map(([k, v]) => `${k}: Lv${v}`),
            stats: { salud: this.stats.salud, maxSalud: this.stats.maxSalud, energia: this.stats.energia, maxEnergia: this.stats.maxEnergia },
            needs: { hambre: this.needs.hambre, sed: this.needs.sed, sueno: this.needs.sueno },
            nombre: this.nombre,
            profesion: this.profesion,
            lealtadNivel: this.loyalty.nivel,
            salud: this.stats.salud,
            positionX: this.sprite ? this.sprite.x : 0,
            positionY: this.sprite ? this.sprite.y : 0,
        };
    }

    instanciarSprite(scene: Phaser.Scene, x: number, y: number) {
        this.sprite = new SurvivorSprite(scene, x, y);
        // Sin colisión entre personajes/NPCs: permiten atravesarse, pero sí colisionan con minerales/agua.
        // No immovable para que el sistema de física de terreno (MineralPhysics/WaterPhysics) pueda separar correctamente.
        this.sprite.setImmovable(false);

        this.sprite.setInteractive({ useHandCursor: true });
        this.sprite.setDepth(10);
        console.log(`[Survivor] Sprite instanciado ${this.nombre} (${this.id}) en ${x.toFixed(0)},${y.toFixed(0)} interactivo input=${!!this.sprite.input}`);
        this.sprite.on('pointerdown', () => {
            console.log(`[Survivor] Click detectado en ${this.nombre} (${this.id}) - dispatch panel`);
            const paqueteUI = this.getPaqueteUI();
            console.log(`[Survivor] Dispatch phaser-npc-selected`, paqueteUI);
            window.dispatchEvent(new CustomEvent('phaser-npc-selected', { detail: paqueteUI }));
        });
    }

    desinstanciarSprite() {
        if (this.sprite) {
            this.sprite.destroyBars();
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    get estaVivo(): boolean {
        return !this.isDead && this.stats.salud > 0;
    }

    /**
     * Aplica daño confirmado por el servidor (hp autoritativo).
     * El cliente nunca calcula HP: lo sincroniza y muestra muerte si llega a 0.
     */
    public applyServerDamage(hp: number, maxHp: number) {
        if (this.isDead) return;
        this.stats.maxSalud = Math.max(1, maxHp);
        this.stats.salud = Math.max(0, Math.min(this.stats.maxSalud, hp));
        if (this.sprite?.active) {
            this.sprite.setTint(0xff6666);
            this.sprite.scene.time.delayedCall(150, () => {
                if (this.sprite?.active && !this.isDead) this.sprite.clearTint();
            });
        }
        if (this.stats.salud <= 0) this.morir();
    }

    /** Muerte real: animación de muerte del sprite compartido + desaparición. */
    public morir() {
        if (this.isDead) return;
        this.isDead = true;
        console.log(`[Survivor] ${this.nombre} (${this.id}) ha muerto`);
        if (this.sprite) {
            const s = this.sprite;
            s.disableInteractive();
            const body = s.body as Phaser.Physics.Arcade.Body | undefined;
            body?.setVelocity(0);
            // Animación de muerte (sprites compartidos humano: npc_death_*)
            s.die();
            s.destroyBars();
            s.scene.time.delayedCall(900, () => {
                this.desinstanciarSprite();
            });
        }
        window.dispatchEvent(new CustomEvent('phaser-npc-died' as any, { detail: { id: this.id } }));
    }

    updateEntity(ghosts?: CombatTargetLike[], deadDragons?: CombatTargetLike[]) {
        if (!this.sprite || this.isDead) return;
        if (this.sprite.body) {
            // Barras en porcentaje sobre los máximos
            this.sprite.syncBars(this.stats.salud, this.stats.maxSalud, this.stats.energia, this.stats.maxEnergia);
            // Defensa: golpea al enemigo cercano (daño base 10 validado por el servidor)
            this.tryDefend(ghosts, deadDragons);
            // Si está en acción (salto/dash/ataque) no forzar idle
            if (this.isJumping || this.isDashing || (this.sprite && CombatSystem.isAttacking(this.sprite))) return;
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0);
            this.sprite.idle();
        }
    }

    /** Los seguidores se defienden si un enemigo entra en rango (no persiguen). */
    private tryDefend(ghosts?: CombatTargetLike[], deadDragons?: CombatTargetLike[]) {
        if (!this.sprite || this.isJumping || this.isDashing || CombatSystem.isAttacking(this.sprite)) return;
        type Cand = { id: string; kind: 'ghost' | 'dead-dragon'; x: number; y: number; d: number };
        const sx = this.sprite.x, sy = this.sprite.y;
        let best: Cand | null = null;
        const pools: { arr: CombatTargetLike[] | undefined; kind: Cand['kind']; skipAllies: boolean }[] = [
            { arr: ghosts, kind: 'ghost', skipAllies: false },
            { arr: deadDragons, kind: 'dead-dragon', skipAllies: true },
        ];
        for (const pool of pools) {
            for (const e of pool.arr ?? []) {
                if (!e.estaVivo || !e.sprite || !e.sprite.active) continue;
                if (pool.skipAllies && e.isAlly) continue;
                const d = Math.hypot(e.sprite.x - sx, e.sprite.y - sy);
                if (d <= SURVIVOR_DEFENSE_RANGE && (!best || d < best.d)) {
                    best = { id: e.id, kind: pool.kind, x: e.sprite.x, y: e.sprite.y, d };
                }
            }
        }
        if (!best) return;
        const now = this.sprite.scene.time.now;
        if (now - this.lastDefenseAt < SURVIVOR_DEFENSE_COOLDOWN) return;
        this.lastDefenseAt = now;
        this.atacar();
        reportCombatHit({
            attackerId: this.id,
            attackerKind: 'survivor',
            targetId: best.id,
            targetKind: best.kind,
            attackerX: sx,
            attackerY: sy,
            targetX: best.x,
            targetY: best.y,
        });
    }

    /** API escalable para IA/movimiento: mueve y anima walk en cualquier dirección 8 */
    public moverEnDireccion(dir: Direction8) {
        if (!this.sprite || this.isDashing || CombatSystem.isAttacking(this.sprite)) return;
        // Salto permite desplazarse, mantiene jump anim sin pisar con walk
        if (this.isJumping) {
            // Actualiza dirección pero no cambia anim (sigue jump)
            this.sprite.setDirection(dir);
            return;
        }
        this.sprite.moveInDirection(dir);
    }

    public saltar() {
        if (!this.sprite || this.isJumping || this.isDashing || CombatSystem.isAttacking(this.sprite)) return;
        this.isJumping = true;
        const s = this.sprite;
        s.jump();
        s.scene.tweens.add({
            targets: s,
            scaleX: 1.12, scaleY: 1.12, y: s.y - 10, duration: 180, yoyo: true, ease: 'Quad.easeOut',
            onComplete: () => s.setScale(1)
        });
        s.scene.time.delayedCall(550, () => { this.isJumping = false; });
    }

    public dash() {
        if (!this.sprite || this.isDashing || this.isJumping || CombatSystem.isAttacking(this.sprite)) return;
        this.isDashing = true;
        const s = this.sprite;
        const dir = s.getLastDirection();
        s.dash();
        const body = s.body as Phaser.Physics.Arcade.Body;
        let vx = 0, vy = 0;
        if (dir.includes("up")) vy = -1;
        if (dir.includes("down")) vy = 1;
        if (dir.includes("left")) vx = -1;
        if (dir.includes("right")) vx = 1;
        body.setVelocity(vx * 500, vy * 500);
        // +50% distancia vs ajuste anterior: 225ms (antes 150ms)
        s.scene.time.delayedCall(225, () => { this.isDashing = false; body.setVelocity(0); });
    }

    public atacar() {
        if (!this.sprite || this.isJumping || this.isDashing) return;
        const dir = this.sprite.getLastDirection();
        CombatSystem.executeAttack(this.sprite, dir, "npc_");
    }
}
