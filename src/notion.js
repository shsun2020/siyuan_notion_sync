/**
 * Notion API Wrapper Module
 * 封装Notion API调用 - 支持页面而非数据库
 */

class NotionClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://api.notion.com/v1";
        this.apiVersion = "2022-06-28";
    }

    getHeaders() {
        return {
            "Authorization": "Bearer " + this.apiKey,
            "Notion-Version": this.apiVersion,
            "Content-Type": "application/json"
        };
    }

    async request(endpoint, method, body) {
        method = method || "GET";
        body = body || null;

        const url = this.baseUrl + endpoint;
        const options = {
            method: method,
            headers: this.getHeaders()
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Notion API error: " + response.status);
        }

        return data;
    }

    /**
     * 测试连接
     */
    async testConnection(parentPageId) {
        try {
            if (!this.apiKey) {
                return { success: false, message: "API Key未设置" };
            }

            const user = await this.request("/users/me");

            // 如果提供了父页面ID，验证页面是否存在
            if (parentPageId) {
                try {
                    const page = await this.request("/pages/" + parentPageId);
                    if (page.object === "error") {
                        return { success: false, message: "无法访问指定的页面" };
                    }
                    return {
                        success: true,
                        message: "连接成功! 用户: " + (user.name || user.id) + " - 页面: " + (page.properties && page.properties.title ? page.properties.title.title[0]?.plain_text : "已找到")
                    };
                } catch (e) {
                    return { success: false, message: "页面验证失败: " + e.message };
                }
            }

            return {
                success: true,
                message: "连接成功! 用户: " + (user.name || user.id)
            };
        } catch (e) {
            return { success: false, message: "连接失败: " + e.message };
        }
    }

    /**
     * 创建根页面（没有父页面）
     */
    async createRootPage(title, blocks) {
        blocks = blocks || [];

        // 创建一个没有父页面的独立页面
        const body = {
            parent: {},
            properties: {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            }
        };

        const page = await this.request("/pages", "POST", body);

        // 添加内容块
        if (blocks.length > 0 && page.id) {
            await this.appendBlocks(page.id, blocks);
        }

        return page;
    }

    /**
     * 创建页面（可选择父页面）
     */
    async createPageWithTitle(parentId, title) {
        // parentId 为空时创建根页面，否则创建子页面
        const body = parentId ? {
            parent: { page_id: parentId },
            properties: {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            }
        } : {
            parent: {},
            properties: {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            }
        };

        return await this.request("/pages", "POST", body);
    }

    /**
     * 作为子页面创建
     */
    async createPageAsChild(parentPageId, title, blocks) {
        blocks = blocks || [];

        const body = {
            parent: { page_id: parentPageId },
            properties: {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            }
        };

        const page = await this.request("/pages", "POST", body);

        if (blocks.length > 0 && page.id) {
            await this.appendBlocks(page.id, blocks);
        }

        return page;
    }

    /**
     * 追加块到页面
     */
    async appendBlocks(pageId, blocks) {
        const chunkSize = 100;
        const chunks = [];

        for (let i = 0; i < blocks.length; i += chunkSize) {
            chunks.push(blocks.slice(i, i + chunkSize));
        }

        const results = [];
        for (const chunk of chunks) {
            const body = { children: chunk };
            const result = await this.request("/blocks/" + pageId + "/children", "PATCH", body);
            results.push(result);
        }

        return results;
    }
}

module.exports = { NotionClient };