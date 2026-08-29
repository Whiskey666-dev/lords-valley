import { useEffect, useRef, useState } from 'react';
import { startLaunchGame } from '../game/main';
import { getBinding, isRebindingActive, isConsoleOpenActive } from '../ui/input/KeyBindings';
import { TutorialPanel } from '../ui/menus/TutorialPanel';
import { Navbar } from '../ui/menus/Navbar';
import { Console } from '../ui/menus/Console';
import { NpcPanel, type NpcPanelData } from '../ui/character/NpcPanel';
import { useGameStore } from './store/useGameStore';
import { HUD } from '../ui/hud/HUD';
import { MiniMap } from '../ui/hud/MiniMap';
import { AuthScreen } from './auth/AuthScreen';
import { fetchSettlementsByOwner } from './api/settlement.api';
import { savePlayerPos } from './api/player.api';

function App() {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [selectedNPC, setSelectedNPC] = useState<NpcPanelData | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [zoom, setZoom] = useState(50);
    const survivors = useGameStore((s) => s.survivors);
    const selectedId = useGameStore((s) => s.selectedId);
    const fetchSettlement = useGameStore((s) => s.fetchSettlement);
    const [isAuthed, setIsAuthed] = useState<boolean>(() => !!localStorage.getItem('access_token'));

    // Cross-tab sync: si otra pestaña crea usuario/login, detectar via storage
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === 'player' || e.key === 'settlementId') {
                setIsAuthed(!!localStorage.getItem('access_token'));
            }
        };
        const onAuthChanged = () => setIsAuthed(!!localStorage.getItem('access_token'));
        window.addEventListener('storage', onStorage);
        window.addEventListener('auth-changed', onAuthChanged as any);
        return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('auth-changed', onAuthChanged as any); };
    }, []);

    // Hydrate settlement solo si autenticado
    useEffect(() => {
        if (!isAuthed) return;
        const load = async () => {
            let sid = localStorage.getItem('settlementId');
            if (!sid) {
                const playerRaw = localStorage.getItem('player');
                const playerId = localStorage.getItem('playerId') || (playerRaw ? JSON.parse(playerRaw).id : null);
                if (playerId) {
                    try {
                        const list = await fetchSettlementsByOwner(playerId);
                        if (list.length > 0) {
                            sid = list[0].id;
                            localStorage.setItem('settlementId', sid);
                        }
                    } catch {}
                }
                if (!sid) sid = import.meta.env.VITE_SETTLEMENT_ID || null;
            }
            if (sid) fetchSettlement(sid).catch(() => console.warn('[App] fetchSettlement failed', sid));
        };
        load();
    }, [isAuthed, fetchSettlement]);

    // Sync Zustand selectedId -> NpcPanel (reactive mirror, replaces window.CustomEvent)
    useEffect(() => {
        if (!selectedId) { setSelectedNPC(null); return; }
        const sv = survivors.find((s: any) => s.id === selectedId);
        if (sv) {
            setSelectedNPC({
                id: sv.id,
                name: sv.firstName + ' ' + sv.lastName,
                profession: sv.professions?.[0]?.type ?? sv.profesion ?? '—',
                loyalty: sv.loyalty,
                health: sv.needs?.health ?? sv.stats?.salud ?? 100,
                edad: sv.age ?? sv.edad,
                // spread for NpcPanel compatibility
                ...(sv as any),
            } as any);
        }
    }, [selectedId, survivors]);

    useEffect(() => {
        if (!isAuthed) return;
        if (!gameRef.current) {
            gameRef.current = startLaunchGame();
            // Centrado pixel-perfect del canvas dentro de game-container (evita desfase flex) — incoming refactor
            setTimeout(() => {
                const container = document.getElementById("game-container");
                const canvas = container?.querySelector("canvas") as HTMLCanvasElement | null;
                if (container && canvas) {
                    container.style.position = "relative";
                    canvas.style.position = "absolute";
                    canvas.style.left = "50%";
                    canvas.style.top = "50%";
                    canvas.style.transform = "translate(-50%, -50%)";
                    canvas.style.margin = "0";
                    const nav = document.querySelector("nav") as HTMLElement | null;
                    setTimeout(() => {
                        const cRect = canvas.getBoundingClientRect();
                        const contRect = container.getBoundingClientRect();
                        const navRect = nav?.getBoundingClientRect();
                        console.log(`[Layout] canvas ${cRect.left.toFixed(0)},${cRect.top.toFixed(0)} ${cRect.width}x${cRect.height} center ${(cRect.left + cRect.width/2).toFixed(0)},${(cRect.top + cRect.height/2).toFixed(0)}`);
                        console.log(`[Layout] container ${contRect.left.toFixed(0)},${contRect.top.toFixed(0)} ${contRect.width}x${contRect.height} center ${(contRect.left + contRect.width/2).toFixed(0)},${(contRect.top + contRect.height/2).toFixed(0)}`);
                        if (navRect) console.log(`[Layout] navbar center ${(navRect.left + navRect.width/2).toFixed(0)} canvas center ${(cRect.left + cRect.width/2).toFixed(0)} delta ${((cRect.left + cRect.width/2) - (navRect.left + navRect.width/2)).toFixed(0)}`);
                    }, 100);
                }
            }, 200);
        }

        const handleNPCSelect = (event: Event) => {
            const customEvent = event as CustomEvent<NpcPanelData>;
            console.log("[App] phaser-npc-selected recibido", customEvent.detail);
            setSelectedNPC(customEvent.detail);
        };
        const handleNPCClose = () => setSelectedNPC(null);
        const handleToggleTutorial = () => setShowTutorial(prev => !prev);
        const handleZoomSync = (e: Event) => {
            const z = (e as CustomEvent<number>).detail;
            if (typeof z === "number") setZoom(Math.min(100, Math.max(0, Math.round(z))));
        };
        // Evita zoom externo de la página con Ctrl+rueda (usa zoom interno)
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) e.preventDefault();
        };

        window.addEventListener('phaser-npc-selected', handleNPCSelect);
        window.addEventListener('phaser-npc-deselected', handleNPCClose);
        window.addEventListener('phaser-toggle-tutorial', handleToggleTutorial);
        window.addEventListener('phaser-zoom-sync', handleZoomSync as EventListener);
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('phaser-npc-selected', handleNPCSelect);
            window.removeEventListener('phaser-npc-deselected', handleNPCClose);
            window.removeEventListener('phaser-toggle-tutorial', handleToggleTutorial);
            window.removeEventListener('phaser-zoom-sync', handleZoomSync as EventListener);
            window.removeEventListener('wheel', handleWheel);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [isAuthed]);

    // TAB global - respeta rebinding y consola/chat y usa binding actual desde UI (no desde Player)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (isRebindingActive() || isConsoleOpenActive()) return;
            const tabKey = getBinding("tutorial");
            if (e.key.toUpperCase() === tabKey || (tabKey === "TAB" && e.key === "Tab")) {
                e.preventDefault();
                setShowTutorial(prev => !prev);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleZoomIn = () => {
        setZoom(z => {
            const nz = Math.min(100, z + 10);
            window.dispatchEvent(new CustomEvent("phaser-zoom-set", { detail: nz }));
            return nz;
        });
    };
    const handleZoomOut = () => {
        setZoom(z => {
            const nz = Math.max(0, z - 10);
            window.dispatchEvent(new CustomEvent("phaser-zoom-set", { detail: nz }));
            return nz;
        });
    };

    const handleLogout = async () => {
        try {
            const playerId = localStorage.getItem('playerId');
            const pos = (window as any).__PLAYER_POS__;
            if (playerId && pos && typeof pos.x === 'number') {
                await savePlayerPos(playerId, { x: Math.round(pos.x), y: Math.round(pos.y) }).catch(()=>{});
            }
        } catch {}
        localStorage.removeItem('access_token');
        localStorage.removeItem('player');
        localStorage.removeItem('playerId');
        localStorage.removeItem('settlementId');
        setIsAuthed(false);
        setSelectedNPC(null);
        if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
        window.dispatchEvent(new CustomEvent('auth-changed'));
    };

    if (!isAuthed) {
        return <AuthScreen onAuthenticated={() => setIsAuthed(true)} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#111111', color: '#ffffff', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
            <Navbar onToggleTutorial={() => setShowTutorial(v => !v)} zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
            <button onClick={handleLogout} title="Cerrar sesión (localStorage)" style={{ position: 'absolute', top: 6, right: 8, zIndex: 30, background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Salir</button>
            <HUD />
            <MiniMap />
            <TutorialPanel show={showTutorial} onClose={() => setShowTutorial(false)} />
            <Console />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div id="game-container" style={{ flex: 1, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }} />
                {selectedNPC && (
                  <div style={{ width: 320, overflowY: 'auto', background: '#0a0a0a', borderLeft: '1px solid #222' }}>
                    <NpcPanel npc={selectedNPC} onClose={() => { setSelectedNPC(null); useGameStore.getState().clearSelection(); }} />
                  </div>
                )}
            </div>
        </div>
    );
}

export default App;
