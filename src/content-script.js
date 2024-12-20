// contentScript.js

// Function to intercept RNG numbers generated by the webpage
//{
//     "data": {
//         "wheelSpin": {
//             "id": "1e3d8912-ff57-460c-94bf-622165818f00",
//             "active": false,
//             "payoutMultiplier": 0,
//             "amountMultiplier": 1,
//             "amount": 0,
//             "payout": 0,
//             "updatedAt": "Fri, 18 Oct 2024 23:49:23 GMT",
//             "currency": "usdt",
//             "game": "wheel",
//             "user": {
//                 "id": "9d4aaa3a-c27e-4779-863b-da9428b0a841",
//                 "name": "ofcRS"
//             },
//             "state": {
//                 "result": 8,
//                 "segments": 10,
//                 "risk": "high"
//             }
//         }
//     }
// }

function contentScriptProcess() {
	window.addEventListener("message", async (event) => {
		if (event.data.type === "WHEEL_SPIN") {
			console.log("[RNG Statistics Analyzer] WHEEL_SPIN", event.data);
			const { state } = event.data.spin;
			await chrome.runtime.sendMessage({
				type: "STORE_NUMBER",
				number: state.result,
				segments: state.segments,
			});
		}
	});
}

window.addEventListener("load", async () => {
	console.log("contentScript.js loaded");
	contentScriptProcess();
});

setInterval(() => {
	window.postMessage(
		{
			type: "GET_DATA",
		},
		"*",
	);
}, 1000);

// Listen for BET_RESULT messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "BET_RESULT") {
		window.postMessage({ type: "BET_RESULT", decision: message.decision }, "*"); // Forward to webpage
		sendResponse({ status: "bet_result_forwarded" });
	}
});
