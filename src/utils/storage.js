// utils/storage.js

// Store a new number
async function storeNumber(number) {
	const { numbers, distribution } = await getData();

	// Update numbers array
	numbers.push(number);
	// Update distribution
	if (distribution[number] !== undefined) {
		distribution[number] += 1;
	} else {
		distribution[number] = 1;
	}

	// Save updated data
	chrome.storage.local.set({ numbers, distribution });
}

// Retrieve last N numbers
async function getLastNumbers(n) {
	const data = await getData();
	return data.numbers.slice(-n).reverse();
}

// Retrieve distribution
async function getDistribution() {
	const data = await getData();
	return data.distribution;
}

// Retrieve statistics
async function getStatistics(segments) {
	const WIN_NUMBER = segments - 1;

	const data = await getData();
	const numbers = data.numbers;
	const total = numbers.length;
	if (total === 0) return { average: 0, variation: 0 };

	const sum = numbers.reduce((a, b) => a + b, 0);
	const average = sum / total;

	const variance = numbers.reduce((a, b) => a + (b - average) ** 2, 0) / total;
	const variation = (Math.sqrt(variance) / average) * 100;

	const lastWinIndex = numbers.lastIndexOf(WIN_NUMBER);
	const lastWin = lastWinIndex === -1 ? total : total - lastWinIndex - 1;

	// the probability of this sequence happening
	// let
	const basePropability = 1 / segments;
	const probabilityOfOpposite = 1 - basePropability;
	const currentSequenceProbability = probabilityOfOpposite ** lastWin;
	const probabilityAfter10Spins = probabilityOfOpposite ** (lastWin + 10);

	const targetProbability = 0.01;
	const spinsNeededForTargetProbability = Math.ceil(
		Math.log(targetProbability) / Math.log(probabilityOfOpposite),
	);

	return {
		average,
		variation,
		total,
		lastWin,
		currentSequenceProbability,
		probabilityAfter10Spins,
		spinsNeededForTargetProbability,
		targetProbability,
	};
}

// Retrieve all numbers
async function getAllNumbers() {
	const data = await getData();
	return data.numbers;
}

// Helper to get all data
async function getData() {
	const result = await chrome.storage.local.get(["numbers", "distribution"]);
	return {
		numbers: result.numbers || [],
		distribution: result.distribution || {},
	};
}

// make sure that we are inside ESM
export {
	storeNumber,
	getLastNumbers,
	getDistribution,
	getStatistics,
	getAllNumbers,
};
