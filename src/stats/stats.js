import {
	getAllNumbers,
	getDistribution,
	getStatistics,
} from "../utils/storage.js";
import { getChiSquare } from "../utils/stats.js";

let segments = 10;

let chart = null;
let historicalChart = null; // New chart instance for historical data

const formatPercentage = (value) => {
	return `${(value * 100).toFixed(5)}%`;
};

const formatNumber = (value) => {
	return value.toFixed(2);
};

const renderData = async () => {
	// Render Historical Data Chart
	const historicalData = await getAllNumbers();
	renderHistoricalChart(historicalData, segments - 1);

	// Display Distribution Bar Chart
	const distribution = await getDistribution();
	renderBarChart(distribution);

	// Display Basic Statistics
	const {
		average,
		variation,
		total,
		lastWin,
		currentSequenceProbability,
		probabilityAfter10Spins,
		spinsNeededForTargetProbability,
		targetProbability,
	} = await getStatistics(segments);

	document.getElementById("average").textContent = formatNumber(average);
	document.getElementById("variation").textContent =
		`${formatPercentage(variation)}`;
	document.getElementById("total").textContent = total;
	document.getElementById("spins-without-win").textContent = lastWin;
	document.getElementById("current-sequence-probability").textContent =
		formatPercentage(currentSequenceProbability);
	document.getElementById("win-probability-on-next-spin").textContent =
		formatPercentage(1 - currentSequenceProbability);
	document.getElementById("probability-after-10-spins").textContent =
		formatPercentage(probabilityAfter10Spins);
	document.getElementById("target-probability").textContent = formatPercentage(
		1 - targetProbability,
	);
	document.getElementById("target-spins").textContent =
		spinsNeededForTargetProbability;
	document.getElementById("spins-to-get-target-probability").textContent =
		Math.max(0, spinsNeededForTargetProbability - lastWin);

	document.getElementById("win-number").textContent = segments - 1;
	document.getElementById("last-number").textContent =
		historicalData[historicalData.length - 1];

	const shouldBet =
		currentSequenceProbability < targetProbability ||
		lastWin <= 5;
	const decisionTextElement = document.getElementById("bet-decision-text");
	decisionTextElement.setAttribute("data-decision", shouldBet ? "yes" : "no");
	decisionTextElement.textContent = shouldBet ? "Yes" : "No";

	const { chiSquareStatistic, pValue } = await getChiSquare(segments);
	document.getElementById("chi-square").textContent = chiSquareStatistic;
	document.getElementById("p-value").textContent = pValue;

};

document.addEventListener("DOMContentLoaded", renderData);

function renderBarChart(distribution) {
	const ctx = document.getElementById("distributionChart").getContext("2d");
	const labels = Object.keys(distribution).sort((a, b) => a - b);
	const dataValues = labels.map((key) => distribution[key]);

	// Calculate average
	const total = dataValues.reduce((sum, value) => sum + value, 0);
	const average = total / dataValues.length;

	// Define tolerance for "equal" (e.g., within 5% of average)
	const tolerance = 0.05 * average;

	// Assign colors based on comparison with average
	const backgroundColors = dataValues.map((value) => {
		if (value > average + tolerance) {
			return "rgba(75, 192, 192, 0.6)"; // Green
		}
		if (value < average - tolerance) {
			return "rgba(255, 99, 132, 0.6)"; // Red/Orange
		}
		return "rgba(54, 162, 235, 0.6)"; // Blue
	});

	const borderColors = backgroundColors.map((color) => {
		// Modify border colors to match the background without transparency
		const rgba = color.replace(
			/rgba?\((\d+), (\d+), (\d+), [\d.]+\)/,
			"rgba($1, $2, $3, 1)",
		);
		return rgba;
	});

	const data = {
		labels: labels,
		datasets: [
			{
				label: "# of Occurrences",
				data: dataValues,
				backgroundColor: backgroundColors,
				borderColor: borderColors,
				borderWidth: 1,
			},
			{
				label: "Average",
				type: "line",
				data: Array(labels.length).fill(average),
				borderColor: "white",
				borderWidth: 2,
				fill: false,
				pointRadius: 0,
				borderDash: [5, 5], // Dashed line style
			},
		],
	};

	if (chart) {
		chart.data = data;
		chart.update("none");
		return;
	}

	chart = new window.Chart(ctx, {
		type: "bar",
		data,
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true,
					precision: 0,
					// Ensure the average line is visible within the y-axis range
					suggestedMin: Math.min(...dataValues, average) * 0.9,
					suggestedMax: Math.max(...dataValues, average) * 1.1,
				},
			},
			plugins: {
				legend: {
					display: true,
					position: "top",
				},
				tooltip: {
					mode: "index",
					intersect: false,
				},
			},
		},
	});
}

async function renderHistoricalChart(historicalData, targetValue) {
	const ctx = document.getElementById("historicalChart").getContext("2d");

	const binSize = 100; // Group every 100 spins
	const bins = [];

	for (let i = 0; i < historicalData.length; i += binSize) {
		const slice = historicalData.slice(i, i + binSize);
		const winRate =
			slice.filter((entry) => entry === targetValue).length / slice.length;
		bins.push(winRate);
	}

	const data = {
		labels: bins.map(
			(_, index) => `${index * binSize + 1}-${(index + 1) * binSize}`,
		),
		datasets: [
			{
				label: "Win Rate",
				data: bins,
				backgroundColor: "rgba(255, 206, 86, 0.6)",
				borderColor: "rgba(255, 206, 86, 1)",
				borderWidth: 1,
				fill: true,
			},
		],
	};

	if (historicalChart) {
		historicalChart.data = data;
		historicalChart.update("none");
		return;
	}

	historicalChart = new window.Chart(ctx, {
		type: "line",
		data,
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (value) => `${(value * 100).toFixed(2)}%`,
					},
					title: {
						display: true,
						text: "Win Rate",
					},
				},
				x: {
					title: {
						display: true,
						text: "Spin Number",
					},
				},
			},
			plugins: {
				legend: {
					display: true,
					position: "top",
				},
				tooltip: {
					callbacks: {
						label: (context) => `${(context.parsed.y * 100).toFixed(2)}%`,
					},
				},
			},
		},
	});
}

document.getElementById("refresh-btn").addEventListener("click", renderData);
document
	.getElementById("clear-data-btn")
	.addEventListener("click", async () => {
		await chrome.storage.local.clear();
		renderData();
	});

chrome.runtime.onMessage.addListener((message, _sender) => {
	console.log(message);
	if (message.type === "REFRESH_DATA") {
		segments = message.segments;
		renderData();
	}
});
