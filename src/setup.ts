import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function setupEnvironment(extensionUri: vscode.Uri): Promise<boolean> {
    const envPath = path.join(extensionUri.fsPath, '.env');

    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        const overwrite = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: '.env file already exists. Do you want to overwrite it?'
        });

        if (overwrite !== 'Yes') {
            return true; // User chose not to overwrite, assume existing config is fine
        }
    }

    // Get API keys from user
    const geminiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Google Gemini API Key',
        placeHolder: 'Your Gemini API key...',
        password: true,
        ignoreFocusOut: true
    });

    if (!geminiKey) {
        vscode.window.showErrorMessage('Gemini API key is required for Judy to work');
        return false;
    }

    const elevenLabsKey = await vscode.window.showInputBox({
        prompt: 'Enter your ElevenLabs API Key',
        placeHolder: 'Your ElevenLabs API key...',
        password: true,
        ignoreFocusOut: true
    });

    if (!elevenLabsKey) {
        vscode.window.showErrorMessage('ElevenLabs API key is required for Judy to work');
        return false;
    }

    // Create .env file content
    const envContent = `# Judy AI Companion Environment Configuration
# Generated on ${new Date().toISOString()}

# Google Gemini API Key for AI conversations
GEMINI_API_KEY=${geminiKey}

# ElevenLabs API Key for text-to-speech
ELEVENLABS_API_KEY=${elevenLabsKey}

# Optional: OpenAI API Key (if you want to use OpenAI instead of Gemini)
# OPENAI_API_KEY=your_openai_key_here
`;

    try {
        fs.writeFileSync(envPath, envContent, 'utf8');
        vscode.window.showInformationMessage('✅ Environment configuration saved successfully! Judy is ready to use.');
        return true;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create .env file: ${error}`);
        return false;
    }
}

export async function checkEnvironmentSetup(extensionUri: vscode.Uri): Promise<boolean> {
    const envPath = path.join(extensionUri.fsPath, '.env');

    if (!fs.existsSync(envPath)) {
        const setup = await vscode.window.showQuickPick(['Set up now', 'Skip'], {
            placeHolder: 'Judy needs API keys to work. Would you like to set them up?'
        });

        if (setup === 'Set up now') {
            return await setupEnvironment(extensionUri);
        } else {
            vscode.window.showWarningMessage('Judy may not work properly without API keys. You can set them up later using the "Judy: Setup Environment" command.');
            return false;
        }
    }

    // Validate existing .env file
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasGemini = envContent.includes('GEMINI_API_KEY=') && !envContent.includes('GEMINI_API_KEY=your_');
        const hasElevenLabs = envContent.includes('ELEVENLABS_API_KEY=') && !envContent.includes('ELEVENLABS_API_KEY=your_');

        if (!hasGemini || !hasElevenLabs) {
            const reconfigure = await vscode.window.showQuickPick(['Reconfigure', 'Continue anyway'], {
                placeHolder: 'API keys appear to be missing or placeholder values. Reconfigure?'
            });

            if (reconfigure === 'Reconfigure') {
                return await setupEnvironment(extensionUri);
            }
        }

        return true;
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading .env file: ${error}`);
        return false;
    }
}