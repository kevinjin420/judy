import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AvatarManager } from './avatars/components/avatarManager.js';
export class JudySidebarProvider {
    _extensionUri;
    static viewType = 'judySidebar';
    _view;
    _avatarManager;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this._avatarManager = new AvatarManager(this._extensionUri);
    }
    resolveWebviewView(webviewView, context, _token) {
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
    async _handleWebviewMessage(message) {
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
                this._updateAvatarState(message.state);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    _sendCharactersToWebview() {
        if (!this._view)
            return;
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
    _sendCharacterToWebview() {
        if (!this._view || !this._avatarManager.currentCharacter)
            return;
        const frameMap = this._avatarManager.getFrameMap(this._avatarManager.currentCharacter.id);
        this._view.webview.postMessage({
            type: 'characterSelected',
            character: this._avatarManager.currentCharacter,
            frameMap: frameMap
        });
    }
    _sendFrameMap(characterId) {
        if (!this._view)
            return;
        const frameMap = this._avatarManager.getFrameMap(characterId);
        this._view.webview.postMessage({
            type: 'frameMap',
            characterId: characterId,
            frameMap: frameMap
        });
    }
    _sendFrameImage(characterId, frameName) {
        if (!this._view)
            return;
        try {
            const framePath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'characters', characterId, 'frames', frameName);
            let imageData;
            let mimeType = 'image/png';
            if (fs.existsSync(framePath)) {
                imageData = fs.readFileSync(framePath);
                // Determine MIME type based on file extension
                const ext = path.extname(frameName).toLowerCase();
                if (ext === '.gif') {
                    mimeType = 'image/gif';
                }
                else if (ext === '.jpg' || ext === '.jpeg') {
                    mimeType = 'image/jpeg';
                }
            }
            else {
                // Fallback to default blank PNG
                console.warn(`Frame image not found: ${framePath}, using default fallback`);
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
        }
        catch (error) {
            console.error('Error loading frame image:', error);
            // Send a minimal transparent PNG as final fallback
            const fallbackImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWGZPFwAAAABJRU5ErkJggg==';
            this._view.webview.postMessage({
                type: 'frameImage',
                imageUrl: fallbackImage
            });
        }
    }
    _updateAvatarState(state) {
        if (!this._view)
            return;
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
    setAvatarState(state) {
        this._updateAvatarState(state);
    }
    getCurrentCharacter() {
        return this._avatarManager.currentCharacter;
    }
    getAvatarManager() {
        return this._avatarManager;
    }
    _getHtmlForWebview(webview) {
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
}
