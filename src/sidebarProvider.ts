// file: sidebarProvider.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AvatarManager } from './avatars/components/avatarManager.js';
import { askGemini } from './llmcall.mjs';
import { AvatarState, Character, FrameMap } from './avatars/types/avatar.js';
// sidebarProvider.ts (or main extension entry)
import "dotenv/config";
import { runDriver } from './driver.mjs';
import { speak } from './11labstest.mjs';



export class JudySidebarProvider implements vscode.WebviewViewProvider {
  static viewType = 'judySidebar';
  private _extensionUri: vscode.Uri;
  private _view?: vscode.WebviewView;
  private _avatarManager: AvatarManager;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._avatarManager = new AvatarManager(this._extensionUri);
  }

  resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      this._handleWebviewMessage(data);
    });

    // Send initial character list
    this._sendCharactersToWebview();
  }

  private async _handleWebviewMessage(message: any) {
    console.log('Received message from Webview:', message);

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

      case 'chatMessage':
        const userMsg = message.text;
        console.log('Chat message received:', userMsg);

        const responseText = await askGemini(userMsg);

        this._view?.webview.postMessage({
			type: 'chatResponse',
			text: responseText
        });
		await speak(responseText);
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
      frameMap
    });
  }

  private _sendFrameMap(characterId: string) {
    if (!this._view) return;
    const frameMap = this._avatarManager.getFrameMap(characterId);
    this._view.webview.postMessage({ type: 'frameMap', characterId, frameMap });
  }

  private _sendFrameImage(characterId: string, frameName: string) {
    if (!this._view) return;
    try {
      const framePath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'characters', characterId, 'frames', frameName);
      let imageData: Buffer;
      let mimeType = 'image/png';

      if (fs.existsSync(framePath)) {
        imageData = fs.readFileSync(framePath);
        const ext = path.extname(frameName).toLowerCase();
        if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      } else {
        console.warn(`Frame not found: ${framePath}, using fallback`);
        const defaultPath = path.join(this._extensionUri.fsPath, 'src', 'avatars', 'default.png');
        imageData = fs.readFileSync(defaultPath);
      }

      const base64Data = imageData.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Data}`;
      this._view.webview.postMessage({ type: 'frameImage', imageUrl });
    } catch (err) {
      console.error('Error loading frame image:', err);
    }
  }

  private _updateAvatarState(state: string) {
    if (!this._view) return;
    this._avatarManager.setState(state as AvatarState);

    const frameMap = this._avatarManager.currentCharacter
      ? this._avatarManager.getFrameMap(this._avatarManager.currentCharacter.id)
      : null;

    this._view.webview.postMessage({ type: 'stateChanged', state, frameMap });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
    const cssPath = path.join(this._extensionUri.fsPath, 'src', 'webview.css');
    const jsPath = path.join(this._extensionUri.fsPath, 'src', 'webview.js');

    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    const jsUri = webview.asWebviewUri(vscode.Uri.file(jsPath));

    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    htmlContent = htmlContent.replace('{{CSS_URI}}', cssUri.toString());
    htmlContent = htmlContent.replace('{{JS_URI}}', jsUri.toString());

    return htmlContent;
  }
}
