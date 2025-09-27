# Judy - Avatar Framework for VS Code

A VS Code extension that provides an interactive avatar framework with character management, state tracking, and cursor position integration.

## Features

### 🎭 Multi-Character Avatar System
- Support for multiple avatar characters with unique personalities
- Character selection via dropdown interface
- Frame-based animation system using PNG/GIF files
- Currently includes characters: Judy, Leah, and Penny

### 🎬 State Management
- Multiple avatar states: Idle, Talking, Waiting, Thinking, Listening, Error
- Smooth state transitions with appropriate frame switching
- Interactive state debugging controls

### 📍 Position Tracking
- Real-time cursor position tracking in VS Code editor
- Avatar position detection within webview
- Offset calculation between cursor and avatar positions
- Click avatar to trigger position analysis

### 🎨 VS Code Integration
- Native VS Code theming support
- Sidebar integration in Explorer tab
- Responsive design that adapts to sidebar width
- Error handling with fallback images

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to launch a new VS Code window with the extension loaded

## Usage

### Character Management
1. Open the Explorer sidebar in VS Code
2. Find the "Judy Sidebar" section
3. Select a character from the dropdown menu
4. Choose different states using the state selector

### Position Tracking
- Move your cursor in any editor - position is automatically tracked
- Click on the avatar image to calculate offset between cursor and avatar
- View position data in the console and on-screen overlay

### Adding New Characters

1. Create a new folder in `src/avatars/characters/[character-name]/`
2. Add a `character.json` file with character configuration:

```json
{
  "id": "character-name",
  "name": "character-name",
  "displayName": "Display Name",
  "description": "Character description",
  "version": "1.0.0",
  "systemPrompt": "Character personality prompt",
  "author": "Author Name",
  "tags": ["tag1", "tag2"],
  "created": "2024-01-01T00:00:00Z",
  "updated": "2024-01-01T00:00:00Z",
  "enabled": true,
  "frames": {
    "idle": "idle.png",
    "talking": "talking.gif",
    "waiting": "waiting.png",
    "thinking": "thinking.png",
    "listening": "listening.png",
    "error": "error.png"
  }
}
```

3. Create a `frames/` subfolder with the corresponding image files
4. Update `package.json` to include the new character in the enum

## Configuration

The extension contributes the following VS Code settings:

- `judy.currentCharacter`: Select the active character (judy, leah, penny)

## File Structure

```
src/
├── extension.ts              # Extension entry point
├── sidebarProvider.ts        # Main webview provider
├── webview.html             # Webview HTML template
├── webview.css              # Webview styles
├── webview.js               # Webview JavaScript logic
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

## Development

### Building
```bash
npm run compile
```

### Adding Features
1. Modify TypeScript files in `src/`
2. Update webview files for UI changes
3. Run compile to check for errors
4. Test in VS Code development window

### Error Handling
- Missing character frames fall back to `default.png`
- TypeScript compilation excludes problematic dependency files
- Console logging for debugging position tracking

## Known Issues

- Position calculation is currently in development
- Some external dependencies may show TypeScript warnings (safely ignored)
- Avatar positioning uses webview coordinates (not absolute screen position)

## Release Notes

### 1.0.0
- Initial release with multi-character avatar framework
- Basic state management and character switching
- Sidebar integration with VS Code

### 1.1.0
- Added cursor position tracking
- Implemented avatar position detection
- Added offset calculation system
- Improved error handling and fallback images

## Technical Details

### Architecture
- **Extension Host**: Manages VS Code integration and cursor tracking
- **Webview**: Handles avatar display and user interaction
- **Avatar Manager**: Coordinates character data and frame management
- **Message System**: Bidirectional communication between extension and webview

### Supported File Formats
- PNG for static frames
- GIF for animated sequences
- Automatic MIME type detection
- Base64 encoding for webview compatibility

---

**Enjoy using Judy! 🎭**