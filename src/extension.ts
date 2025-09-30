import * as vscode from 'vscode';
import { JudySidebarProvider } from './sidebarProvider.js';
import { checkEnvironmentSetup, loadApiKeys } from './setup.js';

export async function activate(context: vscode.ExtensionContext) {
	console.log('[JudyAI Debug] Activating Judy AI Companion...');

	// Load API keys from VS Code settings
	const apiKeys = loadApiKeys();

	// Set as environment variables for backward compatibility with existing code
	process.env.GEMINI_API_KEY = apiKeys.geminiApiKey;
	process.env.ELEVENLABS_API_KEY = apiKeys.elevenlabsApiKey;

	// Check environment setup first
	const envReady = await checkEnvironmentSetup();

	if (!envReady) {
		console.log('[JudyAI Debug] Environment not fully configured, but continuing activation...');
	}

	console.log("[JudyAI Debug] Gemini key configured:", !!process.env.GEMINI_API_KEY);
	console.log("[JudyAI Debug] ElevenLabs key configured:", !!process.env.ELEVENLABS_API_KEY);

	// Register the sidebar provider
	const sidebarProvider = new JudySidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(JudySidebarProvider.viewType, sidebarProvider)
	);

	// Register command to open VS Code settings
	const openSettingsCommand = vscode.commands.registerCommand('judy.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:undefined_publisher.judy');
	});

	context.subscriptions.push(openSettingsCommand);

	console.log('[JudyAI Debug] Judy AI Companion activated successfully!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
