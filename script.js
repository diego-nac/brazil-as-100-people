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

const raceData = [
  {
    label: "Parda",
    percentile: 45,
    color: "brown",
  },
  {
    label: "Branca",
    percentile: 43,
    color: "white",
  },
  {
    label: "Preta",
    percentile: 10,
    color: "black",
  },
  {
    label: "Amarela",
    percentile: 1,
    color: "yellow",
  },
  {
    label: "Indígena",
    percentile: 1,
    color: "red",
  },
];

const genderData = [
  {
    label: "Homens",
    percentile: 48,
    color: "blue",
  },
  {
    label: "Mulheres",
    percentile: 52,
    color: "pink",
  },
];

const simulation = d3
  .forceSimulation(nodes)
  .force("collision", d3.forceCollide().radius(7))
  .force(
    "x",
    d3.forceX((d) => width * 0.1 + d.group * width * 0.2).strength(0.05)
  )
  // we can blind align the y axis to 0 so that things are single file
  .force("y", d3.forceY(height * 0.5).strength(0.05))
  .alphaTarget(0.3)
  .on("tick", ticked);

// Initialize the nodes positions
for (const node of nodes) {
  node.x = node.x * 5 + (width * 0.1 + node.group * width * 0.2);
  node.y = node.y * 5 + center[1];
}

function Update(data) {
  let index = 1;
  let group = 0;
  for (const node of nodes) {
    if (index > data[group].percentile) {
      group++;
      index = 1;
    }
    node.group = group;

    index++;
  }

  let padding = width * 0.1;
  let space = (width * 0.8) / (group + 1);

  const t = d3.transition().duration(500).ease(d3.easePolyOut);
  nodesRender.transition(t).style("fill", (d) => data[d.group].color);

  labels = data.flatMap((d) => d.label);
  svg
    .selectAll("text")
    .data(labels)
    .join(
      (enter) => enter.append("text").attr("y", height * 0.5 + 100).attr("x", width / 2),
      (update) => update,

      (exit) => exit.remove()
    )
    .text((d) => d)
    .transition(t)
    .attr("x", (d, i) => padding + space / 2 + space * i);
  // console.log(labels);
  // labelsRender
  //   .data(labels)
  //   .join("text")
  //   .text((d) => d)
  //   .transition(t)
  //   .attr("x", (d, i) => padding + space / 2 + space * i);

  simulation
    .force(
      "x",
      d3.forceX((d) => padding + space / 2 + space * d.group).strength(0.05)
    )
    .alpha(1)
    .restart();
}

// Create the SVG container.
const svg = d3.select("svg");

const nodesRender = svg
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
  .join("text")
  .text((d, i) => d)
  .attr("x", (d, i) => width * 0.1 + i * width * 0.2)
  .attr("y", height * 0.5 + 100)
  .attr("text-anchor", "middle");

// // Add a drag behavior.
nodesRender.call(
  d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
);

function ticked() {
  nodesRender.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
}

// Reheat the simulation when drag starts, and fix the subject position.
function dragstarted(event) {
  // if (!event.active) simulation.alphaTarget(0.5).restart();
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
  // if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}

const waypoint1 = new Waypoint({
  element: document.getElementById("text-container-1"),
  handler: (direction) => (direction == "up" ? Update(raceData) : null),
  offset: "-50%",
});

const waypoint2 = new Waypoint({
  element: document.getElementById("text-container-2"),
  handler: (direction) => (direction == "down" ? Update(genderData) : null),
  offset: "50%",
});
