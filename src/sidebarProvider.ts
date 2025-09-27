import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AvatarManager } from './avatars/components/avatarManager';
import { AvatarState } from './avatars/types/avatar';

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
    }

    private async _handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'getCharacters':
                this._sendCharactersToWebview();
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

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    private _sendCharactersToWebview() {
        if (!this._view) return;

        const characters = this._avatarManager.getCharacterList();
        this._view.webview.postMessage({
            type: 'charactersLoaded',
            characters: characters.map(char => ({
                id: char.id,
                displayName: char.displayName,
                description: char.description
            }))
        });
    }

    private _sendCharacterToWebview() {
        if (!this._view || !this._avatarManager.currentCharacter) return;

        const frameMap = this._avatarManager.getFrameMap(this._avatarManager.currentCharacter.id);

        this._view.webview.postMessage({
            type: 'characterSelected',
            character: this._avatarManager.currentCharacter,
            frameMap: frameMap
        });
    }

    private _sendFrameMap(characterId: string) {
        if (!this._view) return;

        const frameMap = this._avatarManager.getFrameMap(characterId);

        this._view.webview.postMessage({
            type: 'frameMap',
            characterId: characterId,
            frameMap: frameMap
        });
    }

    private _sendFrameImage(characterId: string, frameName: string) {
        if (!this._view) return;

        try {
            const framePath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'characters', characterId, 'frames', frameName);

            if (fs.existsSync(framePath)) {
                const frameData = fs.readFileSync(framePath);
                const base64Data = frameData.toString('base64');

                // Determine MIME type based on file extension
                const ext = path.extname(frameName).toLowerCase();
                let mimeType = 'image/png';
                if (ext === '.gif') {
                    mimeType = 'image/gif';
                } else if (ext === '.jpg' || ext === '.jpeg') {
                    mimeType = 'image/jpeg';
                }

                const imageUrl = `data:${mimeType};base64,${base64Data}`;

                this._view.webview.postMessage({
                    type: 'frameImage',
                    imageUrl: imageUrl
                });
            } else {
                console.warn(`Frame image not found: ${framePath}`);
            }
        } catch (error) {
            console.error('Error loading frame image:', error);
        }
    }

    private _updateAvatarState(state: AvatarState) {
        if (!this._view) return;

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


    // Public methods for external use
    public setAvatarState(state: AvatarState) {
        this._updateAvatarState(state);
    }

    public getCurrentCharacter() {
        return this._avatarManager.currentCharacter;
    }

    public getAvatarManager() {
        return this._avatarManager;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        return htmlContent;
    }
}