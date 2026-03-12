# SiYuan Notion Sync

A SiYuan plugin that synchronizes notes from SiYuan to Notion.

## Features

- **One-way Sync**: Synchronize notes from SiYuan to Notion
- **Notebook Mapping**: Each SiYuan notebook becomes a page in Notion
- **Format Support**:
  - Headings (H1-H6)
  - Paragraphs
  - Code blocks (with syntax highlighting)
  - Lists (bulleted, numbered, task lists)
  - Tables
  - Images (external URLs)
  - Bookmarks
  - Blockquotes
  - Dividers
- **Progress Tracking**: Real-time sync progress and logs
- **i18n Support**: English and Chinese (Simplified) interfaces

## Installation

### From SiYuan Marketplace (Recommended)

1. Open SiYuan Note
2. Go to **Settings** → **Plugins** → **Marketplace**
3. Search for "SiYuan Notion Sync"
4. Click Install

### Manual Installation

1. Download the latest release package from [GitHub Releases](https://github.com/shsun2020/siyuan_notion_sync/releases)
2. Extract the package to your SiYuan plugins directory:
   - Windows: `%APPDATA%\siyuan-note\plugins\`
   - macOS: `~/Library/Application Support/siyuan-note/plugins/`
   - Linux: `~/.config/siyuan-note/plugins/`
3. Rename the folder to `siyuan-notion-sync`
4. Restart SiYuan

## Configuration

### Step 1: Create a Notion Integration

1. Go to [Notion My Integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Enter a name (e.g., "SiYuan Sync")
4. Click **Submit**
5. Copy the **Internal Integration Token** (starts with `secret_`)

### Step 2: Share a Page with the Integration

1. Create a new page in Notion (or use an existing one)
2. Click the **...** menu in the top right
3. Click **Connect to**
4. Select your integration ("SiYuan Sync")
5. Copy the page URL and extract the 32-character page ID

### Step 3: Configure the Plugin

1. Click the plugin icon in the SiYuan toolbar
2. Enter your Notion API Key
3. (Optional) Enter the Parent Page ID
4. Click **Test Connection** to verify
5. Click **Save**

## Usage

1. Click the plugin icon in the SiYuan toolbar
2. Click **Start Sync**
3. Watch the progress as your notebooks are synchronized to Notion

Each SiYuan notebook will become a top-level page in Notion, with all documents inside as sub-pages.

## Project Structure

```
siyuan-notion-sync/
├── index.js          # Main plugin entry
├── plugin.json       # Plugin configuration
├── icon.png          # Plugin icon (160x160)
├── index.css         # Styles (if needed)
├── conf/
│   └── config.json   # User configuration
├── src/
│   ├── siyuan.js     # SiYuan API client
│   ├── notion.js     # Notion API client
│   ├── transformer.js# Format transformer
│   └── ui.js         # Plugin UI
└── release/
    └── package.zip   # Distribution package
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Build package
pnpm run build
```

### Build Output

The build script creates `release/package.zip` containing:
- `index.js` - Main entry
- `plugin.json` - Plugin config
- `icon.png` - Plugin icon
- `README.md` or `README_zh_CN.md` - Readme
- `conf/` - Configuration directory
- `src/` - Source modules

### Publishing to Marketplace

1. Create a GitHub Release with version tag (e.g., v1.0.0)
2. Upload `package.zip` as a binary attachment
3. Submit a PR to [siyuan-note/bazaar](https://github.com/siyuan-note/bazaar) to add your plugin to `plugins.txt`

## Supported SiYuan Block Types

| SiYuan Block | Notion Block |
|--------------|--------------|
| h1-h6 | heading_1-3 |
| p | paragraph |
| code | code |
| ul/li | bulleted_list_item |
| ol | numbered_list_item |
| task | to_do |
| table | table |
| blockquote | quote |
| hr | divider |
| img | image |
| bookmark | bookmark |

## Known Limitations

- **One-way sync**: Only SiYuan → Notion is supported
- **Images**: Only external URL images are supported (not base64/local)
- **Rate limiting**: Notion API has rate limits; the plugin adds delays between requests
- **Incremental sync**: Full sync each time; no delta sync

## License

MIT

## Support

- GitHub Issues: https://github.com/shsun2020/siyuan_notion_sync/issues
- Notion API Documentation: https://developers.notion.com/
- SiYuan Plugin Development: https://github.com/siyuan-note/petal