# SiYuan Notion 同步

将 SiYuan（思源笔记）中的笔记本和文档同步到 Notion。

## 功能特点

- 将 SiYuan 笔记本同步为 Notion 页面
- 将 SiYuan 文档同步为 Notion 子页面
- 保留文档的基本格式（标题、段落、列表、代码块等）
- 支持手动触发同步

## 安装步骤

### 方式一：直接从市场安装（推荐）

1. 打开 SiYuan 笔记
2. 进入 **设置 → 插件 → 市场**
3. 搜索 "SiYuan Notion Sync" 或 "Notion 同步"
4. 点击安装

### 方式二：手动安装

1. 找到 SiYuan 插件目录：
   - Windows: `%appdata%\siyuan\plugins\`
   - macOS: `~/Library/Application Support/siyuan/plugins/`
   - Linux: `~/.config/siyuan/plugins/`

2. 在 plugins 目录下创建新文件夹，命名为 `siyuan-notion-sync`

3. 将插件文件复制到该文件夹

4. 重启 SiYuan 笔记

## 使用教程

### 打开插件的方式

**方法一：命令面板（推荐）**

1. 在 SiYuan 中按 `Ctrl + Shift + P`（或 macOS `Cmd + Shift + P`）
2. 搜索 "Sync to Notion" 或 "Notion"
3. 点击结果打开插件面板

**方法二：插件设置**

1. 点击左下角 **设置**
2. 进入 **插件** 选项卡
3. 找到 "SiYuan Notion 同步" 插件
4. 点击插件可打开设置面板

### 第一步：创建 Notion 集成

1. 打开 [Notion My Integrations](https://www.notion.so/my-integrations)

2. 点击 **+ New integration** 创建新集成

3. 填写集成名称（如 "SiYuan Sync"），选择工作区

4. 点击 **Submit** 提交

5. **重要**：复制显示的 API Key（以 `secret_` 开头）
   - 这个密钥只会显示一次，请妥善保存

### 第二步：连接集成到页面（可选）

如果你想将笔记同步到某个 Notion 页面下：

1. 打开 Notion，找到目标页面

2. 点击页面右上角的 **...** 按钮

3. 选择 **Connect to** → 选择你的集成

4. 复制该页面的链接，页面 ID 就是链接中 `/` 后面的 32 位字符：
   ```
   https://notion.so/your-workspace/页面名称-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                                                   ↑ 这里就是页面 ID
   ```

### 第三步：配置并同步

1. 在插件界面中：
   - **Notion API Key**: 粘贴第一步获取的 API Key
   - **父页面 ID**（可选）: 填写第二步获取的页面 ID，留空则创建新页面

2. 点击 **测试连接** 验证配置是否正确

3. 点击 **保存** 保存配置

4. 点击 **开始同步** 等待同步完成

## 同步结构

同步后的 Notion 结构如下：

```
Notion 工作区
├── SiYuan 笔记本 1（作为页面）
│   ├── 文档 1（作为子页面）
│   ├── 文档 2（作为子页面）
│   └── ...
├── SiYuan 笔记本 2（作为页面）
│   └── ...
└── ...
```

## 支持的内容格式

- 标题（H1-H6）
- 段落文本
- 有序列表、无序列表
- 代码块（带语言标识）
- 引用块
- 分割线
- 图片（需为外部链接）

## 注意事项

1. **API 限速**: Notion API 限制每秒 3 次请求，插件已内置延迟

2. **图片同步**: SiYuan 本地图片（base64）无法直接同步，请使用图床链接

3. **首次同步**: 首次同步会创建全新页面

4. **同步方向**: 当前为单向同步（SiYuan → Notion）

## 常见问题

**Q: 找不到插件？**
A:
   - 使用命令面板：`Ctrl + Shift + P` 搜索 "Sync to Notion"
   - 或进入 **设置 → 插件** 找到 "SiYuan Notion 同步" 插件点击

**Q: 测试连接失败？**
A: 请检查：
   - API Key 是否正确复制（以 `secret_` 开头）
   - 如填写了父页面 ID，确保该页面已连接到此集成

**Q: 同步很慢？**
A: 这是正常的，Notion API 有限速，插件已设置 350ms 延迟

**Q: 能同步图片吗？**
A: 可以，但图片必须是外部 URL（如图床链接），本地图片无法同步

## 项目结构

```
siyuan-notion-sync/
├── index.js          # 插件主入口
├── plugin.json       # 插件配置
├── icon.png          # 插件图标 (160x160)
├── index.css         # 样式文件
├── conf/
│   └── config.json   # 用户配置（存储在插件目录）
├── src/
│   ├── siyuan.js     # SiYuan API 客户端
│   ├── notion.js     # Notion API 客户端
│   ├── transformer.js# 格式转换器（SiYuan → Notion）
│   └── ui.js         # 插件界面
└── release/
    └── package.zip   # 分发包
```

## 开发指南

### 前置要求

- Node.js 18+
- pnpm（推荐）或 npm

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/shsun2020/siyuan_notion_sync.git
cd siyuan_notion_sync

# 2. 安装依赖
pnpm install

# 3. 构建插件包
pnpm run build

# 4. 打包后的文件在 release/package.zip
```

### 发布到 SiYuan 集市

1. 创建 GitHub Release，添加语义化版本标签（如 v1.0.0）
2. 将 `release/package.zip` 作为二进制附件上传
3. 向 [siyuan-note/bazaar](https://github.com/siyuan-note/bazaar) 提交 Pull Request
4. 在 `plugins.txt` 中添加 `shsun2020/siyuan_notion_sync`

## 支持的 SiYuan 块类型

| SiYuan 块 | Notion 块 |
|-----------|-----------|
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

## 许可证

MIT

## 相关链接

- GitHub: https://github.com/shsun2020/siyuan_notion_sync
- Notion API 文档: https://developers.notion.com/
- SiYuan 插件开发: https://github.com/siyuan-note/petal