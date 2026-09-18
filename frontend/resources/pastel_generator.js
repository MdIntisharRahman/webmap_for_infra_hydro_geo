// Procedural Pastel Palette Generator
const getPastelColor = (index) => {
  const hue = (index * 137.508) % 360; // Golden angle dispersion
  return `hsl(${hue}, 70%, 85%)`; // High lightness and moderate saturation = pastel
};

const assignColors = (strata) => {
  const colorMap = {};
  let colorIndex = 0;
  
  strata.forEach(layer => {
    if (!colorMap[layer.class]) {
      colorMap[layer.class] = getPastelColor(colorIndex++);
    }
  });
  return colorMap;
};