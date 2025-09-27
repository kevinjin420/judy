export enum AvatarState {
    IDLE = 'idle',
    WAITING = 'waiting',
    TALKING = 'talking',
    THINKING = 'thinking',
    LISTENING = 'listening',
    ERROR = 'error'
}

export type FrameMap = Record<AvatarState, string>;

export interface Character {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    systemPrompt: string;
    author: string;
    tags: string[];
    created: string;
    updated: string;
    enabled: boolean;
    frames: FrameMap;
}

export interface AvatarManager {
    currentCharacter: Character | null;
    currentState: AvatarState;
    availableCharacters: Character[];

    loadCharacter(characterId: string): Promise<Character>;
    switchCharacter(characterId: string): Promise<void>;
    setState(state: AvatarState): void;
    getCharacterList(): Character[];
    updateCharacter(character: Partial<Character>): void;
    getFrameMap(characterId: string): FrameMap;
    getCurrentFramePath(): string;
}