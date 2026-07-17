// WavesOfEgypt brand palette — derived from the sibling web artifact's index.css
// Light: ocean navy primary, golden sand accent, warm-white background
// Dark: dark navy surfaces, golden sand primary (web dark mode pattern)

const colors = {
  light: {
    text: '#072745',
    tint: '#0B3C6A',
    background: '#FAFAF8',
    foreground: '#072745',
    card: '#FFFFFF',
    cardForeground: '#072745',
    primary: '#0B3C6A',        // Deep Ocean Blue  hsl(209 81% 23%)
    primaryForeground: '#FFFFFF',
    secondary: '#00B3D6',      // Turquoise         hsl(190 100% 42%)
    secondaryForeground: '#FFFFFF',
    muted: '#F0F4F8',          // hsl(210 20% 96%)
    mutedForeground: '#526270', // hsl(210 20% 40%)
    accent: '#F4A362',         // Golden Sand       hsl(27 87% 67%)
    accentForeground: '#072745',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#D0DAE8',         // hsl(210 20% 90%)
    input: '#D0DAE8',
  },
  dark: {
    text: '#FAFAF8',
    tint: '#F4A362',
    background: '#0A1629',     // hsl(216 60% 10%)
    foreground: '#FAFAF8',
    card: '#132239',           // hsl(216 50% 15%)
    cardForeground: '#FAFAF8',
    primary: '#F4A362',        // Golden Sand as primary in dark (matches web dark)
    primaryForeground: '#0A1629',
    secondary: '#00B3D6',
    secondaryForeground: '#0A1629',
    muted: '#172742',          // hsl(216 50% 20%)
    mutedForeground: '#8EA8C0', // hsl(216 20% 70%)
    accent: '#0B3C6A',
    accentForeground: '#FAFAF8',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#203960',         // hsl(216 50% 25%)
    input: '#203960',
  },
  radius: 12,
};

export default colors;
