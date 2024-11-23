import EventEmitter from "node:events";

const WIN_MULTIPLIER = 9.9;
const SEQUENCE_TO_START_BETTING = 44;

const distribution = {
	0: 0,
	1: 0,
	2: 0,
	3: 0,
	4: 0,
	5: 0,
	6: 0,
	7: 0,
	8: 0,
	9: 0,
};

class StrategySimulator extends EventEmitter {
	constructor(options = {}) {
		super();
		this.totalRounds = options.totalRounds || 100000;
		this.betAmount = options.betAmount || 1;
		this.currentPoints = 150;
		this.lossesSinceLastNine = 0;
		this.state = "waiting"; // 'waiting', 'betting', 'continuation'
		this.betsPlaced = 0;
		this.continuationLosses = 0;
		this.statistics = {
			totalRounds: 0,
			wins: 0,
			losses: 0,
			longestLossStreak: 0,
			longestWinStreak: 0,
		};
		this.currentWinStreak = 0;
		this.currentLossStreak = 0;
	}

	getRandomNumbersChunk(size) {
		return Array.from(crypto.getRandomValues(new Uint8ClampedArray(size))).map(
			(rng) => rng % 10,
		);
	}

	run() {
		let playedRounds = 0;
		while (playedRounds < this.totalRounds) {
			const rngs = this.getRandomNumbersChunk(100);
			for (const rng of rngs) {
				this.processRound(rng, playedRounds);
				playedRounds += 1;
			}
			if (this.currentPoints <= 0) {
				break;
			}
		}
		this.emit("end", this.currentPoints, this.statistics);
	}

	processRound(rng, round) {
		this.statistics.totalRounds += 1;
		distribution[rng] += 1;
		if (rng === 9) {
			this.statistics.wins += 1;
			this.currentWinStreak += 1;
			this.statistics.longestWinStreak = Math.max(
				this.statistics.longestWinStreak,
				this.currentWinStreak,
			);
			this.currentLossStreak = 0;
		} else {
			this.statistics.losses += 1;
			this.currentLossStreak += 1;
			this.statistics.longestLossStreak = Math.max(
				this.statistics.longestLossStreak,
				this.currentLossStreak,
			);
			this.currentWinStreak = 0;
		}
		switch (this.state) {
			case "waiting":
				if (rng === 9) {
					this.lossesSinceLastNine = 0;
				} else {
					this.lossesSinceLastNine += 1;
					const modelDistribution = this.statistics.totalRounds / 10;
					if (this.lossesSinceLastNine >= SEQUENCE_TO_START_BETTING) {
						this.state = "betting";
						this.betsPlaced = 0;
						this.emit("stateChange", this.state, round);
					}
				}
				break;
			case "betting":
				this.betsPlaced += 1;
				if (rng === 9) {
					this.currentPoints += WIN_MULTIPLIER * this.betAmount;
					this.state = "continuation";
					this.continuationLosses = 0;
					this.emit("win", round, this.currentPoints);
				} else {
					this.currentPoints -= this.betAmount;
					if (this.betsPlaced >= 10) {
						this.state = "waiting";
						this.lossesSinceLastNine = SEQUENCE_TO_START_BETTING; // Reset to enforce waiting
						this.emit("stateChange", this.state, round);
					}
				}
				break;
			case "continuation":
				if (rng === 9) {
					this.currentPoints += WIN_MULTIPLIER * this.betAmount;
					this.continuationLosses = 0;
					this.emit("win", round, this.currentPoints);
				} else {
					this.continuationLosses += 1;
					this.currentPoints -= this.betAmount;
					if (this.continuationLosses >= 10) {
						this.state = "waiting";
						this.lossesSinceLastNine = 0;
						this.emit("stateChange", this.state, round);
					}
				}
				break;
			default:
				throw new Error(`Unknown state: ${this.state}`);
		}
	}
}

// Usage
const simulator = new StrategySimulator({ totalRounds: 1_000_000 });
simulator.on("win", (round, points) => {
	// console.log(`Round ${round}: Win! Total Points: ${points}`);
});
simulator.on("stateChange", (state, round) => {
	// console.log(`Round ${round}: State changed to ${state}`);
});
simulator.on("end", (totalPoints, statistics) => {
	console.log(`Simulation ended. Total Points: ${totalPoints}`);
	console.log("Statistics:", statistics);
	console.log(
		"Distribution:",
		Object.entries(distribution)
			.map(
				([key, value]) =>
					`${key}: ${((value / statistics.totalRounds) * 100).toFixed(2)}%`,
			)
			.join("\n"),
	);
});
simulator.run();
