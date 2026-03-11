# Developer Guide

This document provides technical details for developers who want to understand, extend, or contribute to the SiYuan Notion Sync plugin.

## Architecture Overview

The plugin follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     index.js (Plugin Core)                  │
│  - Plugin lifecycle management                               │
│  - Configuration management                                  │
│  - UI event binding                                          │
│  - Sync orchestration                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  siyuan.js    │ │ transformer.js│ │  notion.js    │
│  (Data Source)│ │  (Converter)  │ │ (Data Target) │
└───────────────┘ └───────────────┘ └───────────────┘
                        │
                        ▼
               ┌───────────────┐
               │     ui.js     │
               │ (UI Render)   │
               └───────────────┘
```

## Core Modules

### 1. index.js (Main Entry)

The main plugin class extends SiYuan's `Plugin` base class.

**Key Methods:**

- `onload()`: Plugin initialization
- `startSync()`: Orchestrates the sync process
- `loadConfig()` / `saveConfig()`: Configuration persistence
- `getSettingsHTML()`: Generates settings panel HTML

**Configuration Schema:**

```javascript
{
  notionApiKey: string,      // Notion API Token
  notionParentPageId: string, // Optional parent page ID
  lastSyncTime: string,      // ISO timestamp
  syncStatus: string,        // 'idle' | 'running' | 'completed' | 'error'
  syncProgress: number,      // 0-100
  syncLog: string[]          // Array of log messages
}
```

### 2. src/siyuan.js (SiYuan API Client)

Handles communication with SiYuan's internal API.

**Key Methods:**

- `getNotebooks()`: List all notebooks
- `getDocumentsFromNotebook(notebookId)`: Get all docs in a notebook
- `getDocument(docId)`: Get full document content
- `getFileTree(notebookId)`: Get notebook file tree

**API Endpoints Used:**
- `/api/notebook/lsNotebooks`
- `/api/filetree/getTree`
- `/api/filetree/getDoc`
- `/api/filetree/getDocInfo`

### 3. src/transformer.js (Format Converter)

Converts SiYuan block format to Notion block format.

**Supported Conversions:**

| SiYuan Type | Notion Type | Method |
|-------------|-------------|--------|
| h1-h6 | heading_1-3 | createHeadingBlock() |
| p | paragraph | createParagraphBlock() |
| code | code | createCodeBlock() |
| ul/li | bulleted_list_item | createBulletedListItemBlock() |
| ol | numbered_list_item | createNumberedListItemBlock() |
| task | to_do | createToDoBlock() |
| table | table | createTableBlock() |
| blockquote | quote | createQuoteBlock() |
| hr | divider | createDividerBlock() |
| img | image | createImageBlock() |
| bookmark | bookmark | createBookmarkBlock() |

### 4. src/notion.js (Notion API Client)

Wraps Notion's REST API (v2022-06-28).

**Key Methods:**

- `testConnection(parentPageId)`: Verify API key and optional page access
- `createPageWithTitle(parentId, title)`: Create a new page
- `createPageAsChild(parentPageId, title, blocks)`: Create sub-page with content
- `appendBlocks(pageId, blocks)`: Add blocks to a page (handles chunking)

**Rate Limiting:**
- Notion API: 3 requests per second
- Implementation: 350ms delay between requests

### 5. src/ui.js (UI Renderer)

Generates and manages the plugin's modal dialog.

**Key Methods:**

- `showMainPanel()`: Display the main dialog
- `updateSyncStatus()`: Update progress bar and logs in real-time
- `closePanel()`: Close and clean up the dialog

## Sync Flow

```
1. User clicks "Start Sync"
       │
       ▼
2. Set status to "running", reset progress
       │
       ▼
3. Get all notebooks from SiYuan
       │
       ▼
4. For each notebook:
   ├─ Get all documents
   ├─ Create notebook page in Notion
   └─ For each document:
       ├─ Transform SiYuan blocks to Notion blocks
       ├─ Create document as sub-page
       ├─ Update progress
       └─ Wait 350ms (rate limiting)
       │
       ▼
5. Set status to "completed", save timestamp
```

## Internationalization (i18n)

The plugin supports both English (en_US) and Simplified Chinese (zh_CN).

**i18n Structure in index.js:**

```javascript
i18n: {
    en_US: {
        "plugin.name": "SiYuan Notion Sync",
        "settings.apiKey": "Notion API Key",
        // ...
    },
    zh_CN: {
        "plugin.name": "SiYuan Notion 同步",
        "settings.apiKey": "Notion API Key",
        // ...
    }
}
```

## Plugin Configuration (plugin.json)

Required fields for SiYuan marketplace:

```json
{
    "name": "siyuan-notion-sync",
    "version": "1.0.0",
    "author": "Your Name",
    "url": "https://github.com/username/repo",
    "icon": "icon.png",
    "displayName": {
        "default": "Plugin Name",
        "zh_CN": "插件名称"
    },
    "description": {
        "default": "Description",
        "zh_CN": "描述"
    },
    "readme": {
        "default": "README.md",
        "zh_CN": "README_zh_CN.md"
    },
    "minAppVersion": "3.0.0",
    "category": "tool",
    "keywords": ["tag1", "tag2"],
    "backends": ["all"],
    "frontends": ["all"]
}
```

## Building the Plugin

The build process creates a `package.zip` for distribution:

```bash
pnpm run build
```

**Build script (build.js) uses archiver to package:**
- index.js
- plugin.json
- icon.png
- README.md / README_zh_CN.md
- conf/ directory (empty, created at runtime)
- src/ directory (all modules)

## Common Issues & Debugging

### Debug Logging

Logs are prefixed with `[SiYuan Notion Sync]` and include:
- Configuration loading/saving
- API calls and responses
- Sync progress and errors

### Configuration Location

- Windows: `%APPDATA%\siyuan-note\plugins\siyuan-notion-sync\conf\config.json`
- macOS: `~/Library/Application Support/siyuan-note/plugins/siyuan-notion-sync/conf/config.json`
- Linux: `~/.config/siyuan-note/plugins/siyuan-notion-sync/conf/config.json`

### Testing Notion API

Use the built-in "Test Connection" button in the plugin UI. It will:
1. Verify the API key is valid
2. If parent page ID provided, verify access to that page

## Future Enhancements

Potential improvements (contributions welcome):
1. **Incremental sync**: Only sync changed documents
2. **Two-way sync**: Sync changes back to SiYuan
3. **Selective sync**: Choose which notebooks to sync
4. **Scheduled sync**: Auto-sync at intervals
5. **Conflict resolution**: Handle edit conflicts

## License

MIT - See LICENSE file for details.