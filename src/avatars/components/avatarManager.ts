import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Character, AvatarState, AvatarManager as IAvatarManager, FrameMap } from '../types/avatar.js';
import { configureCharacter } from "../../apiService.js";


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

    get availableCharacters(): Character[] {
        return this._availableCharacters;
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
            console.warn(`[JudyAI Debug] Failed to load character frames for ${characterId}:`, error);
        }

        // Return default frames if character or frames don't exist
        return {
            [AvatarState.IDLE]: 'idle.png',
            [AvatarState.TALKING]: 'talking.png',
            [AvatarState.THINKING]: 'thinking.png',
            [AvatarState.HAPPY]: 'happy.png'
        };
    }

    async switchCharacter(characterId: string): Promise<void> {
        try {
            const character = this.loadCharacterSync(characterId);
            if (!character) {
                throw new Error('Character not found');
            }

            configureCharacter(character.systemPrompt, character.voiceid);
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
                    console.warn(`[JudyAI Debug] Failed to load character ${dir}:`, error);
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
            console.error('[JudyAI Debug] Failed to load characters:', error);
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
}
