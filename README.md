# SiYuan Notion Sync

Sync SiYuan notebooks and documents to Notion.

## Features

- Sync SiYuan notebooks as Notion pages
- Sync SiYuan documents as Notion sub-pages
- Preserve basic formatting (headings, paragraphs, lists, code blocks, etc.)
- Manual sync trigger

## Installation

### Method 1: Install from Marketplace (Recommended)

1. Open SiYuan
2. Go to **Settings → Plugins → Marketplace**
3. Search for "SiYuan Notion Sync"
4. Click Install

### Method 2: Manual Installation

1. Find SiYuan plugins directory:
   - Windows: `%appdata%\siyuan\plugins\`
   - macOS: `~/Library/Application Support/siyuan/plugins/`
   - Linux: `~/.config/siyuan/plugins/`

2. Create a new folder named `siyuan-notion-sync`

3. Copy plugin files to the folder:
   - plugin.json
   - index.js
   - index.css
   - icon.png
   - src/ directory

4. Restart SiYuan

## User Guide

### Step 1: Create Notion Integration

1. Open [Notion My Integrations](https://www.notion.so/my-integrations)

2. Click **+ New integration**

3. Enter integration name (e.g., "SiYuan Sync"), select workspace

4. Click **Submit**

5. **Important**: Copy the API Key (starts with `secret_`)
   - This key is shown only once, save it safely

### Step 2: Connect Integration to Page (Optional)

If you want to sync under a specific Notion page:

1. Open Notion, find the target page

2. Click **...** button in top right corner

3. Select **Connect to** → Select your integration

4. Copy the page URL, the page ID is the 32-character string after the last `/`:
   ```
   https://notion.so/your-workspace/Page-Name-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                                                     ↑ This is the page ID
   ```

### Step 3: Open Plugin

**Method 1: Command Palette**

1. Press `Ctrl + Shift + P` in SiYuan (or `Cmd + Shift + P` on macOS)
2. Search for "Sync to Notion"
3. Click to open

**Method 2: Toolbar Icon**

1. Look at SiYuan's top toolbar
2. Find the sync icon (two rotating arrows)
3. Click to open

### Step 4: Configure and Sync

1. In the plugin interface:
   - **Notion API Key**: Paste the API Key from Step 1
   - **Parent Page ID** (optional): Enter the page ID from Step 2, leave empty to create new page

2. Click **Test Connection** to verify

3. Click **Save** to save configuration

4. Click **Start Sync** to begin

## Sync Structure

```
Notion Workspace
├── SiYuan Notebook 1 (as page)
│   ├── Document 1 (as sub-page)
│   ├── Document 2 (as sub-page)
│   └── ...
├── SiYuan Notebook 2 (as page)
│   └── ...
└── ...
```

## Supported Content

- Headings (H1-H6)
- Paragraph text
- Ordered/unordered lists
- Code blocks (with language)
- Quote blocks
- Divider
- Images (external URLs only)

## Notes

1. **Rate Limit**: Notion API limits to 3 requests/second, plugin has built-in delay

2. **Images**: SiYuan local images (base64) cannot be synced, use image hosting links

3. **First Sync**: Creates all new pages, subsequent syncs will update incrementally

4. **Sync Direction**: One-way sync (SiYuan → Notion)

## FAQ

**Q: Can't find plugin icon?**
A: Use command palette `Ctrl + Shift + P` and search "Sync to Notion"

**Q: Test connection failed?**
A: Check:
   - Is API Key correct (starts with `secret_`)?
   - If using parent page ID, ensure page is connected to the integration

**Q: Sync is slow?**
A: Normal, Notion API has rate limits, plugin has 350ms delay

**Q: Can it sync images?**
A: Yes, but images must be external URLs (like image hosting), local images cannot be synced