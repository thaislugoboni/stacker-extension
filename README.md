# Stacker - WhatsApp Sticker Manager

Stacker is a Chrome Extension designed to enhance the sticker experience on WhatsApp Web by providing search, categorization, and filtering capabilities.

## Architecture (V2)

The project has been migrated to a modern tech stack:
- **React 19**
- **TypeScript**
- **Vite 8**
- **Tailwind CSS 4**

### Components

1. **Content Script (`src/content.tsx`)**: 
   - Uses React to inject a floating UI into WhatsApp Web.
   - Manages the 'Stacker' button injection and the right-side panel visibility.
   - Communicates with the Background Service Worker and Inject Script.

2. **Inject Script (`src/inject.ts`)**:
   - Injected into the page's execution context.
   - Interacts with WhatsApp's internal JavaScript modules.
   - **Exposed Modules:** `Store`, `Msg`, `Sticker`, `StickerPack`, `Cmd`.

3. **Background Service Worker (`src/background.ts`)**:
   - Manages persistent storage using `chrome.storage.local`.
   - Handles search and metadata management for stickers.

4. **UI Components (`src/components/`)**:
   - `StackerButton`: Toggle button injected into the WhatsApp Web header.
   - `StackerPanel`: Floating right-side panel for organization and search.

## Data Schema

### `stickerMetadata`
```json
{
  "sticker_hash_1": {
    "tags": ["dog", "funny"],
    "folders": ["favorites"],
    "addedAt": 1678901234567
  }
}
```

### `folders`
```json
[
  {
    "id": "favorites",
    "name": "Favorites",
    "color": "#ff0000"
  }
]
```

## Development

### Setup
```bash
npm install
```

### Build
```bash
npm run build
```
The build output will be in the `dist/` directory.

### Loading in Chrome
1. Open `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `stacker/` directory (ensure it contains the `manifest.json` and `dist/` files are correctly referenced if needed, though currently `manifest.json` is in root and points to root of `dist` after build... wait).

Wait, the `manifest.json` in root points to `content.js` but build puts them in `dist/`.
I should probably move `manifest.json` to `public/` or update it to point to `dist/`.
Actually, if I put it in `public/`, Vite copies it to `dist/`. That's better.
