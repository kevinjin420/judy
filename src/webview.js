const vscode = acquireVsCodeApi();

// Get saved state
const state = vscode.getState() || {
	selectedCharacter: "judy",
	currentState: "idle",
};

// DOM elements
const characterSelector = document.getElementById("characterSelector");
const avatarImage = document.getElementById("avatarImage");
const petButton = document.getElementById("petButton");
const heartTooltip = document.getElementById("heartTooltip");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const cancelSettings = document.getElementById("cancelSettings");
const characterJson = document.getElementById("characterJson");
const saveSettings = document.getElementById("saveSettings");

// Current frame map
let currentFrameMap = null;

// Pet configuration
const PET_DURATION = 3000; // Duration in milliseconds for pet effects

// Initialize
function initialize() {
	vscode.postMessage({ type: "getCharacters" });
	vscode.postMessage({ type: "getVolume" });

	if (state.selectedCharacter) {
		vscode.postMessage({
			type: "selectCharacter",
			characterId: state.selectedCharacter,
		});
	}
}

// Update character display
function updateCharacterDisplay(character) {
	if (!character) {
		return;
	}

	// Save state
	state.selectedCharacter = character.id;
	vscode.setState(state);

	// Request frame map for this character
	vscode.postMessage({ type: "getFrameMap", characterId: character.id });
}

// Update avatar state
function updateAvatarState(newState, frameMap) {
	// Load the frame for this state
	if (frameMap && frameMap[newState] && state.selectedCharacter) {
		const frameName = frameMap[newState];
		vscode.postMessage({
			type: "getFrameImage",
			characterId: state.selectedCharacter,
			frameName: frameName,
		});
	}

	state.currentState = newState;
	vscode.setState(state);
}

// Event listeners
characterSelector.addEventListener("change", (e) => {
	if (e.target.value) {
		vscode.postMessage({
			type: "selectCharacter",
			characterId: e.target.value,
		});
	}
});


// Pet button functionality
petButton.addEventListener("click", () => {
	console.log("[JudyAI Debug] Avatar petted!");
	showHeartTooltip();

	// Send pet message to LLM (backend handles the laugh animation)
	vscode.postMessage({
		type: "petMessage",
		characterId: state.selectedCharacter,
	});
});

// Volume slider functionality with debounce
let volumeDebounceTimer = null;
volumeSlider.addEventListener("input", (e) => {
	const volume = parseInt(e.target.value);
	volumeValue.textContent = volume + "%";

	// Clear existing timer
	if (volumeDebounceTimer) {
		clearTimeout(volumeDebounceTimer);
	}

	// debounce
	volumeDebounceTimer = setTimeout(() => {
		vscode.postMessage({
			type: "setVolume",
			volume: volume,
		});
	}, 500);
});

// Settings button functionality
settingsButton.addEventListener("click", () => {
	console.log("[JudyAI Debug] Opening settings for character:", state.selectedCharacter);
	vscode.postMessage({
		type: "getCharacterJson",
		characterId: state.selectedCharacter,
	});
	settingsPanel.classList.add("visible");
});

cancelSettings.addEventListener("click", () => {
	settingsPanel.classList.remove("visible");
});

saveSettings.addEventListener("click", () => {
	try {
		const jsonData = JSON.parse(characterJson.value);
		vscode.postMessage({
			type: "saveCharacterJson",
			characterId: state.selectedCharacter,
			jsonData: jsonData,
		});
		settingsPanel.classList.remove("visible");
	} catch (error) {
		alert("Invalid JSON format: " + error.message);
	}
});


function showHeartTooltip() {
	heartTooltip.classList.add("show");

	// Hide tooltip after configured duration
	setTimeout(() => {
		heartTooltip.classList.remove("show");
	}, PET_DURATION);
}


// Handle sidebar location changes
function handleSidebarLocation(location) {
	console.log("[JudyAI Debug] Sidebar location:", location);

	if (location === "left") {
		avatarImage.classList.add("flipped");
	} else {
		avatarImage.classList.remove("flipped");
	}
}


// Handle messages from extension
window.addEventListener("message", (event) => {
	const message = event.data;

	switch (message.type) {
		case "charactersLoaded":
			characterSelector.innerHTML = "";
			message.characters.forEach((char) => {
				const option = document.createElement("option");
				option.value = char.id;
				option.textContent = char.displayName;
				characterSelector.appendChild(option);
			});

			if (state.selectedCharacter) {
				characterSelector.value = state.selectedCharacter;
			} else if (message.characters.length > 0) {
				// Default to judy if available, otherwise first character
				const defaultChar =
					message.characters.find((c) => c.id === "judy") ||
					message.characters[0];
				characterSelector.value = defaultChar.id;
				state.selectedCharacter = defaultChar.id;
				vscode.setState(state);
				vscode.postMessage({
					type: "selectCharacter",
					characterId: defaultChar.id,
				});
			}
			break;

		case "characterSelected":
			updateCharacterDisplay(message.character);
			currentFrameMap = message.frameMap;
			updateAvatarState("idle", currentFrameMap);

			chatResponse.textContent = "No messages yet";
			break;

		case "stateChanged":
			updateAvatarState(message.state, message.frameMap);
			break;

		case "frameMap":
			// Store frame map for current character
			if (state.selectedCharacter === message.characterId) {
				currentFrameMap = message.frameMap;
				updateAvatarState(state.currentState, currentFrameMap);
			}
			break;

		case "frameImage":
			// Update avatar image with new frame
			avatarImage.src = message.imageUrl;
			break;

		case "sidebarLocation":
			handleSidebarLocation(message.location);
			break;

		case "volumeUpdate":
			volumeSlider.value = message.volume;
			volumeValue.textContent = message.volume + "%";
			break;

		case "characterJsonData":
			characterJson.value = JSON.stringify(message.data, null, 2);
			break;

		case "error":
			updateAvatarState("error");
			break;
	}
});

// Initialize the interface
initialize();

// Chatbox elements
const chatResponse = document.getElementById("chatResponse");
const chatInput = document.getElementById("chatInput");

// Send message when Enter is pressed
chatInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		const message = chatInput.value.trim();
		if (!message) {
			return;
		}
		// Send message to extension
		vscode.postMessage({
			type: "chatMessage",
			text: message,
		});

		chatInput.value = "";
	}
});

window.addEventListener("message", (event) => {
	const message = event.data;
	console.log("[JudyAI Debug] Received message in webview:", message);
	if (message.type === "chatResponse") {
		chatResponse.textContent = message.text;
	}
});

chatInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		const message = chatInput.value.trim();
		if (!message) {
			return;
		}
		console.log("[JudyAI Debug] Sending chatMessage to extension:", message);
		vscode.postMessage({
			type: "chatMessage",
			text: message,
		});

		chatInput.value = "";
	}
});
