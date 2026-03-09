/**
 * Document Format Transformer
 * 将SiYuan文档格式转换为Notion格式
 */

class Transformer {
    /**
     * 将SiYuan文档转换为Notion块
     * @param {Object} siyuanDoc SiYuan文档对象
     * @returns {Array} Notion块数组
     */
    transform(siyuanDoc) {
        const blocks = [];

        if (!siyuanDoc || !siyuanDoc.blocks) {
            return blocks;
        }

        for (const block of siyuanDoc.blocks) {
            const notionBlock = this.transformBlock(block);
            if (notionBlock) {
                blocks.push(notionBlock);
            }
        }

        return blocks;
    }

    /**
     * 转换单个SiYuan块为Notion块
     * @param {Object} siyuanBlock SiYuan块
     * @returns {Object} Notion块
     */
    transformBlock(siyuanBlock) {
        if (!siyuanBlock) return null;

        const type = siyuanBlock.type;
        const content = siyuanBlock.content || "";

        switch (type) {
            case "h1":
                return this.createHeadingBlock(content, "heading_1");
            case "h2":
                return this.createHeadingBlock(content, "heading_2");
            case "h3":
                return this.createHeadingBlock(content, "heading_3");
            case "h4":
            case "h5":
            case "h6":
                return this.createHeadingBlock(content, "heading_3");
            case "p":
            case "paragraph":
                return this.createParagraphBlock(content);
            case "blockquote":
            case "quote":
                return this.createQuoteBlock(content);
            case "hr":
            case "divider":
                return this.createDividerBlock();
            case "code":
                return this.createCodeBlock(content, siyuanBlock.language || "plain text");
            case "ul":
            case "list":
                // 无序列表在SiYuan中可能需要特殊处理
                return this.createBulletedListItemBlock(content);
            case "ol":
                // 有序列表
                return this.createNumberedListItemBlock(content);
            case "li":
            case "listItem":
                return this.createBulletedListItemBlock(content);
            case "task":
                // 任务列表
                return this.createToDoBlock(content, siyuanBlock.checked || false);
            case "table":
                return this.createTableBlock(siyuanBlock);
            case "img":
            case "image":
                return this.createImageBlock(siyuanBlock.properties);
            case "audio":
            case "video":
                // 音视频使用embed块
                return this.createEmbedBlock(siyuanBlock.properties);
            case "bookmark":
            case "link":
                return this.createBookmarkBlock(siyuanBlock.properties);
            default:
                // 默认作为段落处理
                return this.createParagraphBlock(content);
        }
    }

    /**
     * 创建标题块
     * @param {string} content 文本内容
     * @param {string} headingType 标题类型
     * @returns {Object} Notion块
     */
    createHeadingBlock(content, headingType) {
        return {
            object: "block",
            type: headingType,
            [headingType]: {
                rich_text: this.createRichText(content)
            }
        };
    }

