# Changelog

All notable changes to this plugin will be documented in this file.

## [1.0.0] - 2026-03-11

### Added
- Initial release
- One-way sync from SiYuan to Notion
- Notebook to page mapping
- Document to sub-page mapping
- Support for various block types:
  - Headings (H1-H6)
  - Paragraphs
  - Code blocks with syntax highlighting
  - Lists (bulleted, numbered, task lists)
  - Tables
  - Images (external URLs)
  - Bookmarks
  - Blockquotes
  - Dividers
- Real-time sync progress tracking
- Configuration persistence
- Test connection feature
- Internationalization (English and Chinese)
- Toolbar icon integration
- Command palette integration

### Known Limitations
- One-way sync only (SiYuan → Notion)
- Full sync each time (no incremental sync)
- Images must be external URLs (no base64/local)
- Subject to Notion API rate limits

## [1.1.0] - Future

### Planned Features
- Incremental sync (only changed documents)
- Selective notebook sync
- Scheduled automatic sync
- Two-way sync (future consideration)

---

## Release Checklist

For each new release:

1. Update version in:
   - `package.json`
   - `plugin.json`

2. Update CHANGELOG.md

3. Build the package:
   ```bash
   pnpm run build
   ```

4. Create GitHub Release:
   - Tag: `v1.0.0`
   - Upload `release/package.zip`

5. Submit PR to bazaar (if first release or plugin list change)