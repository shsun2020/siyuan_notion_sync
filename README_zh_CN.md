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