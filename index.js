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

            // 添加命令 - 在命令面板中可用
            this.addCommand({
                label: this.i18n.sync.title,
                lang: this.i18n.plugin.name,
                langChecked: this.i18n.plugin.name,
                click: () => {
                    this.ui.showMainPanel();
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
        if (this.ui) {
            this.ui.showMainPanel();
        } else {
            console.error("[SiYuan Notion Sync] UI not initialized");
        }
    }

    tryAddToolbarIcon() {
        // 尝试多种选择器来查找工具栏
        const selectors = ["#toolbar", ".toolbar", "#topbar", ".top-bar", ".fn__flex.toolbar"];
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
        btn.onclick = () => this.ui.showMainPanel();

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

            this.log(this.i18n.sync.complete.replace("{success}", successCount).replace("{failed}", failCount));
            return { success: true, message: "Success: " + successCount + ", Failed: " + failCount };
        } catch (e) {
            this.config.syncStatus = "error";
            this.config.syncLog.push("Error: " + e.message);
            this.saveConfig();
            this.ui.updateSyncStatus();
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