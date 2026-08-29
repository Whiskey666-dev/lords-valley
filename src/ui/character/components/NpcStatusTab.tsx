import { type NpcPanelData } from "../../../hooks/character/useNpcPanel";

interface Props {
  npc: NpcPanelData;
  isCore: boolean;
}

export function NpcStatusTab({ npc, isCore }: Props) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.5 }}>
      {npc.isPlayer ? (
        <>
          <div><b>Username:</b> {npc.username}</div>
          <div><b>ID:</b> {npc.id?.slice(0, 8)}</div>
        </>
      ) : isCore ? (
        <>
          <div><b>Seguridad:</b> {npc.needs?.safety ?? 0}%</div>
          <div>
            <b>SocialLinks:</b> {npc.socialLinks?.length ?? 0}{" "}
            {npc.socialLinks?.map(s => `${s.type}→${s.targetSurvivorId.slice(0, 4)}(${s.affinity})`).join(', ')}
          </div>
        </>
      ) : (
        <div>
          {npc.personalidad && <div><b>Temperamento:</b> {npc.temperamento}</div>}
          {npc.gustos && <div><b>Gustos:</b> {npc.gustos}</div>}
        </div>
      )}
      {npc.needs && !isCore && !npc.isPlayer && (
        <div style={{ marginTop: 6, background: '#111', padding: 6, borderRadius: 6 }}>
          Hambre: {Math.round((npc.needs as any).hambre ?? 0)} • Sed: {Math.round((npc.needs as any).sed ?? 0)}
        </div>
      )}
    </div>
  );
}
