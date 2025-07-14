import SETTINGS from "./settings.js";

const d3Viz = d3.select("#d3-viz");
let sharedD3 = {};

/**
 * NOVO: Função para posicionar os nós aleatoriamente dentro de um polígono GeoJSON.
 * Esta função é genérica e funciona para qualquer polígono fornecido.
 * @param {Array} nodes - O array de nós (os 100 pontos).
 * @param {object} geoData - O objeto GeoJSON carregado com as bordas do polígono.
 * @param {number} width - A largura do contêiner SVG.
 * @param {number} height - A altura do contêiner SVG.
 */
function assignInitialPositions(nodes, geoData, width, height) {
    // 1. Cria uma projeção D3 que escala e centraliza o GeoJSON para caber na área de visualização.
    const projection = d3.geoMercator().fitSize([width * 0.9, height * 0.9], geoData); // Usamos 90% para ter uma margem

    // 2. Obtém os limites geográficos (bounding box) do polígono para otimizar a geração de pontos.
    const bounds = d3.geoBounds(geoData);

    nodes.forEach(node => {
        let point, lon, lat;
        // 3. Loop: continua gerando pontos até encontrar um que esteja DENTRO do polígono.
        while (true) {
            // Gera coordenadas de longitude e latitude aleatórias dentro dos limites do polígono.
            lon = (Math.random() * (bounds[1][0] - bounds[0][0])) + bounds[0][0];
            lat = (Math.random() * (bounds[1][1] - bounds[0][1])) + bounds[0][1];
            
            // 4. A MÁGICA: d3.geoContains verifica se as coordenadas [lon, lat] estão contidas no polígono.
            if (d3.geoContains(geoData, [lon, lat])) {
                // 5. Se o ponto for válido, converte as coordenadas geográficas para coordenadas de tela (pixels x, y).
                point = projection([lon, lat]);
                node.initialX = point[0] + (width * 0.05); // Ajusta para a margem de 90%
                node.initialY = point[1] + (height * 0.05);
                break; // Encontrou um ponto válido, sai do loop.
            }
        }
    });
}

// A função processData permanece exatamente a mesma.
function processData(data) {
    const totals = { race: new Array(5).fill(0), age: new Array(5).fill(0), literacy: [0, 0] };
    data.forEach(d => {
        totals.race[0] += d.raca_parda;
        totals.race[1] += d.raca_branca;
        totals.race[2] += d.raca_preta;
        totals.race[3] += d.raca_amarela;
        totals.race[4] += d.raca_indigena;
        const age_0_14 = d.idade_0_4 + d.idade_5_9 + d.idade_10_14;
        const age_15_29 = d.idade_15_19 + d.idade_20_24 + d.idade_25_29;
        const age_30_49 = d.idade_30_39 + d.idade_40_49;
        const age_50_69 = d.idade_50_59 + d.idade_60_69;
        const totalLiterate = d.alfabetizadas_15_19 + d.alfabetizadas_20_24 + d.alfabetizadas_25_29 + d.alfabetizadas_30_34 + d.alfabetizadas_35_39 + d.alfabetizadas_40_44 + d.alfabetizadas_45_49 + d.alfabetizadas_50_54 + d.alfabetizadas_55_59 + d.alfabetizadas_60_64 + d.alfabetizadas_65_69 + d.alfabetizadas_70_79 + d.alfabetizadas_80_plus;
        const totalPop15Plus = age_15_29 + age_30_49 + age_50_69 + d.idade_70_plus;
        totals.age[0] += age_0_14;
        totals.age[1] += age_15_29;
        totals.age[2] += age_30_49;
        totals.age[3] += age_50_69;
        totals.age[4] += d.idade_70_plus;
        totals.literacy[0] += totalLiterate;
        totals.literacy[1] += (totalPop15Plus - totalLiterate);
    });
    const percentages = {
        race: totals.race.map(v => v / d3.sum(totals.race) * 100),
        age: totals.age.map(v => v / d3.sum(totals.age) * 100),
        literacy: totals.literacy.map(v => v / d3.sum(totals.literacy) * 100)
    };
    const adjustAndRoundTo100 = (percentages) => {
        let rounded = percentages.map(Math.round);
        percentages.forEach((p, i) => { if (p > 0 && rounded[i] === 0) { rounded[i] = 1; } });
        let currentSum = d3.sum(rounded);
        while (currentSum !== 100) {
            let idx = currentSum > 100 ? rounded.indexOf(d3.max(rounded)) : rounded.indexOf(d3.min(rounded));
            rounded[idx] += currentSum > 100 ? -1 : 1;
            currentSum = d3.sum(rounded);
        }
        return rounded;
    };
    const finalCounts = {
        race: adjustAndRoundTo100(percentages.race),
        age: adjustAndRoundTo100(percentages.age),
        literacy: adjustAndRoundTo100(percentages.literacy)
    };
    const nodes = d3.range(100).map(id => ({ id }));
    let r_i = 0, a_i = 0, l_i = 0;
    let race_idx = 0, age_idx = 0, literacy_idx = 0;
    nodes.forEach(n => {
        if (race_idx >= finalCounts.race[r_i]) { r_i++; race_idx = 0; }
        n.raceGroup = r_i; race_idx++;
        if (age_idx >= finalCounts.age[a_i]) { a_i++; age_idx = 0; }
        n.ageGroup = a_i; age_idx++;
        if (literacy_idx >= finalCounts.literacy[l_i]) { l_i++; literacy_idx = 0; }
        n.literacyGroup = l_i; literacy_idx++;
    });
    return { nodes, percentages, finalCounts };
}

