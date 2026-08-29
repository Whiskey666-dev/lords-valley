import { useEffect, useRef, useState } from 'react';
import { startLaunchGame } from '../game/main';
import { getBinding, isRebindingActive, isConsoleOpenActive } from '../ui/input/KeyBindings';
import { TutorialPanel } from '../ui/menus/TutorialPanel';
import { Navbar } from '../ui/menus/Navbar';
import { Console } from '../ui/menus/Console';
import { NpcPanel, type NpcPanelData } from '../ui/character/NpcPanel';

function App() {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [selectedNPC, setSelectedNPC] = useState<NpcPanelData | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [zoom, setZoom] = useState(50); // 0% alejar - 50% defecto - 100% acercar

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = startLaunchGame();
            // Centrado pixel-perfect del canvas dentro de game-container (evita desfase flex)
            setTimeout(() => {
                const container = document.getElementById("game-container");
                const canvas = container?.querySelector("canvas") as HTMLCanvasElement | null;
                if (container && canvas) {
                    // Fuerza centrado absoluto para evitar desplazamiento por flex
                    container.style.position = "relative";
                    canvas.style.position = "absolute";
                    canvas.style.left = "50%";
                    canvas.style.top = "50%";
                    canvas.style.transform = "translate(-50%, -50%)";
                    canvas.style.margin = "0";
                    // Log para verificar centrado
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
    }, []);

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#111111', color: '#ffffff', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
            {/* Navbar delgada modular en ui/menus/Navbar.tsx */}
            <Navbar onToggleTutorial={() => setShowTutorial(v => !v)} zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

            {/* Panel tutorial modularizado en ui/menus/TutorialPanel.tsx */}
            <TutorialPanel show={showTutorial} onClose={() => setShowTutorial(false)} />

            {/* Consola de comandos - ENTER para abrir, createNpc1..10 */}
            <Console />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div id="game-container" style={{ flex: 1, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }} />

            {selectedNPC && <NpcPanel npc={selectedNPC} onClose={() => setSelectedNPC(null)} />}
            </div>
        </div>
    );
}

export default App;
