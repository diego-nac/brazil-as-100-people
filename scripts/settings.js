const SETTINGS = {
    dims: {
        widthFactor: 0.55,
        heightFactor: 1
    },
    raceColors: ["#8E7C68", "#E6D7C2", "#40342A", "#F2E279", "#A64A39"],
    raceLabels: ["Parda", "Branca", "Preta", "Amarela", "Indígena"],
    ageColors: ["#a1d99b", "#74c476", "#41ab5d", "#238b45", "#005a32"],
    ageLabels: ["0-14", "15-29", "30-49", "50-69", "70+"],
    literacyColor: "#d9d9d9",
    node: {
        radius: 6,
        stroke: "#fff",
        strokeWidth: 0.5
    },
    forces: {
        collideRadius: 7,
        collideStrength: 0.8,
        xStrength: 0.08,
        yStrength: 0.08,
        alphaDecay: 0.02,
        velocityDecay: 0.4
    }
};
export default SETTINGS;