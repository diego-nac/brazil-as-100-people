// scripts/settings.js
const SETTINGS = {
  dims: { widthFactor: 0.6, heightFactor: 1 },
  colorScheme: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854"],
  node: { radius: 7, stroke: "#fff", strokeWidth: 1 },
  forces: {
    collideRadius: 7,
    collideStrength: 1,
    xStrength: 0.05,
    yStrength: 0.05,
    alphaDecay: 0.02,
    velocityDecay: 0.35,
    dragAlphaTarget: 2,
  },
  labelYOffset: 100,
};
export default SETTINGS;
