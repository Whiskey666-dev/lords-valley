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

/**
 * Sprite concreto para humanos NPC, reutiliza el sistema de animaciones de BaseHuman/Animations.
 * Escalable: para nuevos tipos humanos crea otra subclase con distinto animPrefix/texturePrefix.
 * Ej: class VillagerSprite extends BaseHuman { constructor(s,x,y){ super(s,x,y,"player_idle_down","villager_","villager_") } }
 */
class SurvivorSprite extends BaseHuman {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Modular: animPrefix "npc_" genera "npc_walk_*" etc., textura "npc_*" con fallback a "player_*"
        super(scene, x, y, 'player_idle_down', 'npc_', 'npc_');
        this.play('npc_idle_down', true);
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

    private static readonly NOMBRES = ["Aldous", "Goffrey", "Eldric", "Wulfric", "Rowena", "Gisela", "Brom", "Yara", "Cedric", "Mira", "Hob", "Edda", "Joren", "Lysa", "Tormund", "Svala"];
    private static readonly PROFESIONES = ["Leñador", "Minero", "Granjero", "Cazador", "Carpintero", "Herrero", "Médico", "Explorador", "Guardia", "Cocinero"];

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
            stats: { salud: this.stats.salud, maxSalud: this.stats.maxSalud, energia: this.stats.energia },
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
        this.sprite.setImmovable(true);

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
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    updateEntity() {
        if (this.sprite && this.sprite.body) {
            // Si está en acción (salto/dash/ataque) no forzar idle
            if (this.isJumping || this.isDashing || (this.sprite && CombatSystem.isAttacking(this.sprite))) return;
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0);
            this.sprite.idle();
        }
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
