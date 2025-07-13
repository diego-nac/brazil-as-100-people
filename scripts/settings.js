const SETTINGS = {
    raceLabels: ["Parda", "Branca", "Preta", "Amarela", "Indígena"],
    raceColors: ["#e6a77a", "#d9d9d9", "#634e3f", "#f2d670", "#c76b5d"],
    ageLabels: ["0-14", "15-29", "30-49", "50-69", "70+"],
    ageColors: ["#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
    literacyColors: ["#5ab4ac", "#a9a9a9"],
    literacyByAge: {
        labels: ["15-29\nAlfabetizados", "30-49\nAlfabetizados", "50-69\nAlfabetizados", "70+\nAlfabetizados"],
        colors: {
            alphabetized: "#5ab4ac",
            notAlphabetized: "#a9a9a9"
        },
        percentages: [98, 95, 87, 68]
    },
    node: {
        radius: 8,
        stroke: "rgba(255,255,255,0.8)",
        strokeWidth: 1
    },
    forces: {
        collideRadius: 10,
        collideStrength: 1,
        xStrength: 0.1,
        yStrength: 0.1,
        alphaDecay: 0.0228,
        velocityDecay: 0.4
    }
};
export default SETTINGS;