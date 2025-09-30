import * as vscode from 'vscode';

export async function checkEnvironmentSetup(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('judy');
    const geminiKey = config.get('geminiApiKey', '');
    const elevenLabsKey = config.get('elevenlabsApiKey', '');

    // Check if keys are configured
    if (!geminiKey || !elevenLabsKey) {
        const choice = await vscode.window.showInformationMessage(
            'Judy needs API keys to work. Please configure them in settings.',
            'Open Settings'
        );

        if (choice === 'Open Settings') {
            vscode.commands.executeCommand('judy.openSettings');
        }
        return false;
    }

    return true;
}

export function loadApiKeys(): { geminiApiKey: string; elevenlabsApiKey: string } {
    const config = vscode.workspace.getConfiguration('judy');
    return {
        geminiApiKey: config.get('geminiApiKey', ''),
        elevenlabsApiKey: config.get('elevenlabsApiKey', '')
    };
}