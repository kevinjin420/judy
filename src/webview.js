const vscode = acquireVsCodeApi();

// Get saved state
const state = vscode.getState() || { selectedCharacter: null, currentState: 'idle' };

// DOM elements
const characterSelector = document.getElementById('characterSelector');
const avatarImage = document.getElementById('avatarImage');
const stateSelector = document.getElementById('stateSelector');

// Current frame map
let currentFrameMap = null;

// Position tracking
let currentCursorPosition = null;

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

// Track avatar position when it loads or changes
avatarImage.addEventListener('load', () => {
    sendAvatarPosition();
});

// Send avatar position to extension
function sendAvatarPosition() {
    const rect = avatarImage.getBoundingClientRect();
    vscode.postMessage({
        type: 'avatarPosition',
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    });
}

// Request cursor position on click
avatarImage.addEventListener('click', () => {
    vscode.postMessage({ type: 'requestCursorPosition' });
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

        case 'cursorPosition':
            currentCursorPosition = message;
            console.log('Cursor position:', message.line, message.character);
            break;

        case 'offsetCalculated':
            console.log('Offset data:', message.offset);
            displayOffsetInfo(message.offset);
            break;

        case 'error':
            updateAvatarState('error');
            break;
    }
});

// Display offset information
function displayOffsetInfo(offset) {
    // Create or update info display
    let infoDiv = document.getElementById('offsetInfo');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'offsetInfo';
        infoDiv.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 8px;
            font-size: 10px;
            border-radius: 4px;
            max-width: 200px;
        `;
        document.body.appendChild(infoDiv);
    }

    infoDiv.innerHTML = `
        <div>Cursor: L${offset.cursorLine} C${offset.cursorCharacter}</div>
        <div>Avatar: ${Math.round(offset.avatarX)}, ${Math.round(offset.avatarY)}</div>
        <div>Size: ${Math.round(offset.avatarWidth)}x${Math.round(offset.avatarHeight)}</div>
    `;
}

// Initialize the interface
initialize();