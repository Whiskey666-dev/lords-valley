import { useState } from "react";
import { useBuildings } from "../../hooks/buildings/useBuildings";
import {
  CATEGORY_INFO,
  type BuildingCategory,
  type HierarchyRole,
} from "../../hooks/buildings/buildingsData";

interface Props {
  onClose: () => void;
}

export function BuildingsPanel({ onClose }: Props) {
  const {
    buildings,
    selectedBuilding,
    selectedBuildingId,
    setSelectedBuildingId,
    filterMode,
    setFilterMode,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    stats,
    liveNpcNames,
    assignWorker,
    removeWorker,
    changeWorkerRole,
    modifyInventoryItem,
    constructBuilding,
  } = useBuildings();

  const [selectedNpcForSlot, setSelectedNpcForSlot] = useState<Record<string, string>>({});
  const [selectedRoleForSlot, setSelectedRoleForSlot] = useState<Record<string, HierarchyRole>>({});

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 220,
        backgroundColor: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenedor Principal */}
      <div
        style={{
          width: '1120px',
          maxWidth: '98vw',
          height: '88vh',
          maxHeight: '780px',
          backgroundColor: '#090f17',
          border: '1px solid #1c2a3c',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 0 1px rgba(255,255,255,0.08)',
          overflow: 'hidden',
          fontSize: '11px',
        }}
      >
        {/* ── Barra Superior / Header ── */}
        <div
          style={{
            height: 44,
            minHeight: 44,
            backgroundColor: '#060b12',
            borderBottom: '1px solid #142030',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: 12,
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏛️</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2d4a8', letterSpacing: 0.3 }}>
                Edificios y Factorías Feudales
              </span>
              <span style={{ fontSize: 9, color: '#4a6a8a', marginLeft: 8 }}>
                {stats.existing} activos · {stats.locked} proyectos · {stats.totalWorkersAssigned} obreros asignados
              </span>
            </div>
          </div>

          {/* Filtros de Estado: Todos / Existentes / Bloqueados */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0c1420', padding: '2px', borderRadius: 6, border: '1px solid #142232' }}>
            <FilterTabBtn
              label={`Todos (${stats.total})`}
              active={filterMode === 'all'}
              onClick={() => setFilterMode('all')}
            />
            <FilterTabBtn
              label={`Construidos (${stats.existing})`}
              active={filterMode === 'existing'}
              onClick={() => setFilterMode('existing')}
            />
            <FilterTabBtn
              label={`Bloqueados (${stats.locked})`}
              active={filterMode === 'locked'}
              onClick={() => setFilterMode('locked')}
            />
          </div>

          {/* Buscador y Botón Cerrar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              placeholder="🔍 Filtrar edificio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#0b1420',
                border: '1px solid #18283a',
                borderRadius: 5,
                padding: '4px 8px',
                fontSize: 10,
                color: '#fff',
                outline: 'none',
                width: 140,
              }}
            />
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#180a0a',
                color: '#e05555',
                border: '1px solid #341414',
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              ✕ Cerrar [ESC]
            </button>
          </div>
        </div>

        {/* ── Fila de Categorías (Chips rápidos de filtro) ── */}
        <div
          style={{
            backgroundColor: '#080d15',
            borderBottom: '1px solid #121c2a',
            padding: '4px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <CategoryChip
            label="🌐 Todas las Categorías"
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          />
          {(Object.entries(CATEGORY_INFO) as [BuildingCategory, { label: string; icon: string }][]).map(
            ([catKey, catVal]) => (
              <CategoryChip
                key={catKey}
                label={`${catVal.icon} ${catVal.label}`}
                active={selectedCategory === catKey}
                onClick={() => setSelectedCategory(catKey)}
              />
            )
          )}
        </div>

        {/* ── Cuerpo Principal dividido en 2 columnas ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Columna Izquierda: Lista compacta de Edificios */}
          <div
            style={{
              width: '295px',
              minWidth: '260px',
              borderRight: '1px solid #131f2e',
              backgroundColor: '#070c14',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '6px',
              gap: 4,
            }}
          >
            {buildings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#4a5e70', fontSize: 10 }}>
                No hay edificios con estos filtros.
              </div>
            ) : (
              buildings.map((b) => {
                const isSelected = b.id === selectedBuildingId;
                const assignedCount = b.workers.filter((w) => !!w.npcName).length;
                const isLocked = b.status === 'locked';

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBuildingId(b.id)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      backgroundColor: isSelected ? '#122030' : isLocked ? '#0a0f16' : '#0c141e',
                      border: `1px solid ${
                        isSelected ? '#2e669e' : isLocked ? '#131b26' : '#162332'
                      }`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.1s ease',
                      opacity: isLocked ? 0.7 : 1,
                    }}
                  >
                    {/* Icono pequeño */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 5,
                        backgroundColor: isLocked ? '#101620' : '#142332',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                        border: `1px solid ${isLocked ? '#1a2430' : '#22364c'}`,
                      }}
                    >
                      {b.icon}
                    </div>

                    {/* Info compacta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: isSelected ? '#70c8ff' : isLocked ? '#788898' : '#d2dce8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {b.name}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            padding: '1px 4px',
                            borderRadius: 3,
                            backgroundColor: isLocked ? '#221414' : '#0e2418',
                            color: isLocked ? '#c06060' : '#00ff88',
                            fontWeight: 700,
                          }}
                        >
                          {isLocked ? '🔒 Bloq.' : `Nv.${b.level}`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, fontSize: 9, color: '#486278' }}>
                        <span>{b.categoryLabel}</span>
                        <span>
                          👥 {assignedCount}/{b.maxWorkers} · ⚡{isLocked ? '0%' : `${b.efficiency}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Columna Derecha: Vista Detallada de Gestión y Administración */}
          {selectedBuilding ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                backgroundColor: '#090f18',
              }}
            >
              {/* Header compacto del edificio seleccionado */}
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#060b12',
                  borderBottom: '1px solid #132030',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: '#101d2c',
                      border: '1px solid #223850',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {selectedBuilding.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#eedcaa' }}>
                        {selectedBuilding.name}
                      </span>
                      <span
                        style={{
                          fontSize: 8,
                          padding: '1px 5px',
                          borderRadius: 3,
                          backgroundColor: selectedBuilding.status === 'locked' ? '#2c1414' : '#0e2418',
                          color: selectedBuilding.status === 'locked' ? '#ff6666' : '#55ff99',
                          fontWeight: 700,
                        }}
                      >
                        {selectedBuilding.status === 'locked' ? 'Proyecto Bloqueado' : `Operativo (Tier ${selectedBuilding.tier})`}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#688298', marginTop: 1 }}>
                      {selectedBuilding.description}
                    </div>
                  </div>
                </div>

                {/* Métricas compactas */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <MetricCard label="Eficiencia" value={`${selectedBuilding.efficiency}%`} color="#00ff88" />
                  <MetricCard label="Durabilidad" value={`${selectedBuilding.durability}%`} color="#60b0ff" />
                  <MetricCard label="Categoría" value={selectedBuilding.categoryLabel} color="#c09858" />
                </div>
              </div>

              {/* Si el edificio está bloqueado: Banner compacto de Construcción */}
              {selectedBuilding.status === 'locked' && (
                <div
                  style={{
                    margin: '10px 14px 0',
                    padding: '8px 12px',
                    backgroundColor: '#121822',
                    border: '1px dashed #2a3c50',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#d8b468' }}>
                      🔒 Edificio aún no construido. Requisitos:
                    </span>
                    <span style={{ fontSize: 10, color: '#889eb2', marginLeft: 8 }}>
                      {selectedBuilding.unlockCost?.map((c, i) => (
                        <span key={i} style={{ color: '#fff', fontWeight: 600, marginRight: 8 }}>
                          {c.icon} {c.amount} {c.name}
                        </span>
                      ))}
                    </span>
                  </div>
                  <button
                    onClick={() => constructBuilding(selectedBuilding.id)}
                    style={{
                      backgroundColor: '#1c3e5e',
                      color: '#ffffff',
                      border: '1px solid #2e5a88',
                      borderRadius: 5,
                      padding: '5px 12px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🔨 Construir y Desbloquear
                  </button>
                </div>
              )}

              {/* ── Selector de Pestañas: Gestión vs Administración ── */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #142030',
                  padding: '0 14px',
                  backgroundColor: '#070c14',
                  marginTop: 6,
                  flexShrink: 0,
                }}
              >
                <DetailTabBtn
                  label="📦 Gestión de Bodega e Inventario"
                  active={activeTab === 'gestion'}
                  onClick={() => setActiveTab('gestion')}
                />
                <DetailTabBtn
                  label="👥 Administración y Trabajadores"
                  active={activeTab === 'administracion'}
                  onClick={() => setActiveTab('administracion')}
                />
              </div>

              {/* ── Contenido de la pestaña activa ── */}
              <div style={{ padding: '10px 14px', flex: 1, overflowY: 'auto' }}>
                {activeTab === 'gestion' ? (
                  /* ════ PESTAÑA: GESTIÓN (BODEGA E INVENTARIO) ════ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Resumen de capacidad de bodega */}
                    <div
                      style={{
                        backgroundColor: '#0a121c',
                        border: '1px solid #142232',
                        borderRadius: 6,
                        padding: '8px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#90a8c0' }}>
                        <span>Capacidad Total de Bodega</span>
                        <span>
                          {selectedBuilding.inventory.reduce((acc, it) => acc + it.quantity, 0)} / {selectedBuilding.maxInventoryWeight} unidades
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 4, backgroundColor: '#050a10', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (selectedBuilding.inventory.reduce((acc, it) => acc + it.quantity, 0) /
                                Math.max(1, selectedBuilding.maxInventoryWeight)) *
                                100
                            )}%`,
                            height: '100%',
                            backgroundColor: '#2678a0',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>

                    {/* Lista de Recursos / Ítems almacenados */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#a0b8cc', marginBottom: 6 }}>
                        Recursos y Bienes en Almacén ({selectedBuilding.inventory.length})
                      </div>
                      {selectedBuilding.inventory.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#4a6074', fontSize: 10 }}>
                          Bodega vacía. Este edificio aún no almacena recursos.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                          {selectedBuilding.inventory.map((item) => {
                            const pct = Math.round((item.quantity / Math.max(1, item.maxCapacity)) * 100);
                            return (
                              <div
                                key={item.id}
                                style={{
                                  backgroundColor: '#0b1420',
                                  border: '1px solid #142436',
                                  borderRadius: 6,
                                  padding: '6px 10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#d8e4f0' }}>{item.name}</div>
                                      <div style={{ fontSize: 8, color: '#4a6478' }}>{item.category}</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#60b0ff' }}>
                                      {item.quantity}
                                    </span>
                                    <span style={{ fontSize: 8, color: '#445566' }}>/{item.maxCapacity}</span>
                                  </div>
                                </div>

                                <div style={{ width: '100%', height: 3, backgroundColor: '#050a10', borderRadius: 1, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: '100%',
                                      backgroundColor: pct > 85 ? '#d08030' : '#3878b8',
                                    }}
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => modifyInventoryItem(selectedBuilding.id, item.id, -10)}
                                    style={{
                                      backgroundColor: '#101a26',
                                      border: '1px solid #182a3c',
                                      borderRadius: 3,
                                      color: '#70a0d0',
                                      fontSize: 9,
                                      padding: '1px 6px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    -10
                                  </button>
                                  <button
                                    onClick={() => modifyInventoryItem(selectedBuilding.id, item.id, 10)}
                                    style={{
                                      backgroundColor: '#101a26',
                                      border: '1px solid #182a3c',
                                      borderRadius: 3,
                                      color: '#70a0d0',
                                      fontSize: 9,
                                      padding: '1px 6px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    +10
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Ciclo de producción / Receta */}
                    {selectedBuilding.recipe && (
                      <div
                        style={{
                          backgroundColor: '#0a121c',
                          border: '1px solid #142232',
                          borderRadius: 6,
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#d0c294', marginBottom: 4 }}>
                          ⚡ Rendimiento Industrial por Hora
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 9, color: '#7a92a8' }}>
                          <div>
                            <span style={{ color: '#e06060', fontWeight: 600 }}>Insumos:</span>{' '}
                            {selectedBuilding.recipe.inputs.map((inp, i) => (
                              <span key={i} style={{ marginLeft: 3 }}>
                                {inp.icon} {inp.name} ({inp.rate})
                              </span>
                            ))}
                          </div>
                          <span style={{ color: '#3a5068' }}>➔</span>
                          <div>
                            <span style={{ color: '#44dd88', fontWeight: 600 }}>Producción:</span>{' '}
                            {selectedBuilding.recipe.outputs.map((out, i) => (
                              <span key={i} style={{ marginLeft: 3 }}>
                                {out.icon} {out.name} ({out.rate})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ════ PESTAÑA: ADMINISTRACIÓN (TRABAJADORES Y PERMISOS) ════ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#a0b8cc' }}>
                        Puestos y Jerarquía de Trabajo ({selectedBuilding.workers.filter(w => !!w.npcName).length} / {selectedBuilding.maxWorkers})
                      </span>
                      <span style={{ fontSize: 9, color: '#556c80' }}>
                        Asigna colonos según su especialidad para maximizar la producción
                      </span>
                    </div>

                    {/* Lista de puestos / slots */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {selectedBuilding.workers.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#4a6074', fontSize: 10 }}>
                          Este edificio es residencial o no requiere operarios directos.
                        </div>
                      ) : (
                        selectedBuilding.workers.map((slot, index) => {
                          const isAssigned = !!slot.npcName;

                          return (
                            <div
                              key={slot.id}
                              style={{
                                backgroundColor: isAssigned ? '#0c1622' : '#080e16',
                                border: `1px solid ${isAssigned ? '#182e44' : '#101824'}`,
                                borderRadius: 6,
                                padding: '6px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    backgroundColor: isAssigned ? '#12283a' : '#0f1620',
                                    color: isAssigned ? '#60b0ff' : '#3c4e60',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  #{index + 1}
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: isAssigned ? '#ffffff' : '#587084' }}>
                                      {isAssigned ? slot.npcName : `Puesto Vacante (${slot.professionRequired})`}
                                    </span>
                                    {isAssigned && <RoleBadge role={slot.role} />}
                                  </div>
                                  <div style={{ fontSize: 8, color: '#3c5266', marginTop: 1 }}>
                                    Requerido: {slot.professionRequired} · Eficiencia: {slot.efficiency}%
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {isAssigned ? (
                                  <>
                                    <select
                                      value={slot.role}
                                      onChange={(e) =>
                                        changeWorkerRole(selectedBuilding.id, slot.id, e.target.value as HierarchyRole)
                                      }
                                      style={{
                                        backgroundColor: '#070e16',
                                        color: '#60a0d0',
                                        border: '1px solid #162a3c',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 9,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <option value="trabajador">Trabajador</option>
                                      <option value="supervisor">Supervisor</option>
                                      <option value="administrador">Administrador</option>
                                      <option value="maestro">Maestro</option>
                                    </select>

                                    <button
                                      onClick={() => removeWorker(selectedBuilding.id, slot.id)}
                                      title="Desasignar colono"
                                      style={{
                                        backgroundColor: '#180a0a',
                                        color: '#e05555',
                                        border: '1px solid #301414',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 9,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Desasignar
                                    </button>
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <select
                                      value={selectedNpcForSlot[slot.id] || (liveNpcNames[0] ?? '')}
                                      onChange={(e) =>
                                        setSelectedNpcForSlot((prev) => ({ ...prev, [slot.id]: e.target.value }))
                                      }
                                      style={{
                                        backgroundColor: '#070e16',
                                        color: '#d0dce8',
                                        border: '1px solid #162a3c',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 9,
                                        cursor: 'pointer',
                                        maxWidth: 120,
                                      }}
                                    >
                                      {liveNpcNames.length > 0 ? (
                                        liveNpcNames.map((name, i) => (
                                          <option key={i} value={name}>
                                            {name}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="Colono Voluntario">Colono Voluntario</option>
                                      )}
                                    </select>

                                    <select
                                      value={selectedRoleForSlot[slot.id] || 'trabajador'}
                                      onChange={(e) =>
                                        setSelectedRoleForSlot((prev) => ({
                                          ...prev,
                                          [slot.id]: e.target.value as HierarchyRole,
                                        }))
                                      }
                                      style={{
                                        backgroundColor: '#070e16',
                                        color: '#60a0d0',
                                        border: '1px solid #162a3c',
                                        borderRadius: 4,
                                        padding: '2px 6px',
                                        fontSize: 9,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <option value="trabajador">Trabajador</option>
                                      <option value="supervisor">Supervisor</option>
                                      <option value="administrador">Administrador</option>
                                      <option value="maestro">Maestro</option>
                                    </select>

                                    <button
                                      onClick={() => {
                                        const candidate =
                                          selectedNpcForSlot[slot.id] ||
                                          (liveNpcNames.length > 0 ? liveNpcNames[0] : 'Colono Voluntario');
                                        const role = selectedRoleForSlot[slot.id] || 'trabajador';
                                        assignWorker(selectedBuilding.id, slot.id, candidate, role);
                                      }}
                                      style={{
                                        backgroundColor: '#163048',
                                        color: '#70c0ff',
                                        border: '1px solid #22486c',
                                        borderRadius: 4,
                                        padding: '2px 8px',
                                        fontSize: 9,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Asignar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Resumen de Jerarquías */}
                    <div
                      style={{
                        backgroundColor: '#070c14',
                        border: '1px solid #101c2a',
                        borderRadius: 6,
                        padding: '8px 10px',
                        marginTop: 4,
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#7094b0', marginBottom: 4 }}>
                        🛡️ Jerarquías y Permisos Feudales:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 4, fontSize: 8, color: '#556e84' }}>
                        <div><strong style={{ color: '#00ff88' }}>Trabajador:</strong> Faenas ordinarias y consumo.</div>
                        <div><strong style={{ color: '#60b0ff' }}>Supervisor:</strong> Coordinación de turnos (+10% ef.).</div>
                        <div><strong style={{ color: '#b070f0' }}>Administrador:</strong> Control de bodega y balances.</div>
                        <div><strong style={{ color: '#ffcc00' }}>Maestro:</strong> Recetas maestras y aprendices.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? '#142436' : 'transparent',
        color: active ? '#7ac4f0' : '#5a7288',
        border: 'none',
        borderRadius: 4,
        padding: '3px 8px',
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.1s ease',
      }}
    >
      {label}
    </button>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? '#182b40' : '#0c1420',
        color: active ? '#8acfff' : '#607890',
        border: `1px solid ${active ? '#2c547c' : '#142232'}`,
        borderRadius: 12,
        padding: '2px 8px',
        fontSize: 9,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.1s ease',
      }}
    >
      {label}
    </button>
  );
}

function DetailTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: 'transparent',
        color: active ? '#70c0ff' : '#506880',
        border: 'none',
        borderBottom: `2px solid ${active ? '#3080d0' : 'transparent'}`,
        padding: '6px 12px',
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.1s ease',
      }}
    >
      {label}
    </button>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: '#080e18',
        border: '1px solid #121e2e',
        borderRadius: 5,
        padding: '3px 8px',
        textAlign: 'right',
      }}
    >
      <div style={{ fontSize: 7, color: '#4a5e70', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: HierarchyRole }) {
  const config = {
    maestro: { label: 'Maestro', color: '#ffcc00', bg: '#241c00' },
    administrador: { label: 'Admin', color: '#b870f0', bg: '#1e0c2e' },
    supervisor: { label: 'Supervisor', color: '#60b0ff', bg: '#0c1c2e' },
    trabajador: { label: 'Trabajador', color: '#00ff88', bg: '#081e14' },
  }[role];

  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 3,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
      }}
    >
      {config.label}
    </span>
  );
}

export default BuildingsPanel;
