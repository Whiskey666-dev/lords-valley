import { useAppController } from '../hooks/app/useAppController';
import { Navbar } from '../ui/menus/Navbar';
import { Console } from '../ui/menus/Console';
import { SettingsPanel } from '../ui/menus/SettingsPanel';
import { NpcPanel } from '../ui/character/NpcPanel';
import { FollowersPanel } from '../ui/character/FollowersPanel';
import { DeadDragonPanel } from '../ui/character/DeadDragonPanel';
import { BuildingsPanel } from '../ui/buildings/BuildingsPanel';
import { PlayerInventoryPanel } from '../ui/inventory/PlayerInventoryPanel';
import { MiniMap } from '../ui/hud/MiniMap';
import { WorldMapPanel } from '../ui/hud/WorldMapPanel';
import { MineralTooltip } from '../ui/hud/MineralTooltip';
import { MissionsPanel } from '../ui/missions/MissionsPanel';
import { SkillsPanel } from '../ui/skills/SkillsPanel';
import { ConstructionPanel } from '../ui/construction/ConstructionPanel';
import { CropPlantingModal } from '../ui/farming/CropPlantingModal';
import { FogOverlay } from '../ui/hud/FogOverlay';
import { LoadingScreen } from '../ui/loading/LoadingScreen';
import { AuthScreen } from './auth/AuthScreen';

function App() {
  const {
    isAuthed,
    setIsAuthed,
    showCharacter,
    characterData,
    handleToggleCharacter,
    handleCloseCharacter,
    selectedNPC,
    handleCloseNPC,
    selectedDeadDragon,
    handleCloseDeadDragon,
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
    selectedFarmPlot,
    handleCloseCropPlot,
    zoom,
    handleZoomIn,
    handleZoomOut,
  } = useAppController();

  if (!isAuthed) {
    return <AuthScreen onAuthenticated={() => setIsAuthed(true)} />;
  }

  // Detectar si hay algún panel lateral o modal abierto
  const hasSidePanel = showCharacter || !!selectedNPC || !!selectedDeadDragon || !!selectedFarmPlot || showPlayerInventory || showFollowers;

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
      {/* Pantalla de Carga Funcional en Tiempo Real */}
      <LoadingScreen />

      <Navbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleCharacter={handleToggleCharacter}
        onOpenSettings={handleToggleSettings}
        onToggleInventory={handleToggleInventory}
        onToggleFollowers={handleToggleFollowers}
        onToggleBuildings={handleToggleBuildings}
        onToggleMap={handleToggleMap}
        onToggleMissions={handleToggleMissions}
        onToggleSkills={handleToggleSkills}
        onToggleConstruction={handleToggleConstruction}
        isCharacterOpen={showCharacter}
        isInventoryOpen={showPlayerInventory}
        isSettingsOpen={showSettings}
        isFollowersOpen={showFollowers}
        isBuildingsOpen={showBuildings}
        isMapOpen={showMap}
        isMissionsOpen={showMissions}
        isSkillsOpen={showSkills}
        isConstructionOpen={showConstruction}
      />

      {/* MiniMap: oculto mediante CSS cuando hay panel lateral o mapa mundial abierto para 0 coste de montaje */}
      <div style={{ display: (hasSidePanel || showMap) ? 'none' : 'block' }}>
        <MiniMap />
      </div>

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

      {/* Modal de Siembra y Cosecha de Parcelas de Cultivo */}
      {selectedFarmPlot && (
        <CropPlantingModal plotStatus={selectedFarmPlot} onClose={handleCloseCropPlot} />
      )}

      <div style={{ display: 'flex', flex: 1, width: '100%', height: 'calc(100vh - 32px)', overflow: 'hidden', position: 'relative' }}>
        {/* Panel Seguidores - lateral izquierdo (fixed) */}
        {showFollowers && <FollowersPanel onClose={handleToggleFollowers} />}

        {/* Contenedor del juego + niebla DOM que cubre TODO el terreno cargado */}
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex' }}>
          <div
            id="game-container"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          />
          {/* Niebla de guerra DOM — opaca todo excepto círculo alrededor del personaje */}
          {!showMap && <FogOverlay />}
        </div>

        {/* Panel Personaje (Jugador Principal) - lateral derecho (fixed overlay) */}
        {showCharacter && (
          <NpcPanel npc={characterData || {
            id: 'player',
            name: 'Señor Feudal',
            profession: 'Gobernante',
            loyalty: 100,
            health: 100,
            isPlayer: true,
            edad: 28,
          }} onClose={handleCloseCharacter} />
        )}

        {/* Panel NPC / Seguidor - lateral derecho (fixed overlay) */}
        {!showCharacter && selectedNPC && (
          <NpcPanel npc={selectedNPC} onClose={handleCloseNPC} />
        )}

        {/* Panel Dead Dragon - lateral derecho (fixed overlay) */}
        {selectedDeadDragon && (
          <DeadDragonPanel dragon={selectedDeadDragon} onClose={handleCloseDeadDragon} />
        )}

        {/* Inventario - lateral derecho (fixed overlay) */}
        {showPlayerInventory && (
          <PlayerInventoryPanel onClose={() => handleToggleInventory()} />
        )}
      </div>
    </div>
  );
}

export default App;
