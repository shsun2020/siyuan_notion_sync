/**
 * Plugin UI Module
 * 插件用户界面 - 整合设置和同步面板
 */

const { NotionClient } = require("./notion.js");

class PluginUI {
    constructor(plugin) {
        this.plugin = plugin;
        this.mainPanel = null;
    }

    i18n(key) {
        return this.plugin.i18n[key] || key;
    }

    /**
     * 显示主面板 - 包含设置和同步
     */
    showMainPanel() {
        // 移除已存在的面板
        const existing = document.querySelector(".sy-notion-sync-main");
        if (existing) {
            existing.remove();
        }

        const panel = document.createElement("div");
        panel.className = "sy-notion-sync-main";
        panel.innerHTML = this.getMainPanelHTML();

        document.body.appendChild(panel);
        this.mainPanel = panel;

        this.bindMainPanelEvents();
    }

    /**
     * 获取主面板HTML
     */
    getMainPanelHTML() {
        const config = this.plugin.config;
        const lastSync = config.lastSyncTime
            ? new Date(config.lastSyncTime).toLocaleString()
            : this.i18n("sync.never");

        let logHtml = "";
        if (config.syncLog && config.syncLog.length > 0) {
            logHtml = config.syncLog.map(log => '<div class="sync-log-item">' + log + '</div>').join("");
        }

        return '<div class="b3-dialog__mask">' +
            '<div class="b3-dialog__container" style="max-width: 550px;">' +
            '<div class="b3-dialog__header">' +
            '<span class="b3-dialog__title">' + this.i18n("sync.title") + '</span>' +
            '<svg class="b3-dialog__close">' +
            '<use xlink:href="#iconClose"></use>' +
            '</svg>' +
            '</div>' +
            '<div class="b3-dialog__content">' +

            // 设置区域
            '<div class="config-section">' +
            '<div class="b3-form__group">' +
            '<label class="b3-form__label">' + this.i18n("settings.apiKey") + '</label>' +
            '<input type="password" class="b3-text-field fn__block" ' +
            'id="notion-api-key" placeholder="secret_xxx..." ' +
            'value="' + (config.notionApiKey || '') + '">' +
            '</div>' +
            '<div class="b3-form__group">' +
            '<label class="b3-form__label">' + this.i18n("settings.parentPage") + '</label>' +
            '<input type="text" class="b3-text-field fn__block" ' +
            'id="notion-parent-page" placeholder="32位页面ID，留空则创建新页面" ' +
            'value="' + (config.notionParentPageId || '') + '">' +
            '</div>' +
            '<div class="b3-form__group fn__flex">' +
            '<button class="b3-button b3-button--outline" id="test-connection">' +
            this.i18n("settings.testConnection") +
            '</button>' +
            '<button class="b3-button b3-button--success" id="save-config">' +
            this.i18n("settings.save") +
            '</button>' +
            '<span id="connection-result" style="margin-left: 12px; line-height: 32px;"></span>' +
            '</div>' +
            '</div>' +

            // 同步状态
            '<div class="sync-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--b3-theme-surface-hover);">' +
            '<div class="fn__flex" style="justify-content: space-between; margin-bottom: 12px;">' +
            '<span>' + this.i18n("sync.lastSync") + ': ' + lastSync + '</span>' +
            '<span id="sync-status-text">' + this.getStatusText(config.syncStatus) + '</span>' +
            '</div>' +
            '<div class="progress-container" id="sync-progress-container" style="display: none; margin-bottom: 12px;">' +
            '<div class="b3-progress b3-progress--inline" style="flex: 1;">' +
            '<div class="b3-progress__bar" id="sync-progress-bar" style="width: 0%;"></div>' +
            '</div>' +
            '<span id="sync-progress-text" style="margin-left: 12px;">0%</span>' +
            '</div>' +
            '<div class="sync-log" id="sync-log" style="max-height: 150px; overflow-y: auto; padding: 8px; background: var(--b3-theme-surface); border-radius: 4px; font-size: 12px;">' +
            logHtml +
            '</div>' +
            '</div>' +

            '</div>' +
            '<div class="b3-dialog__footer">' +
            '<button class="b3-button b3-button--cancel" id="close-panel">' + this.i18n("sync.close") + '</button>' +
            '<button class="b3-button b3-button--success" id="start-sync"' + (config.syncStatus === "running" ? " disabled" : "") + '>' +
            this.i18n("sync.start") +
            '</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            "idle": this.i18n("sync.statusIdle"),
            "running": this.i18n("sync.statusRunning"),
            "completed": this.i18n("sync.statusCompleted"),
            "error": this.i18n("sync.statusError")
        };
        return statusMap[status] || "Unknown";
    }

    /**
     * 绑定主面板事件
     */
    bindMainPanelEvents() {
        const panel = this.mainPanel;

        // 关闭
        panel.querySelector(".b3-dialog__close").onclick = () => this.closePanel();
        panel.querySelector("#close-panel").onclick = () => this.closePanel();
        panel.querySelector(".b3-dialog__mask").onclick = (e) => {
            if (e.target === panel.querySelector(".b3-dialog__mask")) {
                this.closePanel();
            }
        };

        // 测试连接
        panel.querySelector("#test-connection").onclick = async () => {
            const apiKey = panel.querySelector("#notion-api-key").value.trim();
            const parentPage = panel.querySelector("#notion-parent-page").value.trim();
            const resultEl = panel.querySelector("#connection-result");

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

        // 保存配置
        panel.querySelector("#save-config").onclick = () => {
            const apiKey = panel.querySelector("#notion-api-key").value.trim();
            const parentPage = panel.querySelector("#notion-parent-page").value.trim();

            this.plugin.updateConfig({
                notionApiKey: apiKey,
                notionParentPageId: parentPage
            });

            const resultEl = panel.querySelector("#connection-result");
            resultEl.textContent = this.i18n("sync.success");
            resultEl.style.color = "green";
        };

        // 开始同步
        panel.querySelector("#start-sync").onclick = async () => {
            await this.plugin.startSync();
        };
    }

    /**
     * 更新同步状态
     */
    updateSyncStatus() {
        if (!this.mainPanel) return;

        const config = this.plugin.config;

        // 状态文本
        const statusText = this.mainPanel.querySelector("#sync-status-text");
        if (statusText) {
            statusText.textContent = this.getStatusText(config.syncStatus);
        }

        // 进度条
        const progressContainer = this.mainPanel.querySelector("#sync-progress-container");
        const progressBar = this.mainPanel.querySelector("#sync-progress-bar");
        const progressText = this.mainPanel.querySelector("#sync-progress-text");

        if (config.syncStatus === "running") {
            progressContainer.style.display = "flex";
            progressBar.style.width = config.syncProgress + "%";
            progressText.textContent = config.syncProgress + "%";
        } else {
            progressContainer.style.display = "none";
        }

        // 日志
        const syncLogEl = this.mainPanel.querySelector("#sync-log");
        if (syncLogEl && config.syncLog) {
            syncLogEl.innerHTML = config.syncLog.map(log => '<div class="sync-log-item">' + log + '</div>').join("");
            syncLogEl.scrollTop = syncLogEl.scrollHeight;
        }

        // 同步按钮
        const startBtn = this.mainPanel.querySelector("#start-sync");
        if (startBtn) {
            startBtn.disabled = config.syncStatus === "running";
        }
    }

    /**
     * 关闭面板
     */
    closePanel() {
        if (this.mainPanel) {
            this.mainPanel.remove();
            this.mainPanel = null;
        }
    }
}

module.exports = { PluginUI };