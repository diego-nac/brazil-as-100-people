import initRaceChart from "./race_chart.js";
import initBarsChart from "./bars_chart.js";

initRaceChart()
  .then(ctx => initBarsChart(ctx))   // ctx = { nodes, color, labels, totals }
  .catch(console.error);
