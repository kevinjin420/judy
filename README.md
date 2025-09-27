# Judy - AI Companion for VS Code

A VS Code extension that provides an interactive AI companion with avatar framework, chat functionality, and text-to-speech capabilities to help you stay productive and motivated while coding.

## Features

### 🎭 Interactive Avatar System
- Multiple character companions (Judy, Leah, Penny)
- Character state management (default, happy, talking, thinking)
- Pet your avatar with visual heart feedback
- Avatar flips based on sidebar position for natural interaction

### 💬 AI Chat Integration
- Real-time conversations with Google Gemini AI
- Text-to-speech responses using ElevenLabs
- Character-specific personalities and prompts
- Contextual coding assistance and motivation

### 🎨 VS Code Integration
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
   - Press `F5` to launch a new VS Code window with the extension loaded
   - Or package and install: `vsce package` then install the `.vsix` file

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
1. Install the extension and open VS Code
2. If you haven't set up API keys, the extension will automatically prompt you
3. Alternatively, use Command Palette: `Judy: Setup Environment`
4. Find "Judy AI Companion" in the Explorer sidebar

### Interacting with Judy
- **Chat**: Type messages in the chat input at the bottom of the sidebar
- **Pet Avatar**: Click the 👋 pet button to make your character happy
- **Change States**: Use the state dropdown to switch between expressions
- **Switch Characters**: Select different companions from the character dropdown

### Character States
- **Default**: Character's base expression
- **Happy**: Triggered when petting (5-second duration)
- **Talking**: Active during AI responses
- **Thinking**: Can be manually triggered

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

### Testing
```bash
npm run test
```

## Configuration

The extension contributes these VS Code settings:

- `judy.currentCharacter`: Select active character (judy, leah, penny)

## File Structure

```
src/
├── extension.ts              # Extension entry point
├── sidebarProvider.ts        # Main webview provider
├── setup.ts                  # Environment setup workflow
├── webview.html             # Webview HTML template
├── webview.css              # Webview styles
├── webview.js               # Webview JavaScript logic
├── llmcall.mjs              # Gemini AI integration
├── 11labstest.mjs           # ElevenLabs TTS integration
└── avatars/
    ├── types/
    │   └── avatar.ts        # TypeScript interfaces
    ├── components/
    │   └── avatarManager.ts # Avatar management logic
    ├── characters/          # Character definitions
    │   ├── judy/
    │   ├── leah/
    │   └── penny/
    │       ├── character.json
    │       └── frames/
    └── default.png          # Fallback image
```

## Troubleshooting

### Extension Won't Activate
- Ensure API keys are properly set in `.env` file
- Check that FFmpeg is installed and accessible
- Run `Judy: Setup Environment` command to reconfigure

### Audio Not Working
- Verify FFmpeg installation: `ffmpeg -version`
- Check ElevenLabs API key and account credits
- Ensure system audio is enabled

### Missing Character Images
- Verify image files exist in character frames folder
- Check file extensions match character.json configuration
- Default fallback image will be used for missing files

## Known Issues

- Position calculation uses estimated character dimensions
- Some external dependencies may show TypeScript warnings (safely ignored)
- Audio playback requires system audio permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/your-username/judy/issues) page.

---

**Enjoy coding with Judy! 🎭✨**