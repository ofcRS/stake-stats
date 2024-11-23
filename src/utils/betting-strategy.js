export class BettingStrategy {
	constructor(balance) {
		this.balance = balance;
	}

	shouldBetNextRound() {
		// Determine whether to bet in the next round or skip
		if (this.lossesSinceLastWin >= 10) {
			// Stop after 10 consecutive losses
			this.isBetting = false;
			return "STOP";
		}
		if (this.lossesSinceLastWin >= 44) {
			return "BET";
		}
		return "SKIP";
	}

	placeBet() {
		// Implement your betting logic here
		console.log("Placing a bet...");
		// Update balance and losses accordingly
	}

	skipBet() {
		// Implement logic to skip betting
		console.log("Skipping this round...");
	}

	// New method to update strategy with the latest number
	updateStrategy(number) {
		if (number !== 9) {
			// Assuming 9 is the winning number
			this.lossesSinceLastWin += 1;
		} else {
			this.lossesSinceLastWin = 0;
		}
	}
}
