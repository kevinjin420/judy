import * as vscode from 'vscode';

export interface MotivationConfig {
    motivationIntervalMinutes: number;  // Minutes between time-based motivation
    motivationCharacterThreshold: number; // Characters typed before motivation
    inactiveThresholdMinutes: number; // Minutes before considering user inactive
}

export const defaultMotivationConfig: MotivationConfig = {
    motivationIntervalMinutes: 15,  // Motivate every 15 minutes
    motivationCharacterThreshold: 500, // Motivate every 500 characters
    inactiveThresholdMinutes: 2,   // 2 minutes without typing = inactive
};

// Motivational messages for different triggers
export const motivationalMessages = {
    timeSpent: [
        "Great focus! You've been locked in for {minutes} minutes! 🎯",
        "Awesome dedication! {minutes} minutes of solid work! 💪",
        "You're in the zone! {minutes} minutes of productive coding! ⚡",
        "Fantastic momentum! Keep that {minutes}-minute streak going! 🚀",
        "Impressive focus! {minutes} minutes of deep work achieved! 🧠"
    ],

    charactersTyped: [
        "Nice work! You've typed {characters} characters! Keep the code flowing! ⌨️",
        "Excellent progress! {characters} characters of pure coding power! 💻",
        "You're on fire! {characters} characters and counting! 🔥",
        "Great momentum! {characters} characters of focused development! 📈",
        "Impressive output! {characters} characters of quality code! ✨"
    ],

    sessionStart: [
        "Welcome back! Ready to lock in and code? 🎮",
        "Time to code! Let's make some progress today! 💪",
        "New session, new possibilities! Let's build something great! 🚀",
        "Ready to enter the flow state? Let's code! ⚡",
        "Another day, another chance to improve! Let's go! 🎯"
    ]
};

export class MotivationSystem {
    private config: MotivationConfig;
    private context: vscode.ExtensionContext;
    private timeTracker?: NodeJS.Timeout;
    private documentChangeListener?: vscode.Disposable;
    private onMotivation?: (message: string) => void;

    private charactersTyped: number = 0;
    private sessionStart: number = Date.now();
    private lastActiveTime: number = Date.now();
    private lastMotivationTime: number = Date.now();
    private lastCharacterMotivation: number = 0;

    constructor(context: vscode.ExtensionContext, config: MotivationConfig = defaultMotivationConfig) {
        this.context = context;
        this.config = config;
        this.setupListeners();
        this.startSession();
    }

    private setupListeners(): void {
        // Track document changes for character typing
        this.documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.uri.scheme === 'file') {
                this.handleTyping(event);
            }
        });
    }

    private startSession(): void {
        this.sessionStart = Date.now();
        this.lastActiveTime = Date.now();
        this.lastMotivationTime = Date.now();

        // Start time tracking
        this.timeTracker = setInterval(() => {
            this.trackTime();
        }, 60000); // Check every minute

        // Send session start motivation
        const message = this.getRandomMessage(motivationalMessages.sessionStart);
        this.onMotivation?.(message);
    }

    private handleTyping(event: vscode.TextDocumentChangeEvent): void {
        let charactersAdded = 0;

        event.contentChanges.forEach(change => {
            if (change.text.length > change.rangeLength) {
                charactersAdded += change.text.length - change.rangeLength;
            }
        });

        if (charactersAdded > 0) {
            this.charactersTyped += charactersAdded;
            this.lastActiveTime = Date.now();

            // Check for character-based motivation
            const charactersSinceMotivation = this.charactersTyped - this.lastCharacterMotivation;
            if (charactersSinceMotivation >= this.config.motivationCharacterThreshold) {
                this.triggerCharacterMotivation();
            }
        }
    }

    private trackTime(): void {
        const now = Date.now();
        const timeSinceActive = now - this.lastActiveTime;
        const inactiveThreshold = this.config.inactiveThresholdMinutes * 60 * 1000;

        if (timeSinceActive < inactiveThreshold) {
            // User is active, check for time-based motivation
            const timeSinceMotivation = now - this.lastMotivationTime;
            const motivationInterval = this.config.motivationIntervalMinutes * 60 * 1000;

            if (timeSinceMotivation >= motivationInterval) {
                this.triggerTimeMotivation();
            }
        }
    }

    private triggerTimeMotivation(): void {
        const sessionMinutes = Math.floor((Date.now() - this.sessionStart) / 60000);
        const message = this.getRandomMessage(motivationalMessages.timeSpent)
            .replace('{minutes}', sessionMinutes.toString());

        this.lastMotivationTime = Date.now();
        this.onMotivation?.(message);
    }

    private triggerCharacterMotivation(): void {
        const message = this.getRandomMessage(motivationalMessages.charactersTyped)
            .replace('{characters}', this.charactersTyped.toString());

        this.lastCharacterMotivation = this.charactersTyped;
        this.onMotivation?.(message);
    }

    private getRandomMessage(messages: string[]): string {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Public API
    public onMotivationCallback(callback: (message: string) => void): void {
        this.onMotivation = callback;
    }

    public updateConfig(newConfig: Partial<MotivationConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    public getStats() {
        return {
            charactersTyped: this.charactersTyped,
            sessionMinutes: Math.floor((Date.now() - this.sessionStart) / 60000)
        };
    }


    public dispose(): void {
        if (this.timeTracker) {
            clearInterval(this.timeTracker);
        }
        this.documentChangeListener?.dispose();
    }
}