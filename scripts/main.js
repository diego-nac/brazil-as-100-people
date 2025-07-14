import SETTINGS from "./settings.js";

const d3Viz = d3.select("#d3-viz");
let sharedD3 = {};

function assignInitialPositions(nodes, geoData, width, height) {
  // AJUSTE: O scaleFactor foi ajustado para 0.9 para melhor visualização e consistência.
  const scaleFactor = 0.3;
  const marginX = (width * (1 - scaleFactor)) / 2;
  const marginY = (height * (1 - scaleFactor)) / 2;

  const projection = d3
    .geoMercator()
    .fitSize([width * scaleFactor, height * scaleFactor], geoData);
  const bounds = d3.geoBounds(geoData);

  let gridPoints = [];
  let step = 3.0;

  while (gridPoints.length < 100) {
    gridPoints = [];
    step *= 0.95;

    if (step < 0.05) {
      console.error("Não foi possível gerar 100 pontos para o grid.");
      nodes.forEach((node) => {
        node.initialX = Math.random() * width;
        node.initialY = Math.random() * height;
      });
      return;
    }

    for (let lat = bounds[1][1]; lat >= bounds[0][1]; lat -= step) {
      for (let lon = bounds[0][0]; lon <= bounds[1][0]; lon += step) {
        if (d3.geoContains(geoData, [lon, lat])) {
          gridPoints.push([lon, lat]);
        }
      }
    }
  }

  function selectEvenly(array, count) {
    const result = [];
    const total = array.length;
    if (total < count) return array;
    const interval = total / count;
    for (let i = 0; i < count; i++) {
      result.push(array[Math.floor(i * interval)]);
    }
    return result;
  }
  const finalGridPoints = selectEvenly(gridPoints, 100);

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  shuffleArray(finalGridPoints);

  nodes.forEach((node, i) => {
    if (finalGridPoints[i]) {
      const point = projection(finalGridPoints[i]);
      node.initialX = point[0] + marginX;
      node.initialY = point[1] + marginY;
    } else {
      node.initialX = width / 2;
      node.initialY = height / 2;
    }
  });
}

