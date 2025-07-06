import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = window.innerWidth * 0.6;
const height = window.innerHeight;
const center = [width / 2, height / 2];

const color = d3.scaleOrdinal(
  [0, 1, 2, 3, 4],
  ["brown", "white", "black", "yellow", "red"]
);

const labels = ["Parda", "Branca", "Preta", "Amarela", "Indigena"];
const campos = ["raca_parda", "raca_branca", "raca_preta", "raca_amarela", "raca_indigena"];

const svg = d3.select("svg");

d3.csv("data/ibge.csv", d3.autoType).then((data) => {
  let totais = [0, 0, 0, 0, 0];
  data.forEach((d) => {
    campos.forEach((campo, i) => {
      totais[i] += d[campo];
    });
  });

  const totalPopulacao = d3.sum(totais);
  const percentual = totais.map((v) => Math.round((v / totalPopulacao) * 100));

  // Garante que soma = 100 (ajuste de arredondamento)
  let somaPercentual = d3.sum(percentual);
  while (somaPercentual < 100) {
    const i = percentual.indexOf(d3.max(percentual));
    percentual[i]++;
    somaPercentual++;
  }
  while (somaPercentual > 100) {
    const i = percentual.indexOf(d3.max(percentual));
    percentual[i]--;
    somaPercentual--;
  }

  // Cria 100 nós baseados nos percentuais
  let group = 0;
  let index = 1;
  let nodes = d3.range(100).map((d) => {
    if (index > percentual[group]) {
      group++;
      index = 1;
    }
    index++;
    return {
      id: d,
      group: group,
      label: labels[group]
    };
  });

  const simulation = d3
    .forceSimulation(nodes)
    .force("collision", d3.forceCollide().radius(7))
    .force("x", d3.forceX((d) => width * 0.1 + d.group * width * 0.2).strength(0.05))
    .force("y", d3.forceY(height * 0.5).strength(0.05))
    .on("tick", ticked);

  for (const node of nodes) {
    node.x = node.x * 5 + (width * 0.1 + node.group * width * 0.2);
    node.y = node.y * 5 + center[1];
  }

  const node = svg
    .append("g")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 6)
    .attr("fill", (d) => color(d.group));

  svg
    .selectAll("text")
    .data(labels)
    .enter()
    .append("text")
    .text((d) => d)
    .attr("x", (_, i) => width * 0.1 + i * width * 0.2)
    .attr("y", height * 0.5 + 100)
    .attr("text-anchor", "middle");

  node.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  function ticked() {
    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  }

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.5).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
});
