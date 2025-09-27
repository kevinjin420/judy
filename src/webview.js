const vscode = acquireVsCodeApi();

// Get saved state
const state = vscode.getState() || { selectedCharacter: null, currentState: 'idle' };

// DOM elements
const characterSelector = document.getElementById('characterSelector');
const avatarImage = document.getElementById('avatarImage');
const stateSelector = document.getElementById('stateSelector');

// Current frame map
let currentFrameMap = null;

// Initialize
function initialize() {
    vscode.postMessage({ type: 'getCharacters' });

    if (state.selectedCharacter) {
        vscode.postMessage({
            type: 'selectCharacter',
            characterId: state.selectedCharacter
        });
    }
}

// Update character display
function updateCharacterDisplay(character) {
    if (!character) return;

    // Save state
    state.selectedCharacter = character.id;
    vscode.setState(state);

    // Request frame map for this character
    vscode.postMessage({ type: 'getFrameMap', characterId: character.id });
}

// Update avatar state
function updateAvatarState(newState, frameMap) {
    // Update dropdown selection
    stateSelector.value = newState;

    // Load the frame for this state
    if (frameMap && frameMap[newState] && state.selectedCharacter) {
        const frameName = frameMap[newState];
        vscode.postMessage({
            type: 'getFrameImage',
            characterId: state.selectedCharacter,
            frameName: frameName
        });
    }

    state.currentState = newState;
    vscode.setState(state);
}

// Event listeners
characterSelector.addEventListener('change', (e) => {
    if (e.target.value) {
        vscode.postMessage({
            type: 'selectCharacter',
            characterId: e.target.value
        });
    }
});

stateSelector.addEventListener('change', (e) => {
    if (e.target.value) {
        vscode.postMessage({ type: 'setState', state: e.target.value });
    }
});

// Handle messages from extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
        case 'charactersLoaded':
            characterSelector.innerHTML = '';
            message.characters.forEach(char => {
                const option = document.createElement('option');
                option.value = char.id;
                option.textContent = char.displayName;
                characterSelector.appendChild(option);
            });

            if (state.selectedCharacter) {
                characterSelector.value = state.selectedCharacter;
            } else if (message.characters.length > 0) {
                characterSelector.value = message.characters[0].id;
                vscode.postMessage({
                    type: 'selectCharacter',
                    characterId: message.characters[0].id
                });
            }
            break;

        case 'characterSelected':
            updateCharacterDisplay(message.character);
            currentFrameMap = message.frameMap;
            updateAvatarState('idle', currentFrameMap);
            break;

        case 'stateChanged':
            updateAvatarState(message.state, message.frameMap);
            break;

        case 'frameMap':
            // Store frame map for current character
            if (state.selectedCharacter === message.characterId) {
                currentFrameMap = message.frameMap;
                updateAvatarState(state.currentState, currentFrameMap);
            }
            break;

        case 'frameImage':
            // Update avatar image with new frame
            avatarImage.src = message.imageUrl;
            break;

        case 'error':
            updateAvatarState('error');
            break;
    }
});

// Initialize the interface
initialize();