function processData(data) {
  const totals = {
    race: new Array(5).fill(0),
    age: new Array(5).fill(0),
    literacy: [0, 0],
    literacyByAge: [0, 0, 0, 0],
  };

  data.forEach((d) => {
    totals.race[0] += d.raca_parda;
    totals.race[1] += d.raca_branca;
    totals.race[2] += d.raca_preta;
    totals.race[3] += d.raca_amarela;
    totals.race[4] += d.raca_indigena;
    const age_0_14 = d.idade_0_4 + d.idade_5_9 + d.idade_10_14;
    const age_15_29 = d.idade_15_19 + d.idade_20_24 + d.idade_25_29;
    const age_30_49 = d.idade_30_39 + d.idade_40_49;
    const age_50_69 = d.idade_50_59 + d.idade_60_69;
    const totalLiterate =
      d.alfabetizadas_15_19 +
      d.alfabetizadas_20_24 +
      d.alfabetizadas_25_29 +
      d.alfabetizadas_30_34 +
      d.alfabetizadas_35_39 +
      d.alfabetizadas_40_44 +
      d.alfabetizadas_45_49 +
      d.alfabetizadas_50_54 +
      d.alfabetizadas_55_59 +
      d.alfabetizadas_60_64 +
      d.alfabetizadas_65_69 +
      d.alfabetizadas_70_79 +
      d.alfabetizadas_80_plus;
    const totalPop15Plus = age_15_29 + age_30_49 + age_50_69 + d.idade_70_plus;
    totals.age[0] += age_0_14;
    totals.age[1] += age_15_29;
    totals.age[2] += age_30_49;
    totals.age[3] += age_50_69;
    totals.age[4] += d.idade_70_plus;
    totals.literacy[0] += totalLiterate;
    totals.literacy[1] += totalPop15Plus - totalLiterate;
    totals.literacyByAge[0] +=
      d.alfabetizadas_15_19 + d.alfabetizadas_20_24 + d.alfabetizadas_25_29;
    totals.literacyByAge[1] +=
      d.alfabetizadas_30_34 +
      d.alfabetizadas_35_39 +
      d.alfabetizadas_40_44 +
      d.alfabetizadas_45_49;
    totals.literacyByAge[2] +=
      d.alfabetizadas_50_54 +
      d.alfabetizadas_55_59 +
      d.alfabetizadas_60_64 +
      d.alfabetizadas_65_69;
    totals.literacyByAge[3] += d.alfabetizadas_70_79 + d.alfabetizadas_80_plus;
  });

  const percentages = {
    race: totals.race.map((v) => (v / d3.sum(totals.race)) * 100),
    age: totals.age.map((v) => (v / d3.sum(totals.age)) * 100),
    literacy: totals.literacy.map((v) => (v / d3.sum(totals.literacy)) * 100),
    literacyByAge: totals.literacyByAge.map(
      (v, i) => (v / totals.age[i + 1]) * 100
    ),
  };

  const adjustAndRoundTo100 = (percentages) => {
    let rounded = percentages.map(Math.round);
    percentages.forEach((p, i) => {
      if (p > 0 && rounded[i] === 0) {
        rounded[i] = 1;
      }
    });
    let currentSum = d3.sum(rounded);
    while (currentSum !== 100) {
      if (currentSum > 100) {
        let maxIndex = rounded.indexOf(d3.max(rounded));
        if (rounded[maxIndex] > 1) {
          rounded[maxIndex]--;
        }
      } else {
        let maxIndex = rounded.indexOf(d3.max(rounded));
        rounded[maxIndex]++;
      }
      currentSum = d3.sum(rounded);
    }
    return rounded;
  };

  const finalCounts = {
    race: adjustAndRoundTo100(percentages.race),
    age: adjustAndRoundTo100(percentages.age),
    literacy: adjustAndRoundTo100(percentages.literacy),
    literacyByAge: adjustAndRoundTo100(percentages.literacyByAge),
  };

  const nodes = d3.range(100).map((id) => ({ id }));

  let r_i = 0,
    a_i = 0,
    l_i = 0,
    lba_i = 0;
  let race_idx = 0,
    age_idx = 0,
    literacy_idx = 0,
    literacy_by_age_idx = 0;
  nodes.forEach((n) => {
    if (race_idx >= finalCounts.race[r_i]) {
      r_i++;
      race_idx = 0;
    }
    n.raceGroup = r_i;
    race_idx++;

    if (age_idx >= finalCounts.age[a_i]) {
      a_i++;
      age_idx = 0;
    }
    n.ageGroup = a_i;
    age_idx++;

    if (literacy_idx >= finalCounts.literacy[l_i]) {
      l_i++;
      literacy_idx = 0;
    }
    n.literacyGroup = l_i;
    literacy_idx++;

    if (literacy_by_age_idx >= finalCounts.literacyByAge[lba_i]) {
      lba_i++;
      literacy_by_age_idx = 0;
    }
    n.literacyByAgeGroup = lba_i;
    n.isLiterate =
      literacy_by_age_idx + 1 < percentages.literacyByAge[lba_i] / 4;
    literacy_by_age_idx++;
  });

  return { nodes, percentages, finalCounts };
}

