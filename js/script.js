"use strict";

// VARIABLES -----------------------
const riskChartContext = document.getElementById('riskChart').getContext('2d');

const defaultVector = "SL:1/M:1/O:0/S:2/ED:1/EE:1/A:1/ID:1/LC:2/LI:1/LAV:1/LAC:1/FD:1/RD:1/NC:2/PV:3";

const colors = [
  'rgb(255, 102, 255)',
  'rgb(255, 0, 0)',
  'rgb(255, 169, 0)',
  'rgb(255, 255, 0)',
  'rgb(144, 238, 144)'
];

const threatCatColors = [
  'rgb(60, 177, 119)',
  'rgb(226, 100, 142)',
  'rgb(100, 112, 226)',
  'rgb(226, 161, 100)'
];

const backgrounds = [
  'rgba(255, 102, 255, 0.5)',
  'rgba(255, 0, 0, 0.5)',
  'rgba(255, 169, 0, 0.5)',
  'rgba(255, 255, 0, 0.5)',
  'rgba(144, 238, 144, 0.5)'
];

const threats = [
  "Skills required", "Motive", "Opportunity", "Population Size",
  "Ease of Discovery", "Ease of Exploit", "Awareness", "Intrusion Detection",
  "Loss of confidentiality", "Loss of Integrity", "Loss of Availability", "Loss of Accountability",
  "Financial damage", "Reputation damage", "Non-Compliance", "Privacy violation"
];

const partials = ["sl", "m", "o", "s", "ed", "ee", "a", "id", "lc", "li", "lav", "lac", "fd", "rd", "nc", "pv"];

const riskChartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  title: {
    display: false,
    text: 'Chart.js Radar Chart'
  },
  scales: {
    r: {
      angleLines: {
        lineWidth: 2
      },
      beginAtZero: true,
      suggestedMin: 0,
      suggestedMax: 10
    }
  }
};

// Initialize the radar chart
let riskChart = new Chart(riskChartContext, {
  type: 'radar',
  data: {
    labels: [],
    datasets: [{
      data: [],
      pointBackgroundColor: "",
      backgroundColor: "",
      borderColor: "",
      borderWidth: 2
    }]
  },
  options: riskChartOptions
});

// Load vectors if present in the URL
const vectorParam = getUrlParameter('vector');
if (vectorParam) {
  loadVectors(vectorParam);
} else {
  loadVectors(defaultVector);
}

// FUNCTIONS -----------------------

// Load vectors from the URL parameter
function loadVectors(vector) {
  vector = vector.replace('(', '').replace(')', '');
  const values = vector.split('/');

  if (values.length === partials.length) {
    values.forEach((value, index) => {
      const [, vectorValue] = value.split(':');
      $(`#${partials[index].toLowerCase()}`).val(vectorValue);
    });
  } else {
    swal("Hey!!", "The vector is not correct, make sure you have copied correctly", "error");
  }

  calculate();
}

// Calculate scores and update the UI
function calculate() {
  const likelihoodScore = calculateScore(partials.slice(0, 8));
  const impactScore = calculateScore(partials.slice(8));

  const likelihoodRisk = getRisk(likelihoodScore);
  const impactRisk = getRisk(impactScore);

  updateScoreDisplay(".LS", likelihoodScore, likelihoodRisk);
  updateScoreDisplay(".IS", impactScore, impactRisk);

  const riskSeverity = getCriticality(likelihoodRisk, impactRisk);
  updateRiskSeverityDisplay(riskSeverity);

  const dataset = partials.map(partial => $(`#${partial}`).val());
  updateRiskChart(dataset, riskSeverity);

  const scoreVector = generateScoreVector();
  $('#score').text(scoreVector);
  $("#score").attr("href", `./index.html?vector=${scoreVector}`);
}

// Calculate the average score for a set of inputs
function calculateScore(factors) {
  const total = factors.reduce((sum, factor) => sum + +$(`#${factor}`).val(), 0);
  return (total / factors.length).toFixed(3);
}

// Update the score display with the calculated value and risk level
function updateScoreDisplay(selector, score, riskLevel) {
  const classMap = {
    "LOW": "classGreen",
    "MEDIUM": "classYellow",
    "HIGH": "classRed"
  };
  $(selector)
    .text(`${score} ${riskLevel}`)
    .removeClass(Object.values(classMap).join(' '))
    .addClass(classMap[riskLevel] || "classGreen");
}

