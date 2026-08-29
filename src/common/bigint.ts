export function formatLvy(raw: string, decimals = 18, displayDecimals = 2): string {
  try {
    const bi = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = bi / base;
    const frac = bi % base;
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, displayDecimals).replace(/0+$/, '');
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return raw;
  }
}

export function addQty(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

export function subQty(a: string, b: string): string {
  return (BigInt(a) - BigInt(b)).toString();
}
