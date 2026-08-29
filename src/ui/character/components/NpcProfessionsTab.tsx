import { type NpcPanelData } from "../../../hooks/character/useNpcPanel";

interface Props {
  npc: NpcPanelData;
  isCore: boolean;
}

export function NpcProfessionsTab({ npc, isCore }: Props) {
  if (isCore && npc.professions?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {npc.professions.map((p, i) => (
          <div key={i} style={{ background: '#222', padding: 8, borderRadius: 6, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>{p.type}</b>
              <span>Lv{p.level}</span>
            </div>
            <div style={{ color: '#888' }}>
              XP: {(BigInt(p.experience) / BigInt(10) ** BigInt(18)).toString()}
            </div>
            {p.specializations?.length ? (
              <div style={{ color: '#666' }}>{p.specializations.join(', ')}</div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (npc.habilidades) {
    return (
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11 }}>
        {npc.habilidades.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    );
  }

  return <div style={{ color: '#666', fontSize: 11 }}>Sin profesiones</div>;
}
