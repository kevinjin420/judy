# Judy - AI Companion for VS Code

A VS Code extension that provides an interactive AI companion with avatar framework, chat functionality, and text-to-speech capabilities to help you stay productive and motivated while coding.

## Features

### Interactive Avatar System
- Multiple character companions (Judy, Leah, Penny)
- Character state management (default, happy, talking, thinking)
- Pet your avatar with visual heart feedback
- Avatar flips based on sidebar position for natural interaction

### AI Chat Integration
- Real-time conversations with Google Gemini AI
- Text-to-speech responses using ElevenLabs
- Character-specific personalities and prompts
- Contextual coding assistance and motivation

### VS Code Integration
- Seamless sidebar integration in Explorer tab
- Native VS Code theming support
- Responsive design adapting to sidebar width
- Automatic environment setup workflow

## Installation

### Prerequisites

1. **Install FFmpeg** (required for audio processing):

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```

   **macOS:**
   ```bash
   brew install ffmpeg
   ```

   **Windows:**
   Download from [FFmpeg official website](https://ffmpeg.org/download.html) or use chocolatey:
   ```powershell
   choco install ffmpeg
   ```

### Extension Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/judy.git
   cd judy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up API keys:**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   # Google Gemini API Key for AI conversations
   # Get your key from: https://makersuite.google.com/app/apikey
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # ElevenLabs API Key for text-to-speech
   # Get your key from: https://elevenlabs.io/app/settings/api-keys
   ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
   ```

4. **Compile the extension:**
   ```bash
   npm run compile
   ```

5. **Install in VS Code:**
   - Press `F5` or use `ctrl-shift-P`, then select `Debug: Start Debugging` to launch a new VS Code window with the extension loaded

### Getting API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

#### ElevenLabs API Key
1. Visit [ElevenLabs API Settings](https://elevenlabs.io/app/settings/api-keys)
2. Sign up for a free account (includes monthly free credits)
3. Generate an API key
4. Copy the key to your `.env` file

## Usage

### First Time Setup
Find "Judy AI Companion" in the Explorer sidebar

### Interacting with Judy
- **Chat**: Type messages in the chat input at the bottom of the sidebar
- **Pet Avatar**: Click the pet button to make your character happy
- **View State**: The state display shows the current character expression
- **Switch Characters**: Select different companions from the character dropdown

### Character States
- **Default**: Character's base expression
- **Happy**: Triggered when petting
- **Talking**: Active during AI responses
- **Thinking**: Active when processing requests

## Development

### Adding New Characters

1. Create character folder:
   ```
   src/avatars/characters/new-character/
   ├── character.json
   └── frames/
       ├── Default.png
       ├── Happy.png
       ├── Talking.gif
       └── Thinking.png
   ```

2. Configure `character.json`:
   ```json
   {
     "id": "new-character",
     "name": "new-character",
     "displayName": "Character Name",
     "description": "Character description",
     "version": "1.0.0",
     "systemPrompt": "Character personality prompt",
     "author": "Your Name",
     "tags": ["tag1", "tag2"],
     "created": "2024-01-01T00:00:00Z",
     "updated": "2024-01-01T00:00:00Z",
     "enabled": true,
     "frames": {
       "default": "Default.png",
       "happy": "Happy.png",
       "talking": "Talking.gif",
       "thinking": "Thinking.png"
     }
   }
   ```

3. Update `package.json` character enum:
   ```json
   "enum": ["judy", "leah", "penny", "new-character"]
   ```

### Building
```bash
npm run compile
```


# Enjoy coding with Judy!