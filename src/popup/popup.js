// popup/popup.js

import {
	getLastNumbers,
	getDistribution,
	getStatistics,
} from "../utils/storage.js";

document.addEventListener("DOMContentLoaded", async () => {
	const lastNumbers = await getLastNumbers(5);
	console.log(lastNumbers);
	const numberList = document.getElementById("number-list");
	lastNumbers.forEach((num) => {
		const li = document.createElement("li");
		li.textContent = num;
		numberList.appendChild(li);
	});

	const distribution = await getDistribution();
	renderBarChart(distribution);

	const stats = await getStatistics();
	document.getElementById("average").textContent = stats.average.toFixed(2);
	document.getElementById("variation").textContent =
		`${stats.variation.toFixed(2)}%`;

	// Add navigation functionality
	document.getElementById("open-stats").addEventListener("click", () => {
		chrome.runtime.openOptionsPage();
	});
});

function renderBarChart(distribution) {
	const ctx = document.getElementById("distributionChart").getContext("2d");
	new Chart(ctx, {
		type: "bar",
		data: {
			labels: Object.keys(distribution),
			datasets: [
				{
					label: "# of Occurrences",
					data: Object.values(distribution),
					backgroundColor: "rgba(54, 162, 235, 0.6)",
					borderColor: "rgba(54, 162, 235, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true,
					precision: 0,
				},
			},
		},
	});
}
