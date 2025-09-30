import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AvatarManager } from './avatars/components/avatarManager.js';
import { AvatarState, Character } from './avatars/types/avatar.js';
import { askGemini, speakWithDuration, setVolume } from './apiService.js';

export class JudySidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'judySidebar';
    private _view?: vscode.WebviewView;
    private _avatarManager: AvatarManager;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._avatarManager = new AvatarManager(this._extensionUri);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            this._handleWebviewMessage(data);
        });

        // Send initial data to webview
        this._sendCharactersToWebview();
        this._sendSidebarLocation();
        this._sendVolumeToWebview();
        this._checkAndNotifyApiKeys();

        // Initialize volume from settings
        this._initializeVolume();
    }

    private async _handleWebviewMessage(message: any) {
        console.log('[JudyAI Debug] Received message from Webview:', message);

        switch (message.type) {
            case 'getCharacters':
                this._sendCharactersToWebview();
                this._sendSidebarLocation();
                break;

            case 'getVolume':
                this._sendVolumeToWebview();
                break;

            case 'setVolume':
                this._updateVolumeSetting(message.volume);
                break;

            case 'selectCharacter':
                await this._avatarManager.switchCharacter(message.characterId);
                this._sendCharacterToWebview();
                break;

            case 'getFrameMap':
                this._sendFrameMap(message.characterId);
                break;

            case 'getFrameImage':
                this._sendFrameImage(message.characterId, message.frameName);
                break;

            case 'setState':
                this._updateAvatarState(message.state as AvatarState);
                break;

            case 'chatMessage':
                const userMsg = message.text;
                console.log('[JudyAI Debug] Chat message received:', userMsg);

                // Set to thinking state while waiting for LLM response
                this._updateAvatarState(AvatarState.THINKING);

                const responseText = await askGemini(userMsg);

                this._view?.webview.postMessage({
                    type: 'chatResponse',
                    text: responseText
                });

                // Start animation and speech in parallel, animation will stop when speech ends
                this._startTalkingAnimationWithSpeech(responseText);
                break;

            case 'petMessage':
                console.log('[JudyAI Debug] Pet message received for character:', message.characterId);

                // Set to happy state immediately when petted
                this._updateAvatarState(AvatarState.HAPPY);

                // Get character-specific pet response
                const character = this._avatarManager.currentCharacter;
                const characterName = character?.displayName || 'the character';
                const petResponse = await askGemini(`The user just pet ${characterName} on the head. Respond warmly and briefly to being petted, trying to staying in character.`);

                this._view?.webview.postMessage({
                    type: 'chatResponse',
                    text: petResponse
                });

                // Start animation and speech in parallel
                this._startTalkingAnimationWithSpeech(petResponse);
                break;

            default:
                console.warn('[JudyAI Debug] Unknown message type:', message.type);
        }
    }

    private _sendCharactersToWebview() {
        if (!this._view) {
            return;
        }

        const characters = this._avatarManager.getCharacterList();
        this._view.webview.postMessage({
            type: 'charactersLoaded',
            characters: characters.map((char: Character) => ({
                id: char.id,
                displayName: char.displayName,
                description: char.description
            }))
        });
    }

    private _sendCharacterToWebview() {
        if (!this._view || !this._avatarManager.currentCharacter) {
            return;
        }

        const frameMap = this._avatarManager.getFrameMap(this._avatarManager.currentCharacter.id);

        this._view.webview.postMessage({
            type: 'characterSelected',
            character: this._avatarManager.currentCharacter,
            frameMap: frameMap
        });
    }

    private _sendFrameMap(characterId: string) {
        if (!this._view) {
            return;
        }

        const frameMap = this._avatarManager.getFrameMap(characterId);

        this._view.webview.postMessage({
            type: 'frameMap',
            characterId: characterId,
            frameMap: frameMap
        });
    }

    private _sendFrameImage(characterId: string, frameName: string) {
        if (!this._view) {
            return;
        }

        try {
            const framePath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'characters', characterId, 'frames', frameName);
            let imageData: Buffer;
            let mimeType = 'image/png';

            if (fs.existsSync(framePath)) {
                imageData = fs.readFileSync(framePath);

                // Determine MIME type based on file extension
                const ext = path.extname(frameName).toLowerCase();
                if (ext === '.gif') {
                    mimeType = 'image/gif';
                } else if (ext === '.jpg' || ext === '.jpeg') {
                    mimeType = 'image/jpeg';
                }
            } else {
                // Fallback to default blank PNG
                console.warn(`[JudyAI Debug] Frame image not found: ${framePath}, using default fallback`);
                const defaultPath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'default.png');
                imageData = fs.readFileSync(defaultPath);
                mimeType = 'image/png';
            }

            const base64Data = imageData.toString('base64');
            const imageUrl = `data:${mimeType};base64,${base64Data}`;

            this._view.webview.postMessage({
                type: 'frameImage',
                imageUrl: imageUrl
            });
        } catch (error) {
            console.error('[JudyAI Debug] Error loading frame image:', error);
            try {
                // Try to use the same default.png fallback
                const defaultPath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'default.png');
                const defaultData = fs.readFileSync(defaultPath);
                const base64Data = defaultData.toString('base64');
                const imageUrl = `data:image/png;base64,${base64Data}`;

                this._view.webview.postMessage({
                    type: 'frameImage',
                    imageUrl: imageUrl
                });
            } catch (fallbackError) {
                console.error('[JudyAI Debug] Error loading default fallback image:', fallbackError);
                // Send a minimal transparent PNG as final fallback
                const fallbackImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWGZPFwAAAABJRU5ErkJggg==';
                this._view.webview.postMessage({
                    type: 'frameImage',
                    imageUrl: fallbackImage
                });
            }
        }
    }

    private _updateAvatarState(state: AvatarState) {
        if (!this._view) {
            return;
        }

        this._avatarManager.setState(state);

        const frameMap = this._avatarManager.currentCharacter
            ? this._avatarManager.getFrameMap(this._avatarManager.currentCharacter.id)
            : null;

        this._view.webview.postMessage({
            type: 'stateChanged',
            state: state,
            frameMap: frameMap
        });
    }

    private _animateFrames(delayMs: number, states: AvatarState[], shouldLoop: boolean, durationMs?: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this._view || states.length === 0) {
                resolve();
                return;
            }

            let currentFrameIndex = 0;
            const startTime = Date.now();

            const interval = setInterval(() => {
                // Check if we should stop (for timed animations)
                if (durationMs) {
                    const elapsed = Date.now() - startTime;
                    if (elapsed >= durationMs) {
                        clearInterval(interval);
                        // Return to idle state when done
                        this._updateAvatarState(AvatarState.IDLE);
                        resolve();
                        return;
                    }
                }

                // Update to current frame
                this._updateAvatarState(states[currentFrameIndex]);

                // Move to next frame
                currentFrameIndex++;

                if (currentFrameIndex >= states.length) {
                    if (shouldLoop || durationMs) {
                        // Reset to beginning if looping or if we have a duration
                        currentFrameIndex = 0;
                    } else {
                        // Stop animation if not looping and no duration
                        clearInterval(interval);
                        resolve();
                        return;
                    }
                }
            }, delayMs);
        });
    }

    private _animateTalking(durationMs: number): Promise<void> {
        // Alternate between idle and talking to simulate mouth movement
        const talkingStates: AvatarState[] = [AvatarState.IDLE, AvatarState.TALKING];
        return this._animateFrames(200, talkingStates, true, durationMs);
    }

    private async _startTalkingAnimationWithSpeech(text: string): Promise<void> {
        try {
            // Start animation immediately while speech loads
            let animationActive = true;

            // Start the mouth animation loop immediately
            const animationPromise = (async () => {
                const talkingStates: AvatarState[] = [AvatarState.IDLE, AvatarState.TALKING];
                let currentFrameIndex = 0;

                while (animationActive) {
                    this._updateAvatarState(talkingStates[currentFrameIndex]);
                    currentFrameIndex = (currentFrameIndex + 1) % talkingStates.length;
                    await new Promise(resolve => setTimeout(resolve, 400));
                }

                // Return to idle when done
                this._updateAvatarState(AvatarState.IDLE);
            })();

            // Play speech and stop animation when done
            await speakWithDuration(text);
            animationActive = false;
            await animationPromise;
        } catch (error) {
            console.error('[JudyAI Debug] Error in talking animation with speech:', error);
            // Return to idle state on error
            this._updateAvatarState(AvatarState.IDLE);
        }
    }


    private _getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
        const cssPath = path.join(this._extensionUri.fsPath, 'src', 'webview.css');
        const jsPath = path.join(this._extensionUri.fsPath, 'src', 'webview.js');

        // Create URIs for CSS and JS files
        const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
        const jsUri = webview.asWebviewUri(vscode.Uri.file(jsPath));

        // Read HTML and replace placeholders
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        htmlContent = htmlContent.replace('{{CSS_URI}}', cssUri.toString());
        htmlContent = htmlContent.replace('{{JS_URI}}', jsUri.toString());

        return htmlContent;
    }

    private _sendSidebarLocation() {
        if (!this._view) {
            return;
        }

        const sidebarLocation = vscode.workspace.getConfiguration('workbench').get('sideBar.location', 'left');

        this._view.webview.postMessage({
            type: 'sidebarLocation',
            location: sidebarLocation
        });
    }

    private _checkAndNotifyApiKeys() {
        if (!this._view) {
            return;
        }

        const config = vscode.workspace.getConfiguration('judy');
        const geminiKey = config.get('geminiApiKey', '');
        const elevenLabsKey = config.get('elevenlabsApiKey', '');

        if (!geminiKey || !elevenLabsKey) {
            this._view.webview.postMessage({
                type: 'chatResponse',
                text: 'API keys are not configured. Please configure your Gemini and ElevenLabs API keys in VS Code settings.\n\nUse the command: "Judy: Open Settings" from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)'
            });
        }
    }

    private _sendVolumeToWebview() {
        if (!this._view) {
            return;
        }

        const config = vscode.workspace.getConfiguration('judy');
        const volume = config.get('volume', 100);

        this._view.webview.postMessage({
            type: 'volumeUpdate',
            volume: volume
        });
    }

    private async _updateVolumeSetting(volume: number) {
        const config = vscode.workspace.getConfiguration('judy');
        await config.update('volume', volume, vscode.ConfigurationTarget.Global);
        setVolume(volume);
        console.log('[JudyAI Debug] Volume updated to:', volume);
    }

    private _initializeVolume() {
        const config = vscode.workspace.getConfiguration('judy');
        const volume = config.get('volume', 100);
        setVolume(volume);
        console.log('[JudyAI Debug] Volume initialized to:', volume);
    }

    public dispose() {
    }
}