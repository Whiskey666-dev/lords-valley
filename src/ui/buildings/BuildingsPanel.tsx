import { useState } from "react";
import { useBuildings } from "../../hooks/buildings/useBuildings";
import {
  CATEGORY_INFO,
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 220,
        backgroundColor: 'rgba(0, 0, 0, 0.80)',
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
      <style>{`
        .b-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .b-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .b-scroll::-webkit-scrollbar-thumb {
          background: #22374e;
          border-radius: 3px;
        }
        .b-scroll::-webkit-scrollbar-thumb:hover {
          background: #33557a;
        }
      `}</style>

      {/* ── Ventana Principal con Dimensiones Estables y Contención ── */}
      <div
        style={{
          width: '1060px',
          maxWidth: '96vw',
          height: '670px',
          maxHeight: '90vh',
          backgroundColor: '#0c141f',
          border: '1px solid #223548',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* ── 1. Barra de Título Superior (40px) ── */}
        <div
          style={{
            height: 40,
            minHeight: 40,
            backgroundColor: '#070c13',
            borderBottom: '1px solid #192838',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Logo / Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏛️</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0e6c8', letterSpacing: 0.3 }}>
              Gestión y Administración de Edificios
            </span>
            <span style={{ fontSize: 10, color: '#688298', marginLeft: 4 }}>
              ({stats.existing} construidos · {stats.locked} bloqueados)
            </span>
          </div>

          {/* Buscador y Botón Cerrar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              placeholder="Buscar edificio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#101b28',
                border: '1px solid #203348',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 11,
                color: '#ffffff',
                outline: 'none',
                width: 140,
              }}
            />
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#220d0d',
                color: '#ff6666',
                border: '1px solid #4a1c1c',
                borderRadius: 4,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* ── 2. Barra de Filtros y Categorías (36px) ── */}
        <div
          style={{
            height: 36,
            minHeight: 36,
            backgroundColor: '#091018',
            borderBottom: '1px solid #162434',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            gap: 10,
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Segmentado: Todos / Construidos / Bloqueados */}
          <div style={{ display: 'flex', backgroundColor: '#060a10', padding: '2px', borderRadius: 4, border: '1px solid #14202e' }}>
            <SegmentBtn label="Todos" count={stats.total} active={filterMode === 'all'} onClick={() => setFilterMode('all')} />
            <SegmentBtn label="Construidos" count={stats.existing} active={filterMode === 'existing'} onClick={() => setFilterMode('existing')} />
            <SegmentBtn label="Bloqueados" count={stats.locked} active={filterMode === 'locked'} onClick={() => setFilterMode('locked')} />
          </div>

          {/* Selector de Categoría Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#668096', fontWeight: 600 }}>Categoría:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              style={{
                backgroundColor: '#101a26',
                color: '#8acfff',
                border: '1px solid #1c2e42',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10.5,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">🌐 Todas las Categorías ({stats.total})</option>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 3. Cuerpo Dividido en 2 Columnas ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* ── Columna Izquierda: Lista de Edificios (310px fija) ── */}
          <div
            className="b-scroll"
            style={{
              width: 310,
              minWidth: 310,
              borderRight: '1px solid #162434',
              backgroundColor: '#080d14',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '6px',
              gap: 4,
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {buildings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#556c80', fontSize: 11 }}>
                No hay edificios disponibles.
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
                      height: 48,
                      padding: '0 8px',
                      borderRadius: 5,
                      backgroundColor: isSelected ? '#152538' : isLocked ? '#0b1017' : '#0e1622',
                      border: `1px solid ${isSelected ? '#357ebd' : isLocked ? '#141c26' : '#1a293a'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Icono */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 4,
                        backgroundColor: isLocked ? '#121820' : '#142232',
                        border: `1px solid ${isLocked ? '#1c2634' : '#223850'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {b.icon}
                    </div>

                    {/* Texto */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: isSelected ? '#8acfff' : isLocked ? '#b0bac4' : '#ffffff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.name}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: 3,
                            backgroundColor: isLocked ? '#281212' : '#0c2818',
                            color: isLocked ? '#ff6666' : '#2ecc71',
                            flexShrink: 0,
                            marginLeft: 4,
                          }}
                        >
                          {isLocked ? 'Bloqueado' : `Nv.${b.level}`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, fontSize: 9.5, color: '#688096' }}>
                        <span>{b.categoryLabel}</span>
                        <span>
                          👥 {assignedCount}/{b.maxWorkers} {b.status === 'existing' && `· ⚡${b.efficiency}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Columna Derecha: Detalle de Gestión / Administración ── */}
          {selectedBuilding ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: '#0a121c',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              {/* Header del Edificio Seleccionado con Altura Flexible y Alineación Perfecta */}
              <div
                style={{
                  minHeight: 58,
                  backgroundColor: '#070d14',
                  borderBottom: '1px solid #162434',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  gap: 12,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 6,
                      backgroundColor: '#122030',
                      border: '1px solid #203850',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {selectedBuilding.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f0e6c8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedBuilding.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          backgroundColor: selectedBuilding.status === 'locked' ? '#2c1212' : '#0d2b1a',
                          color: selectedBuilding.status === 'locked' ? '#ff6666' : '#2ecc71',
                          border: `1px solid ${selectedBuilding.status === 'locked' ? '#551a1a' : '#1a4c2c'}`,
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {selectedBuilding.status === 'locked' ? 'Proyecto Bloqueado' : `Tier ${selectedBuilding.tier} · Operativo`}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#88a2b8', marginTop: 3, lineHeight: '1.3' }}>
                      {selectedBuilding.description}
                    </div>
                  </div>
                </div>

                {/* Métricas Rápidas Alineadas */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  <MetricBadge label="Eficiencia" value={`${selectedBuilding.efficiency}%`} color="#2ecc71" />
                  <MetricBadge label="Durabilidad" value={`${selectedBuilding.durability}%`} color="#3498db" />
                </div>
              </div>

              {/* Si está bloqueado: Banner de Requisitos */}
              {selectedBuilding.status === 'locked' && (
                <div
                  style={{
                    backgroundColor: '#111822',
                    borderBottom: '1px solid #1c2a38',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: '#deb870' }}>Requisitos de Construcción:</span>
                    {selectedBuilding.unlockCost?.map((c, i) => (
                      <span key={i} style={{ color: '#ffffff', backgroundColor: '#182432', padding: '2px 6px', borderRadius: 3 }}>
                        {c.icon} {c.amount} {c.name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => constructBuilding(selectedBuilding.id)}
                    style={{
                      backgroundColor: '#1b4a6e',
                      color: '#ffffff',
                      border: '1px solid #2e70a0',
                      borderRadius: 4,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🔨 Construir y Desbloquear
                  </button>
                </div>
              )}

              {/* ── Pestañas Seguras Sin Desbordamiento (34px) ── */}
              <div
                style={{
                  height: 34,
                  minHeight: 34,
                  backgroundColor: '#070c14',
                  borderBottom: '1px solid #162434',
                  display: 'flex',
                  padding: '0 16px',
                  gap: 16,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                <TabButton
                  active={activeTab === 'gestion'}
                  onClick={() => setActiveTab('gestion')}
                  label="📦 Bodega e Inventario"
                />
                <TabButton
                  active={activeTab === 'administracion'}
                  onClick={() => setActiveTab('administracion')}
                  label="👥 Administración y Personal"
                />
              </div>

              {/* ── Contenido de la Pestaña Activa (Scroll Controlado) ── */}
              <div className="b-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', boxSizing: 'border-box' }}>
                {activeTab === 'gestion' ? (
                  /* ══════ PESTAÑA: GESTIÓN (BODEGA) ══════ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Barra de Capacidad de Bodega */}
                    <div
                      style={{
                        backgroundColor: '#0c1622',
                        border: '1px solid #18283a',
                        borderRadius: 5,
                        padding: '8px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#90a8be' }}>
                        <span>Capacidad Total de Bodega</span>
                        <span style={{ color: '#ffffff' }}>
                          {selectedBuilding.inventory.reduce((acc, it) => acc + it.quantity, 0)} / {selectedBuilding.maxInventoryWeight} unidades
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 5, backgroundColor: '#050a10', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (selectedBuilding.inventory.reduce((acc, it) => acc + it.quantity, 0) /
                                Math.max(1, selectedBuilding.maxInventoryWeight)) *
                                100
                            )}%`,
                            height: '100%',
                            backgroundColor: '#3498db',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>

                    {/* Grilla de Recursos / Ítems */}
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#b0c4d8', marginBottom: 6 }}>
                        Inventario y Recursos Almacenados ({selectedBuilding.inventory.length})
                      </div>
                      {selectedBuilding.inventory.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#556c80', fontSize: 11 }}>
                          Este edificio no almacena recursos actualmente.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                          {selectedBuilding.inventory.map((item) => {
                            const pct = Math.round((item.quantity / Math.max(1, item.maxCapacity)) * 100);
                            return (
                              <div
                                key={item.id}
                                style={{
                                  backgroundColor: '#0d1824',
                                  border: '1px solid #1a2c40',
                                  borderRadius: 5,
                                  padding: '8px 10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                      </div>
                                      <div style={{ fontSize: 9, color: '#688298' }}>{item.category}</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#8acfff' }}>
                                      {item.quantity}
                                    </span>
                                    <span style={{ fontSize: 9, color: '#667c90' }}>/{item.maxCapacity}</span>
                                  </div>
                                </div>

                                <div style={{ width: '100%', height: 3, backgroundColor: '#050a10', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 85 ? '#e67e22' : '#3498db' }} />
                                </div>

                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                                  <button
                                    onClick={() => modifyInventoryItem(selectedBuilding.id, item.id, -10)}
                                    style={{
                                      backgroundColor: '#122030',
                                      border: '1px solid #1e3550',
                                      borderRadius: 3,
                                      color: '#8acfff',
                                      fontSize: 9.5,
                                      fontWeight: 600,
                                      padding: '2px 7px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    -10
                                  </button>
                                  <button
                                    onClick={() => modifyInventoryItem(selectedBuilding.id, item.id, 10)}
                                    style={{
                                      backgroundColor: '#122030',
                                      border: '1px solid #1e3550',
                                      borderRadius: 3,
                                      color: '#8acfff',
                                      fontSize: 9.5,
                                      fontWeight: 600,
                                      padding: '2px 7px',
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

                    {/* Flujo de Producción */}
                    {selectedBuilding.recipe && (
                      <div
                        style={{
                          backgroundColor: '#0c1622',
                          border: '1px solid #18283a',
                          borderRadius: 5,
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#deb870', marginBottom: 4 }}>
                          ⚡ Flujo de Producción por Hora
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, color: '#88a0b8' }}>
                          <div>
                            <span style={{ color: '#e74c3c', fontWeight: 600 }}>Insumos:</span>{' '}
                            {selectedBuilding.recipe.inputs.map((inp, i) => (
                              <span key={i} style={{ color: '#ffffff', marginLeft: 4 }}>
                                {inp.icon} {inp.name} ({inp.rate})
                              </span>
                            ))}
                          </div>
                          <span style={{ color: '#3a5068' }}>➔</span>
                          <div>
                            <span style={{ color: '#2ecc71', fontWeight: 600 }}>Rendimiento:</span>{' '}
                            {selectedBuilding.recipe.outputs.map((out, i) => (
                              <span key={i} style={{ color: '#ffffff', marginLeft: 4 }}>
                                {out.icon} {out.name} ({out.rate})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ══════ PESTAÑA: ADMINISTRACIÓN (TRABAJADORES Y JERARQUÍA) ══════ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                    {/* Cabecera de puestos */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#b0c4d8' }}>
                        Puestos Asignados ({selectedBuilding.workers.filter((w) => !!w.npcName).length} / {selectedBuilding.maxWorkers})
                      </span>
                      <span style={{ fontSize: 10, color: '#688298' }}>
                        Asigna colonos con profesiones afines para maximizar la producción
                      </span>
                    </div>

                    {/* Lista de Puestos con Contención Estricta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', boxSizing: 'border-box' }}>
                      {selectedBuilding.workers.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#556c80', fontSize: 11 }}>
                          Este edificio es residencial y no requiere puestos de trabajo manuales.
                        </div>
                      ) : (
                        selectedBuilding.workers.map((slot, index) => {
                          const isAssigned = !!slot.npcName;

                          return (
                            <div
                              key={slot.id}
                              style={{
                                height: 46,
                                backgroundColor: isAssigned ? '#0e1a26' : '#080f16',
                                border: `1px solid ${isAssigned ? '#1c344c' : '#121d28'}`,
                                borderRadius: 6,
                                padding: '0 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                boxSizing: 'border-box',
                                width: '100%',
                              }}
                            >
                              {/* Lado Izquierdo: Info del Puesto y Trabajador */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: isAssigned ? '#3498db' : '#445868', flexShrink: 0 }}>
                                  #{index + 1}
                                </span>
                                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      style={{
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        color: isAssigned ? '#ffffff' : '#60788c',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {isAssigned ? slot.npcName : `Vacante (${slot.professionRequired})`}
                                    </span>
                                    {isAssigned && <RoleBadge role={slot.role} />}
                                  </div>
                                  <div style={{ fontSize: 9.5, color: '#556e84', marginTop: 1, whiteSpace: 'nowrap' }}>
                                    Req: {slot.professionRequired} {isAssigned && `· Eficiencia: ${slot.efficiency}%`}
                                  </div>
                                </div>
                              </div>

                              {/* Lado Derecho: Controles de Rol y Asignación */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                {isAssigned ? (
                                  <>
                                    <select
                                      value={slot.role}
                                      onChange={(e) =>
                                        changeWorkerRole(selectedBuilding.id, slot.id, e.target.value as HierarchyRole)
                                      }
                                      style={{
                                        backgroundColor: '#0a1420',
                                        color: '#8acfff',
                                        border: '1px solid #1a2e42',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: 10.5,
                                        cursor: 'pointer',
                                        outline: 'none',
                                      }}
                                    >
                                      <option value="trabajador">Trabajador</option>
                                      <option value="supervisor">Supervisor</option>
                                      <option value="administrador">Administrador</option>
                                      <option value="maestro">Maestro</option>
                                    </select>

                                    <button
                                      onClick={() => removeWorker(selectedBuilding.id, slot.id)}
                                      style={{
                                        backgroundColor: '#200c0c',
                                        color: '#ff6666',
                                        border: '1px solid #4a1c1c',
                                        borderRadius: 4,
                                        padding: '4px 10px',
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Desasignar
                                    </button>
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <select
                                      value={selectedNpcForSlot[slot.id] || (liveNpcNames[0] ?? '')}
                                      onChange={(e) =>
                                        setSelectedNpcForSlot((prev) => ({ ...prev, [slot.id]: e.target.value }))
                                      }
                                      style={{
                                        backgroundColor: '#0a1420',
                                        color: '#ffffff',
                                        border: '1px solid #1a2e42',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: 10.5,
                                        maxWidth: 130,
                                        cursor: 'pointer',
                                        outline: 'none',
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

                                    <button
                                      onClick={() => {
                                        const candidate =
                                          selectedNpcForSlot[slot.id] ||
                                          (liveNpcNames.length > 0 ? liveNpcNames[0] : 'Colono Voluntario');
                                        const role = slot.role || 'trabajador';
                                        assignWorker(selectedBuilding.id, slot.id, candidate, role);
                                      }}
                                      style={{
                                        backgroundColor: '#1b4a6e',
                                        color: '#ffffff',
                                        border: '1px solid #2e70a0',
                                        borderRadius: 4,
                                        padding: '4px 12px',
                                        fontSize: 10.5,
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

                    {/* Resumen de Jerarquías Cuadrado y Simétrico */}
                    <div
                      style={{
                        backgroundColor: '#080e16',
                        border: '1px solid #142232',
                        borderRadius: 6,
                        padding: '8px 12px',
                        marginTop: 4,
                        boxSizing: 'border-box',
                        width: '100%',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#88a0b8', marginBottom: 6 }}>
                        🛡️ Jerarquías Feudales y Niveles de Acceso:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 16px', fontSize: 9.5, color: '#7a96ae' }}>
                        <div><strong style={{ color: '#2ecc71' }}>• Trabajador:</strong> Ejecuta faenas operativas básicas y consume insumos.</div>
                        <div><strong style={{ color: '#3498db' }}>• Supervisor:</strong> Coordina turnos y previene desperdicios (+10% ef.).</div>
                        <div><strong style={{ color: '#c084fc' }}>• Administrador:</strong> Acceso a bodega y balances contables del edificio.</div>
                        <div><strong style={{ color: '#f1c40f' }}>• Maestro Artesano:</strong> Habilita recetas maestras y entrena aprendices.</div>
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

function SegmentBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? '#1a3048' : 'transparent',
        color: active ? '#8acfff' : '#688298',
        border: 'none',
        borderRadius: 3,
        padding: '3px 8px',
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label} ({count})
    </button>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: 'transparent',
        color: active ? '#8acfff' : '#60788c',
        border: 'none',
        borderBottom: `2px solid ${active ? '#357ebd' : 'transparent'}`,
        padding: '0 4px',
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        height: '100%',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {label}
    </button>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: '#0d1824',
        border: '1px solid #1a2c3e',
        borderRadius: 4,
        padding: '2px 8px',
        textAlign: 'right',
      }}
    >
      <div style={{ fontSize: 8, color: '#688298' }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: HierarchyRole }) {
  const config = {
    maestro: { label: 'Maestro', color: '#f1c40f', bg: '#2b2200' },
    administrador: { label: 'Admin', color: '#c084fc', bg: '#200e2e' },
    supervisor: { label: 'Supervisor', color: '#3498db', bg: '#0d2238' },
    trabajador: { label: 'Trabajador', color: '#2ecc71', bg: '#0a2616' },
  }[role];

  return (
    <span
      style={{
        fontSize: 8.5,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 3,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}44`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {config.label}
    </span>
  );
}

export default BuildingsPanel;
