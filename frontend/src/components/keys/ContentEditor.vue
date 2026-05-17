<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useTheme } from 'vuetify'

const props = defineProps({
    content: {
        type: String,
        default: '',
    },
    language: {
        type: String,
        default: 'json',
    },
    readonly: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    border: {
        type: Boolean,
        default: false,
    },
    resetKey: {
        type: String,
        default: '',
    },
    offsetKey: {
        type: String,
        default: '',
    },
    keepOffset: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['reset', 'input', 'save'])

const theme = useTheme()

/** @type {HTMLElement|null} */
const editorRef = ref(null)
/** @type monaco.editor.IStandaloneCodeEditor */
let editorNode = null
const scrollOffset = { top: 0, left: 0 }
let isUpdatingFromExternal = false // 标记是否从外部更新
let resizeObserver = null

const readonlyValue = computed(() => {
    return props.readonly || props.loading
})

const updateScroll = () => {
    if (editorNode != null) {
        if (props.keepOffset && props.offsetKey) {
            editorNode.setScrollPosition({ scrollTop: scrollOffset.top, scrollLeft: scrollOffset.left })
        } else {
            editorNode.setScrollPosition({ scrollTop: 0, scrollLeft: 0 })
        }
    }
}

const destroyEditor = () => {
    if (resizeObserver != null) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
    if (editorNode != null && editorNode.dispose != null) {
        const model = editorNode.getModel()
        if (model != null) {
            model.dispose()
        }
        editorNode.dispose()
        editorNode = null
    }
}

// 注册自定义主题
const registerThemes = () => {
    // Dark theme
    monaco.editor.defineTheme('vscode-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#cccccc',
        },
    })
    
    // Light theme
    monaco.editor.defineTheme('vscode-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#333333',
        },
    })
}

onMounted(async () => {
    if (editorRef.value != null) {
        registerThemes()

        // 等待 DOM 完全渲染后再初始化编辑器
        await nextTick()
        // 额外等待一个渲染周期，确保 CSS 布局已生效
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        // 根据当前 Vuetify 主题选择 Monaco 主题
        const isDark = theme.global.current.value.dark
        const monacoTheme = isDark ? 'vscode-dark' : 'vscode-light'

        // 获取容器的精确尺寸
        const rect = editorRef.value.getBoundingClientRect()
        
        editorNode = monaco.editor.create(editorRef.value, {
            value: props.content,
            theme: monacoTheme,
            language: props.language,
            lineNumbers: 'on',
            links: false,
            readOnly: readonlyValue.value,
            colorDecorators: true,
            accessibilitySupport: 'off',
            wordWrap: 'off',
            tabSize: 2,
            folding: true,
            dragAndDrop: true,
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 20,
            fontLigatures: false,
            scrollBeyondLastLine: false,
            automaticLayout: false,
            scrollbar: {
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
            },
            contextmenu: false,
            lineDecorationsWidth: 10,
            minimap: {
                enabled: false,
            },
            selectionHighlight: false,
            renderLineHighlight: 'gutter',
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'off',
            cursorStyle: 'line',
            cursorWidth: 2,
            formatOnPaste: true,
            formatOnType: false,
            useTabStops: true,
            detectIndentation: false,
            mouseWheelZoom: false,
            smoothScrolling: true,
            suggest: { enabled: false },
            quickSuggestions: false,
            parameterHints: { enabled: false },
        })

        // 使用精确测量尺寸初始化布局（取整避免子像素累积误差）
        editorNode.layout({ width: Math.floor(rect.width), height: Math.floor(rect.height) })

        // 添加保存快捷键
        editorNode.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            emit('save')
        })

        editorNode.onDidScrollChange((event) => {
            if (props.keepOffset && !event.scrollHeightChanged) {
                scrollOffset.top = event.scrollTop
                scrollOffset.left = event.scrollLeft
            }
        })

        editorNode.onDidLayoutChange(() => {
            updateScroll()
        })

        if (editorNode.onDidChangeModelContent) {
            editorNode.onDidChangeModelContent(() => {
                // 如果是外部更新触发的变化，不需要再 emit
                if (isUpdatingFromExternal) return
                
                const value = editorNode.getValue()
                emit('input', value)

                // 内容变化后延迟触发布局，确保滚动条出现后的尺寸变化被正确计算
                requestAnimationFrame(() => {
                    if (editorNode != null && editorRef.value != null) {
                        const r = editorRef.value.getBoundingClientRect()
                        editorNode.layout({ width: Math.floor(r.width), height: Math.floor(r.height) })
                    }
                })
            })
        }

        // 使用 ResizeObserver 精确控制布局更新时机
        let lastWidth = rect.width
        let lastHeight = rect.height
        resizeObserver = new ResizeObserver((entries) => {
            if (editorNode == null) return
            for (const entry of entries) {
                const cr = entry.contentRect
                if (cr.width !== lastWidth || cr.height !== lastHeight) {
                    lastWidth = cr.width
                    lastHeight = cr.height
                    editorNode.layout({ width: Math.floor(cr.width), height: Math.floor(cr.height) })
                }
            }
        })
        resizeObserver.observe(editorRef.value)
    }
})

