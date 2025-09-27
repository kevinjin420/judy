import * as vscode from 'vscode';
import { JudySidebarProvider } from './sidebarProvider.js';
import { setupEnvironment, checkEnvironmentSetup } from './setup.js';
import { MotivationSystem } from './motivationSystem.js';
import * as dotenv from "dotenv";

export async function activate(context: vscode.ExtensionContext) {
	console.log('Activating Judy AI Companion...');

	// Load environment variables from .env file in extension directory
	dotenv.config({ path: context.extensionUri.fsPath + '/.env' });

	// Check environment setup first
	const envReady = await checkEnvironmentSetup(context.extensionUri);

	if (!envReady) {
		console.log('Environment not fully configured, but continuing activation...');
	}

	console.log("Gemini key configured:", !!process.env.GEMINI_API_KEY);
	console.log("ElevenLabs key configured:", !!process.env.ELEVENLABS_API_KEY);

	// Initialize motivation system
	const motivationSystem = new MotivationSystem(context);

	// Register the sidebar provider
	const sidebarProvider = new JudySidebarProvider(context.extensionUri);
	sidebarProvider.setMotivationSystem(motivationSystem);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(JudySidebarProvider.viewType, sidebarProvider)
	);

	// Register commands
	const helloWorldCommand = vscode.commands.registerCommand('judy.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Judy!');
	});

	const setupCommand = vscode.commands.registerCommand('judy.setupEnvironment', async () => {
		const success = await setupEnvironment(context.extensionUri);
		if (success) {
			// Reload environment variables after setup
			dotenv.config({ path: context.extensionUri.fsPath + '/.env' });
		}
	});

	context.subscriptions.push(helloWorldCommand, setupCommand, motivationSystem);

	console.log('Judy AI Companion activated successfully!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
