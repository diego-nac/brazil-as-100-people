import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Specify the dimensions of the chart.
const width = window.innerWidth * 0.6;
const height = window.innerHeight;
const center = [width / 2, height / 2];

// Specify the color scale.
const color = d3.scaleOrdinal(
  [0, 1, 2, 3, 4],
  ["brown", "white", "black", "yellow", "red"]
);

let filldata = function () {
  return [...Array(100).keys()];
};

let labels = ["Parda", "Branca", "Preta", "Amarela", "Indigena"];
let percentile = [45, 43, 10, 1, 1];

let group = 0;
let index = 1;
let nodes = filldata().map((d, i) => {
  if (index > percentile[group]) {
    group++;
    index = 1;
  }
  index++;
  return {
    id: d,
    group: group,
    label: labels[group],
  };
});

function getGroupCenter(group) {

}

const simulation = d3
  .forceSimulation(nodes)
  .force("collision", d3.forceCollide().radius(7))
  .force(
    "x",
    d3.forceX((d) => width * 0.1 + d.group * width * 0.2).strength(0.05)
  )
  // we can blind align the y axis to 0 so that things are single file
  .force("y", d3.forceY(height * 0.5).strength(0.05))
  .on("tick", ticked);

// Initialize the nodes positions
for (const node of nodes) { 
  node.x = node.x * 5 + (width * 0.1 + node.group * width * 0.2);
  node.y = node.y * 5 + center[1];
}

// Create the SVG container.
const svg = d3.select("svg");
// .create("svg")
// .attr("width", width)
// .attr("height", height)
// .attr("viewBox", [0, 0, width, height])
// .attr("style", "max-width: 100%; height: auto; background-color: grey;");

const node = svg
  .append("g")
  .attr("stroke", "#000")
  .attr("stroke-width", 1.5)
  .selectAll("circle") 
  .data(nodes)
  .join("circle")
  .attr("r", 6)
  .attr("fill", (d) => color(d.group));

const labelsRender = svg
  .selectAll("text")
  .data(labels)
  .enter()
  .append("text")
  .text((d, i) => d)
  .attr("x", (d, i) => width * 0.1 + i * width * 0.2)
  .attr("y", height * 0.5 + 100)
  .attr("text-anchor", "middle");

// // Add a drag behavior.
node.call(
  d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
);

function ticked() {
  node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
}

// Reheat the simulation when drag starts, and fix the subject position.
function dragstarted(event) {
  if (!event.active) simulation.alphaTarget(0.5).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

// Update the subject (dragged node) position during drag.
function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

// Restore the target alpha so the simulation cools after dragging ends.
// Unfix the subject position now that it’s no longer being dragged.
function dragended(event) {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}