watch(
    () => props.content,
    async (content) => {
        if (editorNode != null) {
            const currentValue = editorNode.getValue()
            // 只有当内容真正不同时才更新
            if (currentValue !== content) {
                // 保存当前光标位置
                const position = editorNode.getPosition()
                const selection = editorNode.getSelection()
                
                // 标记为外部更新
                isUpdatingFromExternal = true
                
                // 更新编辑器内容
                editorNode.setValue(content)
                
                // 恢复光标位置
                if (position) {
                    const model = editorNode.getModel()
                    if (model) {
                        const lineCount = model.getLineCount()
                        const newLine = Math.min(position.lineNumber, lineCount)
                        const maxColumn = model.getLineMaxColumn(newLine)
                        const newColumn = Math.min(position.column, maxColumn)
                        
                        editorNode.setPosition({ lineNumber: newLine, column: newColumn })
                        
                        // 恢复选区（如果有）
                        if (selection) {
                            const newSelection = new monaco.Selection(
                                Math.min(selection.startLineNumber, lineCount),
                                Math.min(selection.startColumn, model.getLineMaxColumn(Math.min(selection.startLineNumber, lineCount))),
                                Math.min(selection.endLineNumber, lineCount),
                                Math.min(selection.endColumn, model.getLineMaxColumn(Math.min(selection.endLineNumber, lineCount)))
                            )
                            editorNode.setSelection(newSelection)
                        }
                    }
                }
                
                // 重置标记
                isUpdatingFromExternal = false
                
                await nextTick(() => emit('reset', content))
                updateScroll()
            }
        }
    },
)

watch(
    () => props.resetKey,
    async () => {
        if (editorNode != null) {
            editorNode.setValue(props.content)
            await nextTick(() => emit('reset', props.content))
            updateScroll()
        }
    },
)

watch(
    () => props.offsetKey,
    () => {
        if (editorNode != null) {
            scrollOffset.top = 0
            scrollOffset.left = 0
            editorNode.setScrollPosition({ scrollTop: 0, scrollLeft: 0 })
        }
    },
)

watch(
    () => readonlyValue.value,
    (readOnly) => {
        if (editorNode != null) {
            editorNode.updateOptions({
                readOnly,
            })
        }
    },
)

watch(
    () => props.language,
    (language) => {
        if (editorNode != null) {
            const model = editorNode.getModel()
            if (model != null) {
                monaco.editor.setModelLanguage(model, language)
            }
        }
    },
)

// 监听 Vuetify 主题变化
watch(
    () => theme.global.current.value.dark,
    (dark) => {
        if (editorNode != null) {
            const monacoTheme = dark ? 'vscode-dark' : 'vscode-light'
            monaco.editor.setTheme(monacoTheme)
        }
    },
)

onUnmounted(() => {
    destroyEditor()
})
</script>

<template>
    <div :class="{ 'editor-border': props.border === true }" style="position: relative">
        <div ref="editorRef" class="editor-inst" />
    </div>
</template>

<style lang="scss" scoped>
.editor-border {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    padding: 3px;
    box-sizing: border-box;
}

.editor-inst {
    width: 100%;
    min-height: 200px;
    height: 400px;
    font-family: 'Consolas', 'Courier New', monospace;
    transform: translateZ(0);
}

:deep(.line-numbers) {
    white-space: nowrap;
}
</style>
