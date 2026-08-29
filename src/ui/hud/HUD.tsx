import { useGameStore } from '../../app/store/useGameStore';
import { formatLvy } from '../../common/bigint';

export function HUD() {
  const settlement = useGameStore((s) => s.settlement);
  if (!settlement) return null;
  return (
    <div style={{ position: 'absolute', top: 44, left: 8, zIndex: 15, background: '#000000aa', padding: '6px 10px', borderRadius: 8, fontSize: 11, display: 'flex', gap: 12, alignItems: 'center' }}>
      <span>🏰 {settlement.name} <small style={{ color: '#aaa' }}>{settlement.tier}</small></span>
      <span>📅 Día {settlement.currentDay} Mes {settlement.currentMonth} Año {settlement.currentYear}</span>
      <span>{settlement.season} • {settlement.weather}</span>
      <span>💰 {formatLvy(settlement.lvyBalance)} LVY</span>
      <span>⏱ tick {settlement.gameTime}</span>
    </div>
  );
}