// Update the risk severity display
function updateRiskSeverityDisplay(severity) {
  const classMap = {
    "NOTE": "classGreen",
    "LOW": "classYellow",
    "MEDIUM": "classOrange",
    "HIGH": "classRed",
    "CRITICAL": "classPink"
  };
  $(".RS")
    .text(severity)
    .removeClass(Object.values(classMap).join(' '))
    .addClass(classMap[severity] || "classGreen");
}

// Generate the score vector string
function generateScoreVector() {
  return `(${partials.map(partial => `${partial.toUpperCase()}:${$(`#${partial}`).val()}`).join('/')})`;
}

// Determine the risk level based on the score
function getRisk(score) {
  if (score < 3) return 'LOW';
  if (score < 6) return 'MEDIUM';
  return 'HIGH';
}

// Determine the final risk severity based on likelihood and impact
function getCriticality(likelihood, impact) {
  if (likelihood === "LOW" && impact === "LOW") return 'NOTE';
  if ((likelihood === "LOW" && impact === "MEDIUM") || (likelihood === "MEDIUM" && impact === "LOW")) return 'LOW';
  if ((likelihood === "LOW" && impact === "HIGH") || (likelihood === "MEDIUM" && impact === "MEDIUM") || (likelihood === "HIGH" && impact === "LOW")) return 'MEDIUM';
  if ((likelihood === "HIGH" && impact === "MEDIUM") || (likelihood === "MEDIUM" && impact === "HIGH")) return 'HIGH';
  if (likelihood === "HIGH" && impact === "HIGH") return 'CRITICAL';
  return 'NOTE';
}

// Get a URL parameter by name
function getUrlParameter(name) {
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(location.search);
  return results ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : '';
}

// Update the radar chart with new data
function updateRiskChart(dataset, riskSeverity) {
  const severityIndex = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "NOTE": 4
  }[riskSeverity] || 4;

  // Map dataset to colors based on threat categories
  const pointColors = threats.map((_, index) => {
    const categoryIndex = Math.floor(index / 4); // Calculate category index
    return threatCatColors[categoryIndex] || "rgba(0, 0, 0)";
  });

  riskChart.data.labels = threats;
  riskChart.data.datasets[0].data = dataset;
  riskChart.data.datasets[0].pointBackgroundColor = colors[severityIndex];
  riskChart.data.datasets[0].backgroundColor = backgrounds[severityIndex];
  riskChart.data.datasets[0].borderColor = colors[severityIndex];

  riskChart.options.scales.r.angleLines.color = pointColors;


  riskChart.update();
}

// Copy the vector link to the clipboard
function copyToClipboard() {
  const scoreElement = document.getElementById("score");
  navigator.clipboard.writeText(scoreElement.href)
    .then(() => {
      alert("Vector link copied to clipboard!");
    })
    .catch(err => {
      console.error("Failed to copy text: ", err);
    });
}

let currentLanguage = "en";
let translations = {};

document.addEventListener("DOMContentLoaded", () => {
  // Load translations
  fetch("localization.json")
    .then(response => response.json())
    .then(data => {
      translations = data;
      updateLocalization();
    });
});

function changeLanguage() {
  const languageSelector = document.getElementById("language");
  currentLanguage = languageSelector.value;
  updateLocalization();
}

function updateLocalization() {
  document
    // Find all elements that have the key attribute
    .querySelectorAll("[data-i18n-key]")
    .forEach(element => {
      const key = element.getAttribute("data-i18n-key");
      const translation = translations[currentLanguage][key];
      element.innerText = translation;
    });
}

function copyMarkdownScore() {
  // Get scores and risks from the UI
  const likelihoodText = $(".LS").text().trim(); // e.g. "2.000 LOW"
  const impactText = $(".IS").text().trim();     // e.g. "2.500 LOW"
  const severityText = $(".RS").text().trim();   // e.g. "NOTE"
  const scoreLink = $("#score").attr("href");

  // Format as Markdown
  const markdown = `${likelihoodText.padEnd(15)}| ${impactText.padEnd(10)}| [${severityText}](${scoreLink})`;

  // Copy to clipboard
  navigator.clipboard.writeText(markdown)
    .then(() => {
      alert("Markdown score copied to clipboard!");
    })
    .catch(err => {
      console.error("Failed to copy markdown: ", err);
    });
}
