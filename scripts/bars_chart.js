import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import SETTINGS from "./settings.js";

export default function initBarsChart({ nodes, color, labels, totals }) {

  /* ------------------------------------------------------------------
   * 1. cria o segundo SVG e escalas
   * ----------------------------------------------------------------*/
  const svg    = d3.select("#bars-svg");
  const width  = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  // escala de banda para 5 grupos
  const xBand  = d3.scaleBand()
                   .domain(d3.range(labels.length))
                   .range([width * 0.1, width * 0.9])
                   .paddingInner(0.3);

  // altura de cada pilha = 100 círculos → empilhamento vertical
  const yStep = height * 0.7 / 100;

  // posição-alvo de cada nó no bar-chart
  nodes.forEach(n => {
    const g = n.group;                // 0…4
    const idxInside = n.barIndex = (n.barIndex ?? 0) + 1; // 1…?
    n.targetX = xBand(g) + xBand.bandwidth() / 2;
    n.targetY = height * 0.85 - idxInside * yStep;
  });

  // copia os círculos visuais pro novo svg (mesmo <circle>, novo ownerSVG)
  const circles = d3.select("#race-svg")
                    .selectAll("circle")
                    .each(function () {
                      svg.node().appendChild(this);
                    });

  /* ------------------------------------------------------------------
   * 2. IntersectionObserver → dispara transição
   * ----------------------------------------------------------------*/
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) runTransition();
    });
  }, { threshold: 0.6 });

  observer.observe(document.getElementById("scroll-sentinel"));

  function runTransition() {
    observer.disconnect(); // garante que roda só uma vez

    circles.transition()
      .duration(1200)
      .ease(d3.easeCubicInOut)
      .attr("cx", d => d.targetX)
      .attr("cy", d => d.targetY)
      .attr("fill", d => d3.color(color(d.group)).darker(0.6)) // nova cor
      .attr("r",   SETTINGS.node.radius * 1.3)                  // maior
      .attr("stroke-width", 0)
      .attrTween("symbol", function (d) {                       // muda forma
        const symbol = d3.symbol()
                         .type(d3[`symbol${["Circle","Square","Triangle","Diamond","Cross"][d.group]}`])
                         .size(Math.PI * Math.pow(SETTINGS.node.radius*1.3,2));
        return () => symbol();
      });
  }

  /* ------------------------------------------------------------------
   * 3. labels de eixo x
   * ----------------------------------------------------------------*/
  svg.selectAll("text.bar-label")
     .data(labels)
     .join("text")
     .attr("class", "bar-label")
     .attr("x", (_,i) => xBand(i) + xBand.bandwidth()/2)
     .attr("y", height * 0.9)
     .attr("text-anchor", "middle")
     .text(d => d);
}
