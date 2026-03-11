// 引入 siyuan 包中的相关的组件和方法
const { Plugin, getFrontend } = require("siyuan");
const path = require("path");
const fs = require("fs");

// 引入模块
const { SiYuanClient } = require("./src/siyuan.js");
const { NotionClient } = require("./src/notion.js");
const { Transformer } = require("./src/transformer.js");
const { PluginUI } = require("./src/ui.js");

// #region **************************** 定义插件，这是插件的总入口  ****************************
module.exports = class SiYuanNotionSyncPlugin extends Plugin {

    constructor() {
        super({
            name: "siyuan-notion-sync",
            i18n: {
                en_US: {
                    "plugin.name": "SiYuan Notion Sync",
                    "plugin.description": "Sync SiYuan notes to Notion",
                    "settings.title": "Settings",
                    "settings.apiKey": "Notion API Key",
                    "settings.parentPage": "Parent Page ID (optional)",
                    "settings.testConnection": "Test Connection",
                    "settings.save": "Save",
                    "settings.cancel": "Cancel",
                    "sync.title": "Sync to Notion",
                    "sync.lastSync": "Last sync",
                    "sync.never": "Never",
                    "sync.status": "Status",
                    "sync.statusIdle": "Idle",
                    "sync.statusRunning": "Syncing...",
                    "sync.statusCompleted": "Completed",
                    "sync.statusError": "Error",
                    "sync.start": "Start Sync",
                    "sync.close": "Close",
                    "sync.success": "Saved",
                    "sync.getApiKeyFirst": "Please configure Notion API Key first",
                    "sync.noDocs": "No documents to sync",
                    "sync.started": "Starting sync...",
                    "sync.complete": "Sync complete! Success: {success}, Failed: {failed}",
                    "sync.error": "Error: {message}"
                },
                zh_CN: {
                    "plugin.name": "SiYuan Notion 同步",
                    "plugin.description": "将SiYuan笔记同步到Notion",
                    "settings.title": "设置",
                    "settings.apiKey": "Notion API Key",
                    "settings.parentPage": "父页面ID（可选）",
                    "settings.testConnection": "测试连接",
                    "settings.save": "保存",
                    "settings.cancel": "取消",
                    "sync.title": "同步到 Notion",
                    "sync.lastSync": "上次同步",
                    "sync.never": "从未",
                    "sync.status": "状态",
                    "sync.statusIdle": "空闲",
                    "sync.statusRunning": "同步中...",
                    "sync.statusCompleted": "已完成",
                    "sync.statusError": "错误",
                    "sync.start": "开始同步",
                    "sync.close": "关闭",
                    "sync.success": "已保存",
                    "sync.getApiKeyFirst": "请先配置Notion API Key",
                    "sync.noDocs": "没有文档需要同步",
                    "sync.started": "开始同步...",
                    "sync.complete": "同步完成! 成功: {success}, 失败: {failed}",
                    "sync.error": "错误: {message}"
                }
            }
        });

        this.dataPath = "";
        this.configPath = "";
        this.config = {};
        this.siyuanClient = null;
        this.notion = null;
        this.transformer = null;
        this.ui = null;
        this.currentTabElement = null;  // 当前打开的Tab元素
    }

    async onload() {
        try {
            console.log("[SiYuan Notion Sync] onload called");

            // 获取前端类型：手机还是PC
            const frontEnd = getFrontend();
            this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

            // Get plugin data path
            this.dataPath = this.path;
            this.configPath = path.join(this.dataPath, "conf", "config.json");
            console.log("[SiYuan Notion Sync] dataPath:", this.dataPath);

            // Ensure directories exist
            const confDir = path.join(this.dataPath, "conf");
            if (!fs.existsSync(confDir)) {
                fs.mkdirSync(confDir, { recursive: true });
            }

            // Load configuration
            this.loadConfig();

            // Initialize modules
            this.siyuanClient = new SiYuanClient(this.app);
            this.transformer = new Transformer();
            this.notion = new NotionClient(this.config.notionApiKey);
            this.ui = new PluginUI(this);

            // 添加设置面板 Tab
            this.addTab({
                type: "siyuan-notion-sync-settings",
                name: "siyuan-notion-sync",
                i18n: "plugin.name",
                // 创建面板的 DOM
                obj: {
                    display: (element) => {
                        this.currentTabElement = element;
                        element.innerHTML = this.getSettingsHTML();
                        this.bindSettingsEvents(element);
                    }
                }
            });

            // 添加命令 - 在命令面板中可用
            this.addCommand({
                label: this.i18n.sync.title,
                lang: this.i18n.plugin.name,
                langChecked: this.i18n.plugin.name,
                click: () => {
                    this.openConfig();
                }
            });

            // 尝试添加工具栏图标
            this.tryAddToolbarIcon();

            console.log("[SiYuan Notion Sync] Plugin loaded");
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error in onload:", e);
        }
    }

    // 点击插件图标时打开设置面板
    openConfig() {
        console.log("[SiYuan Notion Sync] openConfig called");
        // 使用原有的modal方式打开面板（更可靠）
        if (this.ui) {
            this.ui.showMainPanel();
        } else {
            console.error("[SiYuan Notion Sync] UI not initialized");
        }
    }

    /**
     * 获取设置面板 HTML - 包含设置和同步功能
     */
    getSettingsHTML() {
        const config = this.config;
        const lastSync = config.lastSyncTime
            ? new Date(config.lastSyncTime).toLocaleString()
            : this.i18n.sync.never;

        const statusText = this.getStatusText(config.syncStatus);

        let logHtml = "";
        if (config.syncLog && config.syncLog.length > 0) {
            logHtml = config.syncLog.map(log => '<div class="sync-log-item">' + log + '</div>').join("");
        }

        return `
            <div class="siyuan-notion-sync-panel">
                <h3>${this.i18n.settings.title}</h3>
                <div class="siyuan-notion-sync-form">
                    <div class="b3-form__group">
                        <label class="b3-form__label">${this.i18n.settings.apiKey}</label>
                        <input type="password" class="b3-text-field fn__block"
                            id="notion-api-key" placeholder="secret_xxx..."
                            value="${config.notionApiKey || ''}">
                    </div>
                    <div class="b3-form__group">
                        <label class="b3-form__label">${this.i18n.settings.parentPage}</label>
                        <input type="text" class="b3-text-field fn__block"
                            id="notion-parent-page" placeholder="32位页面ID，留空则创建新页面"
                            value="${config.notionParentPageId || ''}">
                    </div>
                    <div class="siyuan-notion-sync-buttons">
                        <button class="b3-button b3-button--outline" id="test-connection">
                            ${this.i18n.settings.testConnection}
                        </button>
                        <button class="b3-button b3-button--success" id="save-config">
                            ${this.i18n.settings.save}
                        </button>
                        <span id="connection-result" style="margin-left: 12px; line-height: 32px;"></span>
                    </div>
                </div>

                <!-- 同步区域 -->
                <div class="sync-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--b3-theme-surface-hover);">
                    <div class="fn__flex" style="justify-content: space-between; margin-bottom: 12px;">
                        <span>${this.i18n.sync.lastSync}: ${lastSync}</span>
                        <span id="sync-status-text">${statusText}</span>
                    </div>
                    <div class="progress-container" id="sync-progress-container" style="display: ${config.syncStatus === 'running' ? 'flex' : 'none'}; margin-bottom: 12px;">
                        <div class="b3-progress b3-progress--inline" style="flex: 1;">
                            <div class="b3-progress__bar" id="sync-progress-bar" style="width: ${config.syncProgress}%;"></div>
                        </div>
                        <span id="sync-progress-text" style="margin-left: 12px;">${config.syncProgress}%</span>
                    </div>
                    <div class="sync-log" id="sync-log" style="max-height: 150px; overflow-y: auto; padding: 8px; background: var(--b3-theme-surface); border-radius: 4px; font-size: 12px; margin-bottom: 12px;">
                        ${logHtml}
                    </div>
                    <button class="b3-button b3-button--success fn__block" id="start-sync" ${config.syncStatus === 'running' ? 'disabled' : ''}>
                        ${this.i18n.sync.start}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            "idle": this.i18n.sync.statusIdle,
            "running": this.i18n.sync.statusRunning,
            "completed": this.i18n.sync.statusCompleted,
            "error": this.i18n.sync.statusError
        };
        return statusMap[status] || "Unknown";
    }

    /**
     * 绑定设置面板事件
     */
    bindSettingsEvents(element) {
        const self = this;

        // 测试连接
        const testBtn = element.querySelector("#test-connection");
        if (testBtn) {
            testBtn.onclick = async () => {
                const apiKey = element.querySelector("#notion-api-key").value.trim();
                const parentPage = element.querySelector("#notion-parent-page").value.trim();
                const resultEl = element.querySelector("#connection-result");

                resultEl.textContent = "Testing...";
                resultEl.style.color = "#666";

                const tempNotion = new NotionClient(apiKey);
                const result = await tempNotion.testConnection(parentPage);

                if (result.success) {
                    resultEl.textContent = "OK";
                    resultEl.style.color = "green";
                } else {
                    resultEl.textContent = result.message;
                    resultEl.style.color = "red";
                }
            };
        }

        // 保存配置
        const saveBtn = element.querySelector("#save-config");
        if (saveBtn) {
            saveBtn.onclick = () => {
                const apiKey = element.querySelector("#notion-api-key").value.trim();
                const parentPage = element.querySelector("#notion-parent-page").value.trim();

                self.updateConfig({
                    notionApiKey: apiKey,
                    notionParentPageId: parentPage
                });

                const resultEl = element.querySelector("#connection-result");
                resultEl.textContent = self.i18n.sync.success;
                resultEl.style.color = "green";
            };
        }

        // 开始同步
        const startSyncBtn = element.querySelector("#start-sync");
        if (startSyncBtn) {
            startSyncBtn.onclick = async () => {
                await self.startSync();
                // 刷新面板状态
                self.updateTabPanel(element);
            };
        }
    }

    /**
     * 更新Tab面板状态（同步进度等）
     */
    updateTabPanel(element) {
        if (!element) return;

        const config = this.config;

        // 状态文本
        const statusText = element.querySelector("#sync-status-text");
        if (statusText) {
            statusText.textContent = this.getStatusText(config.syncStatus);
        }

        // 进度条
        const progressContainer = element.querySelector("#sync-progress-container");
        const progressBar = element.querySelector("#sync-progress-bar");
        const progressText = element.querySelector("#sync-progress-text");

        if (config.syncStatus === "running") {
            progressContainer.style.display = "flex";
            progressBar.style.width = config.syncProgress + "%";
            progressText.textContent = config.syncProgress + "%";
        } else {
            progressContainer.style.display = "none";
        }

        // 日志
        const syncLogEl = element.querySelector("#sync-log");
        if (syncLogEl && config.syncLog) {
            syncLogEl.innerHTML = config.syncLog.map(log => '<div class="sync-log-item">' + log + '</div>').join("");
            syncLogEl.scrollTop = syncLogEl.scrollHeight;
        }

        // 同步按钮
        const startBtn = element.querySelector("#start-sync");
        if (startBtn) {
            startBtn.disabled = config.syncStatus === "running";
        }
    }

    tryAddToolbarIcon() {
        // 尝试多种选择器来查找工具栏（兼容不同版本的 SiYuan）
        const selectors = [
            ".fn__toolbar",           // 新版 SiYuan
            "#toolbar",               // 旧版
            ".toolbar",               // 备用
            "#topbar",                // 备用
            ".top-bar",               // 备用
            ".fn__flex-1",            // 另一版本
            ".toolbar__icon"          // 工具栏图标容器
        ];
        let attempts = 0;
        const maxAttempts = 30;

        const checkToolbar = () => {
            attempts++;

            // 尝试多个选择器
            let toolbar = null;
            for (const sel of selectors) {
                toolbar = document.querySelector(sel);
                if (toolbar) {
                    console.log("[SiYuan Notion Sync] Found toolbar with selector:", sel);
                    break;
                }
            }

            if (toolbar) {
                // 检查是否已经添加过
                if (toolbar.querySelector(".siyuan-notion-sync-icon")) {
                    console.log("[SiYuan Notion Sync] Icon already added");
                    return;
                }
                this.addRibbon(toolbar);
            } else if (attempts < maxAttempts) {
                console.log("[SiYuan Notion Sync] Toolbar not found, attempt:", attempts);
                setTimeout(checkToolbar, 500);
            } else {
                console.warn("[SiYuan Notion Sync] Failed to find toolbar after", maxAttempts, "attempts");
            }
        };
        checkToolbar();
    }

    onLayoutReady() {
        // 布局准备好后再尝试添加
        setTimeout(() => this.tryAddToolbarIcon(), 2000);
        console.log("[SiYuan Notion Sync] Layout ready");
    }

    onunload() {
        console.log("[SiYuan Notion Sync] Plugin unloaded");
    }

    addRibbon(toolbar) {
        if (!toolbar) {
            console.warn("[SiYuan Notion Sync] No toolbar provided");
            return;
        }

        // 检查是否已经添加过
        if (toolbar.querySelector(".siyuan-notion-sync-icon")) {
            return;
        }

        // Add ribbon button - opens the main panel
        const btn = document.createElement("div");
        btn.className = "toolbar__icon siyuan-notion-sync-icon";
        btn.style.backgroundImage = `url("./plugins/siyuan-notion-sync/siyuan_notion_sync.png")`;
        btn.style.backgroundSize = "24px";
        btn.style.backgroundRepeat = "no-repeat";
        btn.style.backgroundPosition = "center";
        btn.style.width = "28px";
        btn.style.height = "28px";
        btn.style.cursor = "pointer";
        btn.title = "SiYuan Notion Sync";
        btn.onclick = () => this.openConfig();

        toolbar.appendChild(btn);
        console.log("[SiYuan Notion Sync] Toolbar icon added");
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, "utf-8");
                this.config = JSON.parse(data);
            } else {
                this.config = this.getDefaultConfig();
                this.saveConfig();
            }
        } catch (e) {
            console.error("[SiYuan Notion Sync] Failed to load config:", e);
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            notionApiKey: "",
            notionParentPageId: "",
            lastSyncTime: null,
            syncStatus: "idle",
            syncProgress: 0,
            syncLog: []
        };
    }

    saveConfig() {
        try {
            const confDir = path.dirname(this.configPath);
            if (!fs.existsSync(confDir)) {
                fs.mkdirSync(confDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
        } catch (e) {
            console.error("[SiYuan Notion Sync] Failed to save config:", e);
        }
    }

    updateConfig(newConfig) {
        this.config = Object.assign({}, this.config, newConfig);
        this.saveConfig();
        if (newConfig.notionApiKey !== undefined) {
            this.notion = new NotionClient(this.config.notionApiKey);
        }
    }

    async testNotionConnection() {
        if (!this.config.notionApiKey) {
            return { success: false, message: this.i18n.sync.getApiKeyFirst };
        }
        return await this.notion.testConnection(this.config.notionParentPageId);
    }

    async startSync() {
        if (!this.config.notionApiKey) {
            return { success: false, message: this.i18n.sync.getApiKeyFirst };
        }

        this.config.syncStatus = "running";
        this.config.syncProgress = 0;
        this.config.syncLog = [];
        this.saveConfig();
        this.ui.updateSyncStatus();
        this.updateTabPanel(this.currentTabElement);

        try {
            this.log(this.i18n.sync.started);

            // Get all notebooks
            const notebooks = await this.siyuanClient.getNotebooks();
            this.log("Found " + notebooks.length + " notebooks");

            // For each notebook, create a page in Notion
            let successCount = 0;
            let failCount = 0;

            for (let n = 0; n < notebooks.length; n++) {
                const notebook = notebooks[n];
                this.log("Syncing notebook: " + notebook.name);

                try {
                    // Get all documents from this notebook
                    const documents = await this.siyuanClient.getDocumentsFromNotebook(notebook.id);
                    this.log("Found " + documents.length + " documents in " + notebook.name);

                    // Create a page for this notebook
                    const parentId = this.config.notionParentPageId || null;
                    const notebookPage = await this.notion.createPageWithTitle(parentId, notebook.name);

                    // Add each document as a sub-page
                    for (let i = 0; i < documents.length; i++) {
                        const doc = documents[i];
                        try {
                            this.log("Syncing: " + doc.title);

                            const notionBlocks = this.transformer.transform(doc);
                            await this.notion.createPageAsChild(notebookPage.id, doc.title, notionBlocks);

                            successCount++;
                            this.config.syncProgress = Math.round(((n * 100 + (i + 1) * 100 / documents.length) / notebooks.length));
                            this.saveConfig();
                            this.ui.updateSyncStatus();
                            this.updateTabPanel(this.currentTabElement);

                            await this.delay(350);
                        } catch (e) {
                            failCount++;
                            this.log("Failed: " + doc.title + " - " + e.message);
                        }
                    }
                } catch (e) {
                    this.log("Failed to sync notebook " + notebook.name + ": " + e.message);
                    failCount++;
                }
            }

            this.config.lastSyncTime = new Date().toISOString();
            this.config.syncStatus = "completed";
            this.saveConfig();
            this.ui.updateSyncStatus();
            this.updateTabPanel(this.currentTabElement);

            this.log(this.i18n.sync.complete.replace("{success}", successCount).replace("{failed}", failCount));
            return { success: true, message: "Success: " + successCount + ", Failed: " + failCount };
        } catch (e) {
            this.config.syncStatus = "error";
            this.config.syncLog.push("Error: " + e.message);
            this.saveConfig();
            this.ui.updateSyncStatus();
            this.updateTabPanel(this.currentTabElement);
            this.log(this.i18n.sync.error.replace("{message}", e.message));
            return { success: false, message: e.message };
        }
    }

    log(message) {
        const timestamp = new Date().toLocaleString("zh-CN");
        const logEntry = "[" + timestamp + "] " + message;
        this.config.syncLog.push(logEntry);
        console.log("[SiYuan Notion Sync]", logEntry);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
// #region ***************************************