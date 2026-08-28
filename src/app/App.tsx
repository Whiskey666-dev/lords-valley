import { useEffect, useRef, useState } from 'react';
import { startLaunchGame } from '../game/main';
import { getBinding, displayKey, isRebindingActive, isConsoleOpenActive } from '../ui/input/KeyBindings';
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

    const tutorialKey = displayKey(getBinding("tutorial"));

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

            {/* Hint - debajo de navbar delgada */}
            <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 20, backgroundColor: '#00000088', padding: '2px 8px', borderRadius: 6, fontSize: 10, pointerEvents: 'none' }}>
                <b>Click Izq</b> interactúa • <b>{tutorialKey}</b> tutorial • <b>{displayKey(getBinding("close"))}</b> cierra
            </div>

            {/* Panel tutorial modularizado en ui/menus/TutorialPanel.tsx */}
            <TutorialPanel show={showTutorial} onClose={() => setShowTutorial(false)} />

            {/* Consola de comandos - ENTER para abrir, createNpc1..10 */}
            <Console />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div id="game-container" style={{ flex: 1, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />

            {selectedNPC && <NpcPanel npc={selectedNPC} onClose={() => setSelectedNPC(null)} />}
            </div>
        </div>
    );
}

export default App;
