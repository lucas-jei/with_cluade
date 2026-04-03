function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getCategoryStyle(code: string): { background: string; color: string } {
  const hue = hashCode(code) % 360;
  return {
    background: `hsl(${hue}, 70%, 92%)`,
    color: `hsl(${hue}, 60%, 35%)`,
  };
}
