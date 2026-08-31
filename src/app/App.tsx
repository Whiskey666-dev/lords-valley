import { useAppController } from '../hooks/app/useAppController';
import { Navbar } from '../ui/menus/Navbar';
import { Console } from '../ui/menus/Console';
import { SettingsPanel } from '../ui/menus/SettingsPanel';
import { NpcPanel } from '../ui/character/NpcPanel';
import { FollowersPanel } from '../ui/character/FollowersPanel';
import { BuildingsPanel } from '../ui/buildings/BuildingsPanel';
import { PlayerInventoryPanel } from '../ui/inventory/PlayerInventoryPanel';
import { MiniMap } from '../ui/hud/MiniMap';
import { WorldMapPanel } from '../ui/hud/WorldMapPanel';
import { AuthScreen } from './auth/AuthScreen';

function App() {
  const {
    isAuthed,
    setIsAuthed,
    selectedNPC,
    handleCloseNPC,
    showPlayerInventory,
    handleToggleInventory,
    showSettings,
    setShowSettings,
    handleToggleSettings,
    showFollowers,
    handleToggleFollowers,
    showBuildings,
    handleToggleBuildings,
    showMap,
    handleToggleMap,
    zoom,
    handleZoomIn,
    handleZoomOut,
  } = useAppController();

  if (!isAuthed) {
    return <AuthScreen onAuthenticated={() => setIsAuthed(true)} />;
  }

  // Detectar si hay algún panel lateral o modal abierto
  const hasSidePanel = !!selectedNPC || showPlayerInventory || showFollowers;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#111111',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Navbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onOpenSettings={handleToggleSettings}
        onToggleInventory={handleToggleInventory}
        onToggleFollowers={handleToggleFollowers}
        onToggleBuildings={handleToggleBuildings}
        onToggleMap={handleToggleMap}
        isInventoryOpen={showPlayerInventory}
        isSettingsOpen={showSettings}
        isFollowersOpen={showFollowers}
        isBuildingsOpen={showBuildings}
        isMapOpen={showMap}
      />

      {/* MiniMap: oculto cuando hay panel lateral o mapa mundial abierto */}
      {!hasSidePanel && !showMap && <MiniMap />}

      <Console />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Panel de Edificios (Gestión & Administración) */}
      {showBuildings && <BuildingsPanel onClose={handleToggleBuildings} />}

      {/* Panel de mapa a pantalla completa */}
      {showMap && <WorldMapPanel onClose={handleToggleMap} />}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Panel Seguidores - lateral izquierdo */}
        {showFollowers && <FollowersPanel onClose={handleToggleFollowers} />}

        <div
          id="game-container"
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        />

        {/* Panel NPC - lateral derecho */}
        {selectedNPC && (
          <div style={{ width: 320, overflowY: 'auto', background: '#0a0a0a', borderLeft: '1px solid #222', flexShrink: 0 }}>
            <NpcPanel npc={selectedNPC} onClose={handleCloseNPC} />
          </div>
        )}

        {/* Inventario - lateral derecho */}
        {showPlayerInventory && (
          <PlayerInventoryPanel onClose={() => handleToggleInventory()} />
        )}
      </div>
    </div>
  );
}

export default App;
