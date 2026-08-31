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
import { MineralTooltip } from '../ui/hud/MineralTooltip';
import { MissionsPanel } from '../ui/missions/MissionsPanel';
import { SkillsPanel } from '../ui/skills/SkillsPanel';
import { ConstructionPanel } from '../ui/construction/ConstructionPanel';
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
    showMissions,
    handleToggleMissions,
    showSkills,
    handleToggleSkills,
    showConstruction,
    handleToggleConstruction,
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
        onToggleMissions={handleToggleMissions}
        onToggleSkills={handleToggleSkills}
        onToggleConstruction={handleToggleConstruction}
        isInventoryOpen={showPlayerInventory}
        isSettingsOpen={showSettings}
        isFollowersOpen={showFollowers}
        isBuildingsOpen={showBuildings}
        isMapOpen={showMap}
        isMissionsOpen={showMissions}
        isSkillsOpen={showSkills}
        isConstructionOpen={showConstruction}
      />

      {/* MiniMap: oculto cuando hay panel lateral o mapa mundial abierto */}
      {!hasSidePanel && !showMap && <MiniMap />}

      {/* Tooltip informativo de minerales al hover */}
      <MineralTooltip />

      <Console />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Panel de Edificios (Gestión & Administración) */}
      {showBuildings && <BuildingsPanel onClose={handleToggleBuildings} />}

      {/* Panel de mapa a pantalla completa */}
      {showMap && <WorldMapPanel onClose={handleToggleMap} />}

      {/* Panel de Misiones — 6 capítulos x 20 misiones */}
      {showMissions && <MissionsPanel onClose={handleToggleMissions} />}

      {/* Panel de Habilidades — pentagrama 5+1 con anillo de progreso */}
      {showSkills && <SkillsPanel onClose={handleToggleSkills} />}

      {/* Panel de Construcción — 56 edificios 7 categorías + mejoras por capítulo */}
      {showConstruction && <ConstructionPanel onClose={handleToggleConstruction} />}

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