function initializeVisualization(nodeData, geoData) {
  const width = d3Viz.node().getBoundingClientRect().width;
  const height = d3Viz.node().getBoundingClientRect().height;
  const svg = d3Viz.append("svg").attr("width", width).attr("height", height);

  nodeData.forEach((node) => {
    node.x = node.initialX;
    node.y = node.initialY;
  });

  const simulation = d3
    .forceSimulation(nodeData)
    .velocityDecay(SETTINGS.forces.velocityDecay)
    .alphaDecay(SETTINGS.forces.alphaDecay)
    .force(
      "collision",
      d3
        .forceCollide()
        .radius(SETTINGS.forces.collideRadius)
        .strength(SETTINGS.forces.collideStrength)
    );

  const nodeSelection = svg
    .append("g")
    .selectAll("circle")
    .data(nodeData)
    .join("circle")
    .attr("r", SETTINGS.node.radius)
    .attr("stroke", SETTINGS.node.stroke)
    .attr("stroke-width", SETTINGS.node.strokeWidth);

  const labelSelection = svg.append("g").selectAll(".group-label");

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  nodeSelection.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  const scaleFactor = 0.9;
  const marginX = (width * (1 - scaleFactor)) / 2;
  const marginY = (height * (1 - scaleFactor)) / 2;
  const projection = d3
    .geoMercator()
    .fitSize([width * scaleFactor, height * scaleFactor], geoData);
  function ticked() {
    nodeSelection.each(function (d) {
      const invertedPoint = projection.invert([d.x - marginX, d.y - marginY]);
      if (!d3.geoContains(geoData, invertedPoint)) {
        d.x = d.px || d.x;
        d.y = d.py || d.y;
      }
    });

    nodeSelection.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  }

  simulation.on("tick", ticked);
  sharedD3 = { simulation, nodeSelection, labelSelection, width, height };
}

function updateLabels(labelData) {
  sharedD3.labelSelection = sharedD3.labelSelection
    .data(labelData, (d) => d.text)
    .join(
      (enter) =>
        enter
          .append("text")
          .attr("class", "group-label")
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y)
          .text((d) => d.text)
          .attr("opacity", 0)
          .call((enter) => enter.transition().duration(800).attr("opacity", 1)),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(800)
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("opacity", 1)
        ),
      (exit) =>
        exit.call((exit) =>
          exit.transition().duration(400).attr("opacity", 0).remove()
        )
    )
    .on("mouseover", function (event, d) {
      d3.select(this).text(`${d.percentage.toFixed(1)}%`);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).text(d.text);
    });
}

function transitionToInitial() {
  sharedD3.simulation
    .force(
      "x",
      d3.forceX((d) => d.initialX).strength(SETTINGS.forces.xStrength)
    )
    .force(
      "y",
      d3.forceY((d) => d.initialY).strength(SETTINGS.forces.yStrength)
    )
    .alpha(1)
    .restart();
  sharedD3.nodeSelection.transition().duration(800).attr("fill", "#009E60");
  updateLabels([]);
}

function transitionToRace(percentages) {
  const { simulation, nodeSelection, width, height } = sharedD3;
  const raceScale = d3
    .scalePoint()
    .domain(d3.range(SETTINGS.raceLabels.length))
    .range([width * 0.15, width * 0.85]);
  simulation
    .force(
      "x",
      d3
        .forceX((d) => raceScale(d.raceGroup))
        .strength(SETTINGS.forces.xStrength)
    )
    .force("y", d3.forceY(height / 2).strength(SETTINGS.forces.yStrength))
    .alpha(1)
    .restart();
  nodeSelection
    .transition()
    .duration(800)
    .attr("fill", (d) => SETTINGS.raceColors[d.raceGroup]);
  const labelData = SETTINGS.raceLabels.map((text, i) => ({
    text,
    percentage: percentages[i],
    x: raceScale(i),
    y: height * 0.25,
  }));
  updateLabels(labelData);
}

function transitionToAgePyramid(processedData) {
  const { simulation, nodeSelection, width, height } = sharedD3;
  const counts = processedData.finalCounts.age;
  const pyramidLayout = [];
  const rowHeight = 45;
  const nodeSpacing = SETTINGS.node.radius * 2.5;

  const totalPyramidHeight = (counts.length - 1) * rowHeight;
  let currentY = height / 2 + totalPyramidHeight / 2;

  for (let i = 0; i < counts.length; i++) {
    const numNodes = counts[i];
    const rowWidth = numNodes * nodeSpacing;
    const startX = (width - rowWidth) / 2;
    pyramidLayout.push({
      y: currentY,
      startX: startX,
      count: numNodes,
    });
    currentY -= rowHeight;
  }

  for (let ageGroup = 0; ageGroup < pyramidLayout.length; ageGroup++) {
    const layout = pyramidLayout[ageGroup];
    const nodesInGroup = processedData.nodes.filter(
      (n) => n.ageGroup === ageGroup
    );
    for (let i = 0; i < nodesInGroup.length; i++) {
      nodesInGroup[i].targetX = layout.startX + i * nodeSpacing;
      nodesInGroup[i].targetY = layout.y;
    }
  }

  simulation
    .force("x", d3.forceX((d) => d.targetX).strength(SETTINGS.forces.xStrength))
    .force("y", d3.forceY((d) => d.targetY).strength(SETTINGS.forces.yStrength))
    .alpha(1)
    .restart();

  nodeSelection
    .transition()
    .duration(800)
    .attr("fill", (d) => SETTINGS.ageColors[d.ageGroup]);

  const labelData = SETTINGS.ageLabels.map((text, i) => ({
    text: text,
    percentage: processedData.percentages.age[i],
    x: width - 70,
    y: pyramidLayout[i].y,
  }));
  updateLabels(labelData);
}

