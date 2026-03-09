/**
 * SiYuan Data Fetching Module
 * 获取SiYuan笔记软件中的文档数据
 */

class SiYuanClient {
    constructor(app) {
        this.app = app;
    }

    /**
     * 获取所有文档
     * @returns {Promise<Array>} 文档数组
     */
    async getAllDocuments() {
        const documents = [];

        try {
            // 通过SiYuan的API获取笔记本列表
            const notebooks = await this.getNotebooks();

            for (const notebook of notebooks) {
                const docs = await this.getDocumentsFromNotebook(notebook.id);
                documents.push(...docs);
            }
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error getting documents:", e);
            throw e;
        }

        return documents;
    }

    /**
     * 获取所有笔记本
     * @returns {Promise<Array>} 笔记本数组
     */
    async getNotebooks() {
        try {
            // 使用SiYuan的API获取笔记本
            const response = await this.fetchApi("/api/notebook/lsNotebooks");
            return response.notebooks || [];
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error getting notebooks:", e);
            return [];
        }
    }

    /**
     * 从指定笔记本获取所有文档
     * @param {string} notebookId 笔记本ID
     * @returns {Promise<Array>} 文档数组
     */
    async getDocumentsFromNotebook(notebookId) {
        const documents = [];

        try {
            // 获取笔记本下的文件树
            const tree = await this.getFileTree(notebookId);
            // 递归遍历文件树获取所有文档
            await this.traverseTree(tree, documents);
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error getting docs from notebook " + notebookId + ":", e);
        }

        return documents;
    }

    /**
     * 获取文件树
     * @param {string} notebookId 笔记本ID
     * @returns {Promise<Object>} 文件树
     */
    async getFileTree(notebookId) {
        try {
            const response = await this.fetchApi("/api/filetree/getTree", {
                notebook: notebookId
            });
            return response;
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error getting file tree:", e);
            return null;
        }
    }

    /**
     * 递归遍历文件树
     * @param {Object} node 树节点
     * @param {Array} documents 文档数组
     */
    async traverseTree(node, documents) {
        if (!node) return;

        // 如果是文档叶子节点
        if (node.type === "document" || (node.file && node.hPath)) {
            try {
                const doc = await this.getDocument(node.id);
                if (doc) {
                    documents.push(doc);
                }
            } catch (e) {
                console.error("[SiYuan Notion Sync] Error getting document " + node.id + ":", e);
            }
        }

        // 递归处理子节点
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                await this.traverseTree(child, documents);
            }
        }
    }

    /**
     * 获取单个文档的完整内容
     * @param {string} docId 文档ID
     * @returns {Promise<Object>} 文档对象
     */
    async getDocument(docId) {
        try {
            // 获取文档内容
            const response = await this.fetchApi("/api/filetree/getDoc", {
                id: docId,
                mode: 1
            });

            if (!response) return null;

            // 获取文档属性信息
            const docInfo = await this.getDocInfo(docId);

            return {
                id: docId,
                title: docInfo.title || this.extractTitleFromContent(response),
                path: docInfo.path || "",
                blocks: this.parseBlocks(response),
                created: docInfo.created,
                updated: docInfo.updated
            };
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error getting doc " + docId + ":", e);
            return null;
        }
    }

    /**
     * 获取文档信息
     * @param {string} docId 文档ID
     * @returns {Promise<Object>} 文档信息
     */
    async getDocInfo(docId) {
        try {
            const response = await this.fetchApi("/api/filetree/getDocInfo", {
                id: docId
            });
            return response || {};
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error getting doc info " + docId + ":", e);
            return {};
        }
    }

    /**
     * 从内容中提取标题
     * @param {Object} content 文档内容
     * @returns {string} 标题
     */
    extractTitleFromContent(content) {
        if (!content) return "Untitled";

        // 尝试从block中获取标题
        try {
            if (content.blocks && Array.isArray(content.blocks)) {
                for (const block of content.blocks) {
                    if (block.type === "h1" || block.type === "h2" || block.type === "h3") {
                        return this.extractTextFromBlock(block) || "Untitled";
                    }
                }
            }
        } catch (e) {
            console.error("[SiYuan Notion Sync] Error extracting title:", e);
        }

        return "Untitled";
    }

    /**
     * 解析文档blocks
     * @param {Object} content 文档内容
     * @returns {Array} blocks数组
     */
    parseBlocks(content) {
        if (!content || !content.blocks) {
            return [];
        }

        return content.blocks.map(block => this.normalizeBlock(block));
    }

    /**
     * 规范化block格式
     * @param {Object} block 原始block
     * @returns {Object} 规范化后的block
     */
    normalizeBlock(block) {
        return {
            id: block.id,
            type: block.type,
            content: this.extractTextFromBlock(block),
            properties: block.properties || {},
            children: block.children ? block.children.map(c => this.normalizeBlock(c)) : [],
            language: block.language || "",
            mark: block.mark || [],
            fold: block.fold || false
        };
    }

    /**
     * 从block中提取文本内容
     * @param {Object} block 块
     * @returns {string} 文本内容
     */
    extractTextFromBlock(block) {
        if (!block) return "";

        // 优先使用markdown字段
        if (block.markdown) {
            return block.markdown;
        }

        // 从properties中提取文本
        if (block.properties && block.properties.text) {
            const textArray = block.properties.text;
            if (Array.isArray(textArray) && textArray.length > 0) {
                return textArray.map(t => t[0] || "").join("");
            }
        }

        // 递归从子块获取文本
        if (block.children && block.children.length > 0) {
            return block.children.map(c => this.extractTextFromBlock(c)).join("");
        }

        return "";
    }

    /**
     * 调用SiYuan API
     * @param {string} api API路径
     * @param {Object} data 请求数据
     * @returns {Promise<Object>} 响应数据
     */
    async fetchApi(api, data = {}) {
        // 使用 this.app 访问 SiYuan API
        if (this.app && this.app.ws) {
            return new Promise((resolve, reject) => {
                // 通过 WebSocket 发送请求
                this.app.ws.send({
                    cmd: api,
                    data: data,
                    callback: (result) => {
                        if (result.code === 0) {
                            resolve(result.data);
                        } else {
                            reject(new Error(result.msg || "API request failed"));
                        }
                    }
                });

                // 设置超时
                setTimeout(() => {
                    reject(new Error("API request timeout"));
                }, 30000);
            });
        }

        // 如果ws不可用，尝试使用fetch
        return new Promise((resolve, reject) => {
            fetch("/api" + api, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(result => {
                if (result.code === 0) {
                    resolve(result.data);
                } else {
                    reject(new Error(result.msg || "API request failed"));
                }
            })
            .catch(reject);
        });
    }
}

module.exports = { SiYuanClient };