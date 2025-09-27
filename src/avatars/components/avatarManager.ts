import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Character, AvatarState, AvatarManager as IAvatarManager, FrameMap } from '../types/avatar.js';
import { changeprompt } from "../../llmcall.mjs";
import { updatevoice } from "../../11labstest.mjs"


export class AvatarManager implements IAvatarManager {
    private _currentCharacter: Character | null = null;
    private _currentState: AvatarState = AvatarState.IDLE;
    private _availableCharacters: Character[] = [];
    private _charactersPath: string;

    constructor(private extensionUri: vscode.Uri) {
        this._charactersPath = path.join(this.extensionUri.fsPath, 'src', 'avatars', 'characters');
        this.loadAllCharacters();
    }

    get currentCharacter(): Character | null {
        return this._currentCharacter;
    }

    get currentState(): AvatarState {
        return this._currentState;
    }

    get availableCharacters(): Character[] {
        return this._availableCharacters;
    }

    async loadCharacter(characterId: string): Promise<Character> {
        const characterPath = path.join(this._charactersPath, characterId, 'character.json');

        try {
            const characterData = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
            return characterData as Character;
        } catch (error) {
            throw new Error(`Failed to load character ${characterId}: ${error}`);
        }
    }

    public getFrameMap(characterId: string): FrameMap {
        // Find the character in loaded characters
        const character = this._availableCharacters.find(c => c.id === characterId);

        if (character && character.frames) {
            return character.frames;
        }

        // If not found in loaded characters, try to load it
        try {
            const loadedCharacter = this.loadCharacterSync(characterId);
            if (loadedCharacter && loadedCharacter.frames) {
                return loadedCharacter.frames;
            }
        } catch (error) {
            console.warn(`Failed to load character frames for ${characterId}:`, error);
        }

        // Return default frames if character or frames don't exist
        return {
            [AvatarState.IDLE]: 'idle.png',
            [AvatarState.WAITING]: 'waiting.png',
            [AvatarState.TALKING]: 'talking.png',
            [AvatarState.THINKING]: 'thinking.png',
            [AvatarState.LISTENING]: 'listening.png',
            [AvatarState.ERROR]: 'error.png'
        };
    }

    getCurrentFramePath(): string {
        if (!this._currentCharacter) return '';

        const frameName = this._currentCharacter.frames[this._currentState];

        if (!frameName) return '';

        return path.join(this._charactersPath, this._currentCharacter.id, 'frames', frameName);
    }

    async switchCharacter(characterId: string): Promise<void> {
        try {
            const character = await this.loadCharacter(characterId);
            changeprompt(character.systemPrompt);
            updatevoice(character.voiceid);
            this._currentCharacter = character;
            this.setState(AvatarState.IDLE);

            // Save current character preference
            await vscode.workspace.getConfiguration('judy').update('currentCharacter', characterId, true);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to switch character: ${error}`);
        }
    }

    setState(state: AvatarState): void {
        this._currentState = state;
    }

    getCharacterList(): Character[] {
        return this._availableCharacters.filter(char => char.enabled);
    }

    updateCharacter(character: Partial<Character>): void {
        if (this._currentCharacter && character.id === this._currentCharacter.id) {
            this._currentCharacter = { ...this._currentCharacter, ...character };
        }
    }


    private loadAllCharacters(): void {
        try {
            if (!fs.existsSync(this._charactersPath)) {
                return;
            }

            const characterDirs = fs.readdirSync(this._charactersPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            this._availableCharacters = [];

            for (const dir of characterDirs) {
                try {
                    const character = this.loadCharacterSync(dir);
                    if (character) {
                        this._availableCharacters.push(character);
                    }
                } catch (error) {
                    console.warn(`Failed to load character ${dir}:`, error);
                }
            }

            // Load the last selected character
            const savedCharacter = vscode.workspace.getConfiguration('judy').get<string>('currentCharacter');
            if (savedCharacter && this._availableCharacters.some(c => c.id === savedCharacter)) {
                this.switchCharacter(savedCharacter);
            } else if (this._availableCharacters.length > 0) {
                this.switchCharacter(this._availableCharacters[0].id);
            }
        } catch (error) {
            console.error('Failed to load characters:', error);
        }
    }

    private loadCharacterSync(characterId: string): Character | null {
        try {
            const characterPath = path.join(this._charactersPath, characterId, 'character.json');
            const characterData = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
            return characterData as Character;
        } catch (error) {
            return null;
        }
    }

    async createCharacter(character: Character): Promise<void> {
        const characterDir = path.join(this._charactersPath, character.id);

        // Create character directory
        if (!fs.existsSync(characterDir)) {
            fs.mkdirSync(characterDir, { recursive: true });
        }

        // Save character data
        fs.writeFileSync(
            path.join(characterDir, 'character.json'),
            JSON.stringify(character, null, 2)
        );

        // Reload characters
        this.loadAllCharacters();
    }
}