function transitionToLiteracy(percentages) {
  const { simulation, nodeSelection, width, height } = sharedD3;
  const literacyLabels = ["Alfabetizados", "Não Alfabetizados"];
  simulation
    .force("x", d3.forceX(width / 2).strength(SETTINGS.forces.xStrength))
    .force("y", d3.forceY(height / 2).strength(SETTINGS.forces.yStrength))
    .alpha(1)
    .restart();
  nodeSelection
    .transition()
    .duration(800)
    .attr("fill", (d) => SETTINGS.literacyColors[d.literacyGroup]);
  const labelData = literacyLabels.map((text, i) => ({
    text,
    percentage: percentages[i],
    x: width / 2,
    y: i === 0 ? height * 0.25 : height * 0.75,
  }));
  updateLabels(labelData);
}

function transitionToLiteracyByAge(percentages) {
  const { simulation, nodeSelection, width, height } = sharedD3;
  const literacyLabels = SETTINGS.literacyByAge.labels;
  const ageScale = d3
    .scalePoint()
    .domain(d3.range(literacyLabels.length))
    .range([width * 0.1, width * 0.9]);
  simulation
    .force(
      "x",
      d3
        .forceX((d) => ageScale(d.literacyByAgeGroup))
        .strength(SETTINGS.forces.xStrength)
    )
    .force("y", d3.forceY(height / 2).strength(SETTINGS.forces.yStrength))
    .alpha(1)
    .restart();
  nodeSelection
    .transition()
    .duration(800)
    .attr("fill", (d) => SETTINGS.literacyColors[d.isLiterate ? 0 : 1]);
  const labelData = literacyLabels.map((text, i) => ({
    text,
    percentage: percentages[i],
    x: ageScale(i),
    y: height * 0.25,
  }));
  updateLabels(labelData);
}

function setupObserver(processedData) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const step = entry.target.id;
          switch (step) {
            case "step-initial":
              return transitionToInitial();
            case "step-race":
              return transitionToRace(processedData.percentages.race);
            case "step-age":
              return transitionToAge(processedData.percentages.age);
            case "step-age-pyramid":
              return transitionToAgePyramid(processedData);
            case "step-literacy":
              return transitionToLiteracy(processedData.percentages.literacy);
            case "step-literacy-age":
              return transitionToLiteracyByAge(
                processedData.percentages.literacyByAge
              );
          }
        }
      });
    },
    { threshold: 0.65 }
  );
  document.querySelectorAll(".step").forEach((step) => observer.observe(step));
}

Promise.all([
  d3.csv("data/ibge.csv", d3.autoType),
  d3.json("data/brasil_simple_shape.json"),
])
  .then(([data, geoData]) => {
    const processedData = processData(data);
    const width = d3Viz.node().getBoundingClientRect().width;
    const height = d3Viz.node().getBoundingClientRect().height;

    assignInitialPositions(processedData.nodes, geoData, width, height);
    initializeVisualization(processedData.nodes, geoData);
    setupObserver(processedData);
    transitionToInitial();
  })
  .catch((error) => {
    console.error(
      "Erro ao carregar os dados. Verifique se os arquivos 'ibge.csv' e 'brasil_simple_shape.json' estão na pasta 'data'.",
      error
    );
  });