    /**
     * 创建段落块
     * @param {string} content 文本内容
     * @returns {Object} Notion块
     */
    createParagraphBlock(content) {
        return {
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: this.createRichText(content)
            }
        };
    }

    /**
     * 创建引用块
     * @param {string} content 文本内容
     * @returns {Object} Notion块
     */
    createQuoteBlock(content) {
        return {
            object: "block",
            type: "quote",
            quote: {
                rich_text: this.createRichText(content)
            }
        };
    }

    /**
     * 创建分割线块
     * @returns {Object} Notion块
     */
    createDividerBlock() {
        return {
            object: "block",
            type: "divider",
            divider: {}
        };
    }

    /**
     * 创建代码块
     * @param {string} content 代码内容
     * @param {string} language 编程语言
     * @returns {Object} Notion块
     */
    createCodeBlock(content, language) {
        return {
            object: "block",
            type: "code",
            code: {
                rich_text: this.createRichText(content),
                language: this.mapLanguage(language)
            }
        };
    }

    /**
     * 创建无序列表块
     * @param {string} content 文本内容
     * @returns {Object} Notion块
     */
    createBulletedListItemBlock(content) {
        return {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: this.createRichText(content)
            }
        };
    }

    /**
     * 创建有序列表块
     * @param {string} content 文本内容
     * @returns {Object} Notion块
     */
    createNumberedListItemBlock(content) {
        return {
            object: "block",
            type: "numbered_list_item",
            numbered_list_item: {
                rich_text: this.createRichText(content)
            }
        };
    }

    /**
     * 创建待办事项块
     * @param {string} content 文本内容
     * @param {boolean} checked 是否完成
     * @returns {Object} Notion块
     */
    createToDoBlock(content, checked) {
        return {
            object: "block",
            type: "to_do",
            to_do: {
                rich_text: this.createRichText(content),
                checked: checked || false
            }
        };
    }

    /**
     * 创建表格块
     * @param {Object} siyuanBlock SiYuan表格块
     * @returns {Object} Notion块
     */
    createTableBlock(siyuanBlock) {
        // 处理表格
        const hasHeaderRow = siyuanBlock.hasHeaderRow !== false;
        const tableData = siyuanBlock.children || [];

        // 计算列数
        let columnCount = 2;
        if (tableData.length > 0 && tableData[0].children) {
            columnCount = tableData[0].children.length;
        }

        return {
            object: "block",
            type: "table",
            table: {
                table_width: columnCount,
                has_horizontal_header_row: hasHeaderRow,
                children: tableData.map(row => this.createTableRow(row, columnCount))
            }
        };
    }

    /**
     * 创建表格行
     * @param {Object} rowData 行数据
     * @param {number} columnCount 列数
     * @returns {Object} Notion表格行
     */
    createTableRow(rowData, columnCount) {
        const cells = [];

        if (rowData.children) {
            for (let i = 0; i < columnCount; i++) {
                const cellData = rowData.children[i];
                const cellContent = cellData ? this.extractTextFromBlock(cellData) : "";
                cells.push({
                    object: "block",
                    type: "table_cell",
                    table_cell: {
                        rich_text: this.createRichText(cellContent)
                    }
                });
            }
        }

        // 确保有足够的单元格
        while (cells.length < columnCount) {
            cells.push({
                object: "block",
                type: "table_cell",
                table_cell: {
                    rich_text: []
                }
            });
        }

        return {
            object: "block",
            type: "table_row",
            table_row: {
                cells: cells
            }
        };
    }

    /**
     * 创建图片块
     * @param {Object} properties 块属性
     * @returns {Object} Notion块
     */
    createImageBlock(properties) {
        let url = "";

        if (properties) {
            // 尝试从不同属性中获取URL
            if (properties.src) {
                url = properties.src[0] ? properties.src[0][0] : "";
            } else if (properties.url) {
                url = properties.url[0] ? properties.url[0][0] : "";
            } else if (properties.zoom) {
                url = properties.zoom[0] ? properties.zoom[0][0] : "";
            }
        }

        if (!url) {
            return this.createParagraphBlock("[图片]");
        }

        // 判断是外部URL还是base64
        if (url.indexOf("data:") === 0) {
            return this.createParagraphBlock("[base64图片无法同步]");
        }

        return {
            object: "block",
            type: "image",
            image: {
                type: "external",
                external: {
                    url: url
                }
            }
        };
    }

    /**
     * 创建嵌入块（用于音视频）
     * @param {Object} properties 块属性
     * @returns {Object} Notion块
     */
    createEmbedBlock(properties) {
        let url = "";

        if (properties) {
            if (properties.src) {
                url = properties.src[0] ? properties.src[0][0] : "";
            } else if (properties.url) {
                url = properties.url[0] ? properties.url[0][0] : "";
            }
        }

        if (!url) {
            return this.createParagraphBlock("[嵌入内容]");
        }

        // 检查是否为视频
        const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i);

        if (isVideo) {
            return {
                object: "block",
                type: "video",
                video: {
                    type: "external",
                    external: {
                        url: url
                    }
                }
            };
        }

        // 默认为embed块
        return {
            object: "block",
            type: "embed",
            embed: {
                url: url
            }
        };
    }

    /**
     * 创建书签块
     * @param {Object} properties 块属性
     * @returns {Object} Notion块
     */
    createBookmarkBlock(properties) {
        let url = "";
        let title = "";

        if (properties) {
            if (properties.url) {
                url = properties.url[0] ? properties.url[0][0] : "";
            }
            if (properties.title) {
                title = properties.title[0] ? properties.title[0][0] : "";
            }
        }

        if (!url) {
            return this.createParagraphBlock("[书签]");
        }

        return {
            object: "block",
            type: "bookmark",
            bookmark: {
                url: url,
                caption: title ? this.createRichText(title) : []
            }
        };
    }

    /**
     * 创建富文本数组
     * @param {string} text 文本内容
     * @returns {Array} 富文本数组
     */
    createRichText(text) {
        if (!text) return [];

        return [
            {
                type: "text",
                text: {
                    content: text
                }
            }
        ];
    }

    /**
     * 从块中提取文本
     * @param {Object} block 块
     * @returns {string} 文本内容
     */
    extractTextFromBlock(block) {
        if (!block) return "";

        if (block.markdown) {
            return block.markdown;
        }

        if (block.content) {
            return block.content;
        }

        if (block.properties && block.properties.text) {
            const textArray = block.properties.text;
            if (Array.isArray(textArray) && textArray.length > 0) {
                return textArray.map(t => t[0] || "").join("");
            }
        }

        return "";
    }

    /**
     * 映射编程语言
     * @param {string} language 原始语言标识
     * @returns {string} Notion支持的语言
     */
    mapLanguage(language) {
        if (!language) return "plain text";

        const langMap = {
            "javascript": "javascript",
            "js": "javascript",
            "typescript": "typescript",
            "ts": "typescript",
            "python": "python",
            "py": "python",
            "java": "java",
            "c": "c",
            "cpp": "cpp",
            "c++": "cpp",
            "csharp": "csharp",
            "c#": "csharp",
            "go": "go",
            "golang": "go",
            "rust": "rust",
            "rs": "rust",
            "php": "php",
            "ruby": "ruby",
            "rb": "ruby",
            "swift": "swift",
            "kotlin": "kotlin",
            "scala": "scala",
            "html": "html",
            "css": "css",
            "scss": "scss",
            "less": "less",
            "json": "json",
            "xml": "xml",
            "yaml": "yaml",
            "yml": "yaml",
            "sql": "sql",
            "bash": "bash",
            "shell": "bash",
            "sh": "bash",
            "powershell": "powershell",
            "ps1": "powershell",
            "markdown": "markdown",
            "md": "markdown",
            "latex": "latex",
            "dockerfile": "dockerfile",
            "graphql": "graphql"
        };

        const normalizedLang = language.toLowerCase().trim();
        return langMap[normalizedLang] || "plain text";
    }
}

module.exports = { Transformer };