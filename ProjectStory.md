## Inspiration

Our groupmate Carson had a VSCode pets extension that he found fun to play with. It had a section on the sidebar where you could spawn pets and interact with them. He wanted a more advanced and human-like interactive experience to keep him focused while coding. 

## What it does

Judy AI is a VS Code extension that transforms coding from a solitary experience into an interactive partnership. It features animated AI companions (Judy, Jarvis, Penny, Pudding) living in your sidebar that provide real-time coding assistance, motivation, and emotional support through Google Gemini conversations and ElevenLabs text-to-speech. Users can chat with their companion, pet them for mood boosts, and watch them express different emotions while maintaining conversation context for meaningful productivity assistance.

## How we built it

We built Judy using TypeScript and the VS Code Extension API to create a webview-based sidebar interface. The architecture integrates Google Gemini for conversational AI, ElevenLabs for text-to-speech, and a custom avatar management system with frame-based animations. Key components include:

- **Frontend**: HTML/CSS/JavaScript webview with responsive design and VS Code theming
- **Backend**: TypeScript extension with avatar state management and API integrations
- **Animation System**: Custom frame sequencing for talking, laughing, and thinking animations
- **Character Framework**: JSON-based character definitions with modular personality prompts
- **Audio Processing**: FFmpeg integration for seamless audio playback

The extension uses message passing between the webview and extension host to maintain real-time synchronization between UI interactions and AI responses.

## Challenges we ran into

Funnily enough, getting the pixelart to work correctly was the most challenging. None of us on the team have the artistic skill to draw well. AI image generations tools are still not good at animating, so getting the tools to generate consistent avatars was a pain. Many frames we had to hand draw, which took a lot of time. 

Another thing we struggled with is limited resources. We did not want to pay for API keys, so we kept having to make free accounts to test and develop. Each conversation took up a lot of tokens, so we had to make a lot of API keys, combined with slow APIs at night, made development slow and difficult. 

## Accomplishments that we're proud of

We're particularly proud of our seamless Gemini and ElevenLabs integration workflow. Creating a natural conversation flow where AI responses trigger text-to-speech while maintaining character personality required careful orchestration of multiple APIs. The result is a fluid experience where users feel like they're genuinely talking to their companion rather than interacting with separate tools.

Another major accomplishment is our custom animation system. We initially tried GIFs but switched to individual frame-based animations for better precision and control. This enables sophisticated sequences like our laugh animation (1→2→3, hold, then 3→2→1→default) while preventing conflicts during concurrent interactions.

## What we learned

We learned that AI is still insufficient when dealing with complex work flows. There are segments of the project that we really had to examine and fix ourselves, even when we were very tired, and hoped that pasting a segment of code into ChatGPT would give us a simple fix. 

## What's next for Judy AI

If there is enough interest, we might open-source it. We can let users add their own API keys, create their own characters with prompts, and develop a community around the extension. 