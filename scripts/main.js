// scripts/main.js
import initRaceChart from "./race_chart.js";
import initBarsChart from "./bars_chart.js";
initRaceChart()
  .then((ctx) => initBarsChart(ctx))
  .catch(console.error);