function initializeVisualization(nodeData) {
    const width = d3Viz.node().getBoundingClientRect().width;
    const height = d3Viz.node().getBoundingClientRect().height;
    const svg = d3Viz.append("svg").attr("width", width).attr("height", height);

    nodeData.forEach((node) => {
        node.x = node.initialX;
        node.y = node.initialY;
    });

    const simulation = d3.forceSimulation(nodeData)
        .velocityDecay(SETTINGS.forces.velocityDecay)
        .alphaDecay(SETTINGS.forces.alphaDecay)
        .force("collision", d3.forceCollide().radius(SETTINGS.forces.collideRadius).strength(SETTINGS.forces.collideStrength));

    const nodeSelection = svg.append("g").selectAll("circle").data(nodeData).join("circle")
        .attr("r", SETTINGS.node.radius)
        .attr("stroke", SETTINGS.node.stroke)
        .attr("stroke-width", SETTINGS.node.strokeWidth);

    const labelSelection = svg.append("g").selectAll(".group-label");

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x; d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
    }

    nodeSelection.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
    simulation.on("tick", () => nodeSelection.attr("cx", d => d.x).attr("cy", d => d.y));
    sharedD3 = { simulation, nodeSelection, labelSelection, width, height };
}

function updateLabels(labelData) {
    sharedD3.labelSelection = sharedD3.labelSelection
        .data(labelData, d => d.text)
        .join(
            enter => enter.append("text").attr("class", "group-label").attr("x", d => d.x).attr("y", d => d.y).text(d => d.text).attr("opacity", 0).call(enter => enter.transition().duration(800).attr("opacity", 1)),
            update => update.call(update => update.transition().duration(800).attr("x", d => d.x).attr("y", d => d.y).attr("opacity", 1)),
            exit => exit.call(exit => exit.transition().duration(400).attr("opacity", 0).remove())
        )
        .on("mouseover", function (event, d) { d3.select(this).text(`${d.percentage.toFixed(1)}%`).style("font-weight", "bold"); })
        .on("mouseout", function (event, d) { d3.select(this).text(d.text).style("font-weight", "normal"); });
}

function transitionToInitial() {
    sharedD3.simulation
        .force("x", d3.forceX(d => d.initialX).strength(SETTINGS.forces.xStrength))
        .force("y", d3.forceY(d => d.initialY).strength(SETTINGS.forces.yStrength))
        .alpha(1).restart();
    sharedD3.nodeSelection.transition().duration(800).attr("fill", "#cccccc");
    updateLabels([]);
}

