# Stacker for WhatsApp Web

Stacker is a local sticker organization layer for WhatsApp Web that helps users find, organize, preview, and send stickers faster. It is built as a Chrome Extension (Manifest V3) using React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Floating Right-Side Panel**: Access your organized collection anytime.
- **Folder Management**: Categorize stickers into custom folders with unique colors.
- **Search & Tagging**: Find the perfect sticker by searching for manual tags or folder names.
- **'Save to Stacker' Overlay**: Adds a green '＋' button to native WhatsApp stickers for instant saving.
- **Preview & Direct Send**: View stickers in large format and send them to the active chat with one click.
- **Privacy First**: All data is stored locally in your browser using `chrome.storage.local`.

## Technical Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4
- **Platform**: Chrome Extension Manifest V3

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/thaislugoboni/stacker-extension.git
    cd stacker-extension
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```
    The build artifacts will be generated in the `dist/` directory.

## How to load the unpacked extension in Chrome

1.  Open Google Chrome.
2.  Navigate to `chrome://extensions/`.
3.  Enable **Developer mode** using the toggle in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the `dist/` folder inside your project directory.
6.  Navigate to [web.whatsapp.com](https://web.whatsapp.com/).
7.  Look for the Stacker icon in the side menu header to open the panel.

## Known Limitations

- **Browser Specific**: Currently only supports Chrome and Chromium-based browsers (Edge, Brave, etc.).
- **Local Storage Only**: Folders and tags do not sync across devices as no backend is used for the MVP.
- **WhatsApp UI Changes**: The extension relies on DOM selectors (e.g., `data-testid`). If WhatsApp updates their interface, selectors may need updating.
- **Media Types**: Optimized for static and animated stickers. Support for large GIFs or other media types is limited.

## Future Roadmap

- **OCR & Image Recognition**: Automatically tag stickers using AI to make them searchable without manual effort.
- **Cloud Sync**: Optional encrypted sync for folders across different computers.
- **Batch Actions**: Select multiple stickers at once to move them to folders or delete them.
- **Import/Export**: Export your sticker library metadata as a JSON file for backup.
- **Firefox Support**: Adapt the manifest and storage calls for Firefox/WebExtensions compatibility.

## Technical Deep Dive

### Module Bridge (`src/inject.ts`)
The extension utilizes a Webpack hook to intercept the WhatsApp Web client's internal modules. This allows for direct interaction with the `Store` and `Msg` objects, enabling:
-   **Programmatic Sending**: Using the `Cmd` and `Chat` models to send stickers without manual DOM simulation.
-   **Sticker Metadata Extraction**: Accessing internal `Sticker` models to retrieve high-resolution blob URLs and unique identifiers.

### UI Injection Strategy (`src/content.tsx`)
We use a high-performance `MutationObserver` with debouncing to monitor DOM changes. This ensures that the Stacker button and the React-based management layer are reliably injected into the obfuscated WhatsApp Web interface without causing UI lag.

### Storage & Search
Sticker metadata (tags, folder assignments) is persisted via `chrome.storage.local`. The search functionality is optimized by performing keyword filtering on the background script and only requesting necessary assets (like temporary blob URLs) on-demand to minimize memory footprint.

## Performance Optimizations
-   **Debounced Observers**: DOM mutation checks are limited to 500ms intervals.
-   **Lazy URL Loading**: Sticker images are only fetched and rendered when they appear in the management panel's viewport.
-   **Shadow DOM-ready**: Components are styled with high-specificity selectors to prevent style leakage from WhatsApp's global CSS.

## TypeScript Safety
The project uses strict TypeScript configurations. Key interfaces for WhatsApp's internal structures are maintained in the source to ensure type safety when bridging between the extension context and the page context.
