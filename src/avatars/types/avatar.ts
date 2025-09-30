export enum AvatarState {
    IDLE = 'idle',
    TALKING = 'talking',
    THINKING = 'thinking',
    HAPPY = 'happy'
}

export type FrameMap = Record<AvatarState, string>;

export interface Character {
    id: string;
    name: string;
    displayName: string;
    description: string;
    voiceid: string;
    systemPrompt: string;
    enabled: boolean;
    frames: FrameMap;
}

export interface AvatarManager {
    currentCharacter: Character | null;
    availableCharacters: Character[];

    switchCharacter(characterId: string): Promise<void>;
    setState(state: AvatarState): void;
    getCharacterList(): Character[];
    getFrameMap(characterId: string): FrameMap;
}