function transitionToRace(percentages) {
    const { simulation, nodeSelection, width, height } = sharedD3;
    const raceScale = d3.scalePoint().domain(d3.range(SETTINGS.raceLabels.length)).range([width * 0.15, width * 0.85]);
    simulation
        .force("x", d3.forceX(d => raceScale(d.raceGroup)).strength(SETTINGS.forces.xStrength))
        .force("y", d3.forceY(height / 2).strength(SETTINGS.forces.yStrength))
        .alpha(1).restart();
    nodeSelection.transition().duration(800).attr("fill", d => SETTINGS.raceColors[d.raceGroup]);
    const labelData = SETTINGS.raceLabels.map((text, i) => ({ text, percentage: percentages[i], x: raceScale(i), y: height * 0.25 }));
    updateLabels(labelData);
}

function transitionToAge(percentages) {
    const { simulation, nodeSelection, width, height } = sharedD3;
    const ageScale = d3.scalePoint().domain(d3.range(SETTINGS.ageLabels.length)).range([width * 0.1, width * 0.9]);
    simulation
        .force("x", d3.forceX(d => ageScale(d.ageGroup)).strength(SETTINGS.forces.xStrength))
        .force("y", d3.forceY(height / 2).strength(SETTINGS.forces.yStrength))
        .alpha(1).restart();
    nodeSelection.transition().duration(800).attr("fill", d => SETTINGS.ageColors[d.ageGroup]);
    const labelData = SETTINGS.ageLabels.map((text, i) => ({ text, percentage: percentages[i], x: ageScale(i), y: height * 0.25 }));
    updateLabels(labelData);
}

function transitionToLiteracy(percentages) {
    const { simulation, nodeSelection, width, height } = sharedD3;
    const literacyLabels = ["Alfabetizados", "Não Alfabetizados"];
    simulation
        .force("x", d3.forceX(width / 2).strength(SETTINGS.forces.xStrength))
        .force("y", d3.forceY(height / 2).strength(SETTINGS.forces.yStrength))
        .alpha(1).restart();
    nodeSelection.transition().duration(800).attr("fill", d => SETTINGS.literacyColors[d.literacyGroup]);
    const labelData = literacyLabels.map((text, i) => ({ text, percentage: percentages[i], x: width / 2, y: i === 0 ? height * 0.25 : height * 0.75 }));
    updateLabels(labelData);
}

function setupObserver(processedData) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const step = entry.target.id;
                if (step === 'step-initial') transitionToInitial();
                else if (step === 'step-race') transitionToRace(processedData.percentages.race);
                else if (step === 'step-age') transitionToAge(processedData.percentages.age);
                else if (step === 'step-literacy') transitionToLiteracy(processedData.percentages.literacy);
            }
        });
    }, { threshold: 0.65 });
    document.querySelectorAll('.step').forEach(step => observer.observe(step));
}

// MODIFICADO: Carrega o CSV e o GeoJSON antes de inicializar.
Promise.all([
    d3.csv("data/ibge.csv", d3.autoType),
    d3.json("data/brasil_simple_shape.json") // <<< Certifique-se de que este arquivo existe na pasta 'data'.
]).then(([data, geoData]) => {
    const processedData = processData(data);
    
    const width = d3Viz.node().getBoundingClientRect().width;
    const height = d3Viz.node().getBoundingClientRect().height;

    // Calcula e atribui as posições iniciais dos nós dentro do polígono.
    assignInitialPositions(processedData.nodes, geoData, width, height);
    
    initializeVisualization(processedData.nodes);
    setupObserver(processedData);
    
    transitionToInitial();
}).catch(error => {
    console.error("Erro ao carregar os dados. Verifique se os arquivos 'ibge.csv' e 'simple_polygon.json' estão na pasta 'data'.", error);
});
