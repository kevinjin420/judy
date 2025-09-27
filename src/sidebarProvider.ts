import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
const fetch = require('node-fetch');


const ELEVEN_KEY = "sk_842db5dd8f54b7da66730e489ce37e916aaf9b24162e9257";
const VOICE_ID = 'bMxLr8fP6hzNRRi9nJxU';

async function textToSpeech(text: string) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVEN_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    });

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
}

export class JudySidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'judySidebar';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

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

        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        webviewView.webview.html = htmlContent;

        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.command === 'sendText') {
                const audioBase64 = await textToSpeech(message.text);

                webviewView.webview.postMessage({
                    command: 'playAudio',
                    text: message.text,
                    audioBase64
                });
            }
        });
    }
}
