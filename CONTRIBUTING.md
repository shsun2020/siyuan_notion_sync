# Contributing to SiYuan Notion Sync

Thank you for your interest in contributing!

## Ways to Contribute

1. **Report bugs** - Open an issue with details
2. **Suggest features** - Open an issue with your idea
3. **Fix bugs** - Submit a pull request
4. **Add features** - Submit a pull request
5. **Improve documentation** - Submit a pull request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/shsun2020/siyuan_notion_sync.git
cd siyuan_notion_sync

# Install dependencies
pnpm install

# Build the plugin
pnpm run build
```

## Testing the Plugin

### Option 1: Manual Testing

1. Build the plugin: `pnpm run build`
2. Copy `release/package.zip` content to SiYuan plugins folder:
   - Windows: `%APPDATA%\siyuan-note\plugins\siyuan-notion-sync\`
   - macOS: `~/Library/Application Support/siyuan-note/plugins/siyuan-notion-sync/`
   - Linux: `~/.config/siyuan-note/plugins/siyuan-notion-sync/`
3. Restart SiYuan

### Option 2: Enable Development Mode

Set `conf/config.json` with `"devMode": true` to enable debug logging.

## Code Style

- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Use meaningful variable names
- Follow existing code patterns

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test locally
5. Commit with clear messages
6. Push to your fork
7. Submit a Pull Request

## Commit Message Format

```
<type>: <description>

[optional body]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Testing

Example:
```
feat: Add incremental sync support

- Track document last modified time
- Only sync documents changed since last sync
- Add sync history to config
```

## Issue Guidelines

When opening an issue, include:

1. **Bug reports**:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Plugin version
   - SiYuan version

2. **Feature requests**:
   - What you want to achieve
   - Why it's useful
   - Any implementation ideas

## License

By contributing, you agree that your contributions will be licensed under the MIT License.