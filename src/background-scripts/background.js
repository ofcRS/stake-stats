import { BettingStrategy } from "../utils/betting-strategy";
import replaceFetchUser from "../user-scripts/replace-fetch.js.user.script";

import { storeNumber } from "../utils/storage";

// Initialize BettingStrategy with an initial balance
const initialBalance = 1000; // You can set this to your desired starting balance
const bettingStrategy = new BettingStrategy(initialBalance);

// async function getData() {
//     const result = await chrome.storage.local.get(['numbers', 'distribution']);
//     return {
//         numbers: result.numbers || [],
//         distribution: result.distribution || {}
//     };
// }
//
//
// async function idontRemeberWhatThisIs(number) {
//     const { numbers, distribution } = await getData();
//
//     // Update numbers array
//     numbers.push(number);
//
//     // Update distribution
//     if (distribution[number] !== undefined) {
//         distribution[number] += 1;
//     } else {
//         distribution[number] = 1;
//     }
//
//     // Save updated data
//     chrome.storage.local.set({ numbers, distribution });
//
//     // Update BettingStrategy with the new number
//     if (bettingStrategy.isBetting) {
//         bettingStrategy.updateStrategy(number); // Implement this method
//     }
// }

chrome.runtime.onInstalled.addListener(() => {
	console.log("RNG Statistics Analyzer Installed");
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
	switch (message.type) {
		case "STORE_NUMBER":
			await storeNumber(message.number);
			chrome.runtime.sendMessage({
				type: "REFRESH_DATA",
				segments: message.segments,
			});

			// After storing the number, send betting decision
			if (bettingStrategy.isBetting) {
				const decision = bettingStrategy.shouldBetNextRound();
				chrome.runtime.sendMessage({ type: "BET_RESULT", decision });
				sendResponse({ status: "success", decision });
			} else {
				sendResponse({ status: "success", decision: "NOT_BETTING" });
			}
			return true;

		case "START_BETTING":
			bettingStrategy.isBetting = true;
			sendResponse({ status: "betting_started" });
			return true;

		case "STOP_BETTING":
			bettingStrategy.isBetting = false;
			sendResponse({ status: "betting_stopped" });
			return true;

		case "PROCESS_BET":
			if (bettingStrategy.isBetting) {
				bettingStrategy.processRound();
				const decision = bettingStrategy.shouldBetNextRound(); // Implement this method
				chrome.runtime.sendMessage({ type: "BET_RESULT", decision });
				sendResponse({ status: "bet_processed", decision });
			} else {
				sendResponse({ status: "betting_not_active" });
			}
			return true;

		default:
			sendResponse({ status: "unknown_message_type" });
			return false;
	}
});

const betPageId = "stake-bet-page-user-script";

chrome.userScripts.configureWorld(
	{
		messaging: true,
	},
	async () => {
		await chrome.userScripts.unregister();
		await chrome.userScripts.register([
			{
				id: betPageId,
				matches: ["*://*/*"],
				js: [
					{
						code: replaceFetchUser,
					},
				],

				world: "MAIN",
			},
		]);
	},
);
