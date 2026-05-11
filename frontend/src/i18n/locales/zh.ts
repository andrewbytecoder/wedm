export default {
    zh: {
        $vuetify: {
            dataIterator: {
                rowsPerPageText: '每页显示：',
                rowsPerPageAll: '全部',
                pageText: '{0}-{1} 共 {2}',
                noResultsText: '未找到匹配的记录',
                nextPage: '下一页',
                prevPage: '上一页',
            },
            dataTable: {
                rowsPerPageText: '每页行数：',
            },
            noDataText: '暂无数据',
        },
        appMenu: {
            config: '配置',
            export: '导出设置',
            import: '导入设置',
            file: '文件',
            services: '服务',
            hide: '隐藏',
            hideothers: '隐藏其他',
            unhide: '显示全部',
            quit: '退出',
            edit: '编辑',
            undo: '撤销',
            redo: '重做',
            cut: '剪切',
            copy: '复制',
            paste: '粘贴',
            pasteAndMatchStyle: '粘贴并匹配样式',
            delete: '删除',
            selectAll: '全选',
            view: '视图',
            reload: '重新加载',
            forcereload: '强制重新加载',
            resetzoom: '重置缩放',
            zoomin: '放大',
            zoomout: '缩小',
            togglefullscreen: '切换全屏',
            toggledevtools: '切换开发者工具',
            manage: '管理',
            settings: '设置',
            cluster: '集群',
            keys: '键值',
            watchers: '观察者',
            roles: '角色',
            users: '用户',
            beta: '测试版',
            reportBug: '报告问题',
            help: '帮助',
            about: '关于',
        },
        menu: {
            settings: '设置',
            manageCluster: '管理集群',
            manageKeys: '管理键值',
            manageWatchers: '管理观察者',
            manageUsers: '管理用户',
            manageRoles: '管理角色',
            manageLeases: '管理租约',
            about: '关于',
        },
        app: {
            connected: '配置文件',
        },
        common: {
            items: {
                watcher: '观察者',
                key: '键值',
                lease: '租约',
                role: '角色',
                action: '操作',
                permission: '权限',
            },
            titles: {
                new: '新建',
                edit: '编辑',
            },
            help: {
                tooltip: '显示帮助面板',
                infoTitle: '你知道吗？',
                tabs: {
                    info: '信息',
                    shortcuts: '键盘快捷键',
                },
                shortcuts: {
                    save: '验证并保存数据',
                    help: '显示此帮助',
                    enter: '保存数据',
                    esc: '关闭编辑器',
                    openEditor: '打开编辑器',
                    closeEditor: '关闭编辑器',
                    search: '聚焦搜索框',
                    purge: '清除所有项目',
                    remove: '删除选中项目',
                },
            },
            actions: {
                add: '添加',
                save: '保存',
                separator: {
                    tooltip: '键分隔符',
                },
                purgeAll: {
                    label: '清除',
                    tooltip: '清除所有',
                },
                openAll: {
                    label: {
                        open: '展开',
                        close: '收起',
                    },
                    tooltip: '展开/收起所有节点',
                },
                changeView: {
                    tooltip: '更改视图类型',
                },
                create: {
                    label: '添加',
                    tooltip: '添加新项',
                },
                removeAll: {
                    label: '删除',
                    tooltip: '删除选中项',
                },
                close: {
                    label: '关闭',
                },
            },
            lists: {
                nodata: '暂无数据显示。',
                filter: '筛选数据..',
            },
            validation: {
                required: '此项为必填项',
                alphanumeric: '请输入字母数字值',
                int: '值必须为整数',
                pattern: '无效的正则表达式',
            },
            messages: {
                success: '操作成功',
                error: '操作失败',
                copyClipboardSuccess: '已成功复制到剪贴板。',
                copyClipboardSuccessError: '无法复制到剪贴板。',
                invalidFileError: '无效的输入文件，需要 JSON 格式。',
            },
        },
        settings: {
            title: '设置',
            help: {
                profile: `* 在此管理配置配置文件。
                * 您可以设置**当前配置文件的名称**。所有设置将保存在此名称下。
                * 您也可以**加载不同的配置文件**。`,
                etcd: `* 这里用于配置 ETCD 连接和一些相关（可选）设置。
                * 最重要的是定义**主机**和**端口**，因为这些是连接 ETCD 所必需的。
                * **主机**的值应该是 ETCD 服务器的有效**IPv4 地址**或**URL**。
                * **端口**的值应该是 ETCD 监听的端口号。默认为**2379**。

                > 如果您的设置不正确或 ETCD 不可达，**您将无法离开**设置页面。
                为防止这种情况，请确保已保存正确的设置，并且 ETCD 确实在您定义的地址上运行。`,
                auth: `* 这里可以指定身份验证设置。
                * 下面的**用户名**和**密码**应分别等于您的 ETCD 用户名和密码。

                > 为了使这些设置生效，您必须在 ETCD 中[启用身份验证](http://etcd.io)。
                默认情况下它是关闭的。如果您不需要身份验证，**请将此留空**。`,
                watchers: `* 观察者设置如下
                * 您可以启用启动时**自动加载观察者**
                * 您还可以启用或禁用默认观察者。

                > 观察者将在应用运行时持续存在。这意味着一旦应用关闭，您将**停止接收观察者事件**。
                但是，如果您在下面启用自动加载，观察者将在您重新启动应用时自动重新激活。`,
                users: `* 这些设置与 ETCD 用户管理相关
                * 此密码模式适用于创建用户以及更改现有用户的密码。

                > 如果将模式留空，将使用默认模式：8-16 个字符，无空格，必须包含大写字母和数字。`,
                misc: `* 其他设置。
                    * 除此之外，您还可以**更改语言**。`,
                shortcuts: {
                    leftArrowLabel: '左箭头',
                    rightArrowLabel: '右箭头',
                    leftArrow: '上一个标签',
                    rightArrow: '下一个标签',
                },
            },
            profile: {
                title: '配置文件',
                fields: {
                    name: {
                        label: '配置文件',
                        placeholder: '输入配置文件名称..',
                        tooltip: '此配置文件的名称。默认为"default"。',
                        hint: '重命名并保存配置文件将创建一个新的配置文件。',
                    },
                    profiles: {
                        label: '配置文件列表',
                        tooltip: '可用的配置文件。选择一个以加载。',
                    },
                },
            },
            etcd: {
                title: 'ETCD',
                fields: {
                    endpoint: {
                        label: '主机',
                        placeholder: '输入 URL 或 IP 地址..',
                        tooltip: 'ETCD 服务器的 URL 或 IP 地址',
                    },
                    port: {
                        label: '端口',
                        placeholder: '输入端口号..',
                        tooltip: 'ETCD 服务的端口号。默认为 2379',
                    },
                    retries: {
                        label: '重试次数',
                        tooltip: `如果查询由于原始 GRPC 错误而失败，是否在不同的服务器上重试（如果有可用的服务器）。
                            这可以使服务中断的影响减轻，但如果特定操作导致 grpc 报告为某种内部或网络错误，可能会产生多米诺骨牌效应。`,
                    },
                    timeout: {
                        label: '超时时间',
                        placeholder: '输入数字..',
                        tooltip: '连接超时前的等待时间（毫秒）。默认为 30 秒。',
                    },
                    certificate: {
                        label: '证书',
                        tooltip: '用于 SSL/TLS 连接的证书。',
                    },
                    certKey: {
                        label: '证书密钥',
                        tooltip: '证书的密钥，必须是未加密的。仅在 ETCD 中启用客户端证书认证时需要。',
                    },
                    certChain: {
                        label: '证书颁发机构',
                        tooltip: '受信任的证书颁发机构。仅在 ETCD 中启用客户端证书认证时需要。',
                    },
                    ssl: {
                        label: '安全连接',
                        tooltip: '启用或禁用 HTTPS 通信',
                    },
                    apiVersion: {
                        label: 'API 版本',
                        tooltip: '端点支持的协议版本',
                    },
                },
            },
            auth: {
                title: '认证',
                fields: {
                    username: {
                        label: '用户名',
                        placeholder: '输入字母数字值..',
                        tooltip: 'ETCD 用户名。如果未启用身份验证，请留空。',
                    },
                    password: {
                        label: '密码',
                        placeholder: '输入字母数字值..',
                        tooltip: 'ETCD 密码。如果未启用身份验证，请留空。',
                    },
                },
            },
            watchers: {
                title: '观察者',
                fields: {
                    loadWatchers: {
                        label: '启动时激活所有用户定义的观察者',
                        tooltip: '如果开启，所有用户定义的观察者将在应用启动时自动激活。',
                    },
                    unloadWatchers: {
                        label: '关闭时停用所有用户定义的观察者',
                        tooltip: '如果开启，所有用户定义的观察者将在应用退出时自动停用。',
                    },
                    errorListener: {
                        label: '监控 ETCD 错误',
                        tooltip: '如果开启，观察者会将所有 ETCD 错误打印到控制台。',
                    },
                    disconnectListener: {
                        label: '监控观察者断开连接',
                        tooltip: '如果开启，每当观察者与 ETCD 断开连接时，都会向控制台打印消息。',
                    },
                    reconnectListener: {
                        label: '监控观察者重新连接',
                        tooltip: '如果开启，每当观察者重新连接到 ETCD 时，都会向控制台打印消息。',
                    },
                },
            },
            users: {
                title: '用户',
                fields: {
                    pwpattern: {
                        label: '密码模式',
                        placeholder: '输入正则表达式..',
                        tooltip: '用于验证用户密码的模式。留空以使用默认模式（8-16 个字符，必须包含大写字母和数字）',
                    },
                },
            },
            misc: {
                title: '其他',
                fields: {
                    language: {
                        label: '语言',
                        tooltip: '界面语言。',
                    },
                    animateBg: {
                        label: '切换背景动画',
                        tooltip: '启用或禁用动画背景。',
                    },
                    bg: {
                        label: '启用背景',
                        tooltip: '启用或禁用背景图片。',
                    },
                },
            },
            actions: {
                submit: '保存',
                saveAs: '另存为',
                load: '加载',
                next: '下一步',
                testConnection: '测试连接',
                browse: '浏览',
                clear: '清除',
            },
            messages: {
                noDefaultRemove: '您不能删除当前或最后一个配置文件！',
                error: '输入数据无效或缺少必填信息！',
                connectSuccess: '连接正常',
                profileLoaded: '配置文件已加载',
                success: '配置已成功保存',
                ipOrUrl: 'IP 地址或 URL 似乎无效',
            },
        },
        cluster: {
            title: '集群',
            help: {
                text: `* 下面显示有关 ETCD 集群及其节点的基本信息。
                * 要查看每个节点的详细信息，请点击**信息**按钮。
                * 您可以通过点击**心形**图标对每个节点执行**健康检查**。`,
            },
            subtitle: '节点',
            header: {
                clusterId: '集群 ID',
                memberId: '成员 ID',
                revision: '修订版本',
                raftTerm: 'Raft 任期',
            },
            columns: {
                id: 'ID',
                clientUrls: '客户端 URL',
                peerUrls: '对等 URL',
            },
            actions: {
                check: '检查成员健康状态',
                status: '获取状态信息',
            },
            dialogs: {
                info: {
                    title: '信息',
                    labels: {
                        db: '数据库',
                        leader: '领导者',
                        raftIndex: 'Raft 索引',
                        raftTerm: 'Raft 任期',
                        version: '版本',
                        loading: '加载中...',
                    },
                    actions: {
                        close: '关闭',
                    },
                },
            },
        },
        keyManager: {
            title: '键值',
            help: {
                text: `这是**所有键值**的列表。在这里您可以：

                * 按任何列排序（点击**列标题**）。
                * 按任何列筛选列表（使用**搜索框**）。
                * 删除选中的键值（点击**删除**）。
                * 删除所有键值（点击**清除**）。
                * 触摸选中的键值（点击**触摸**）
                * 您也可以使用相应的**操作图标**编辑、删除或触摸单个键值。`,
                shortcuts: {
                    touch: '触摸选中的键值',
                },
            },
            columns: {
                key: '键',
                value: '值',
            },
            actions: {
                refresh: '刷新',
                treeView: '树形视图',
                flatView: '平面视图',
                touchAll: {
                    label: '触摸',
                    tooltip: '触摸选中的键值',
                },
                edit: '编辑键值',
                remove: '删除键值',
                touch: '触摸键值',
            },
            treeview: {
                separator: '分隔符',
            },
        },
        keyEditor: {
            title: '键值',
            subtitle: '修订版本',
            help: {
                text: `您可以在此**创建**和**编辑**键值。

                * 创建后，您**不能**更改键值的名称。
                * 键值必须**唯一**`,
            },
            fields: {
                key: {
                    label: '键',
                    placeholder: '输入名称..',
                    tooltip: 'ETCD 键的名称',
                },
                value: {
                    label: '值',
                    placeholder: '输入值..',
                    tooltip: '与此键关联的值',
                },
                ttl: {
                    label: '生存时间 (TTL)',
                    placeholder: '输入数字..',
                    tooltip: '此键应存在的秒数。零表示永久。',
                },
            },
            buttons: {
                revisions: '显示修订版本',
                revisionsHide: '隐藏修订版本',
            },
            messages: {
                duplicateKey: '此键已存在！',
                integerTtl: '必须为整数',
                maxValue: '值太大。最大值：{max}',
                minValue: '值太小。最小值：1',
                noWatchRevisions: '桌面版（Wails）暂不支持来自 etcd 观察的实时修订历史。',
                revisionsLive: '下面的修订版本从修订版本 1 开始流式传输自 etcd 观察（与传统应用的理念相同）。如果日志已被压缩，流可能会以错误结束。',
                revisionsClickRow: '点击行以将该修订版本的值复制到值字段中，然后根据需要保存。',
            },
            columns: {
                key: '先前的值',
                version: '版本',
                createRev: '创建修订',
                modRev: '修改修订',
                type: '类型',
            },
        },
        purgeDialog: {
            title: '注意！',
            content: '这将永久删除所有 {type}。此操作无法撤销。',
            actions: {
                remove: '删除',
                cancel: '取消',
            },
        },
        whatsNewDialog: {
            title: '{version} 有什么新功能？',
            dontshow: '下次启动时不显示此对话框',
            actions: {
                cancel: '关闭',
            },
        },
        deleteDialog: {
            title: '注意！',
            content: '删除 {type} 将永久移除它。此操作无法撤销。',
            actions: {
                remove: '删除',
                cancel: '取消',
            },
        },
        saveAsDialog: {
            title: '另存为',
            actions: {
                saveAs: '配置文件另存为',
                cancel: '取消',
            },
            profile: {
                placeholder: '配置文件',
                label: '输入配置文件名称...',
            },
            messages: {
                empty: '请输入配置文件名称。',
                duplicate: '已存在同名的配置文件。',
            },
        },
        noSelectionDialog: {
            title: '注意！',
            content: '请先选择一些项目！',
            actions: {
                ok: '确定',
            },
        },
        messageDialog: {
            title: '注意！',
            actions: {
                ok: '确定',
            },
        },
        watcherManager: {
            title: '观察者',
            help: {
                text: `这是**所有观察者**的列表。在这里您可以：

                * 按任何列排序（点击**列标题**）。
                * 按任何列筛选列表（使用**搜索框**）。
                * 删除选中的观察者（点击**删除**）。
                * 删除所有观察者（点击**清除**）。
                * 激活或停用选中的观察者（点击**铃铛图标**）
                * 您也可以使用相应的**操作图标**编辑、删除或（取消）激活单个观察者。

                > 观察者仅在激活时接收事件。一旦激活，它们将**保持激活状态，直到应用关闭**（或直到您手动关闭它们）。如果与 ETCD 的连接丢失，观察者将尝试自动重新连接，并会补上错过的事件。`,
                shortcuts: {
                    toggle: '激活/停用选中的观察者',
                },
            },
            columns: {
                key: '键',
                name: '名称',
                prefix: '前缀',
            },
            actions: {
                notificationToggle: {
                    label: '开关',
                    tooltip: '开启/关闭选中的观察者',
                },
                edit: '编辑观察者',
                remove: '删除观察者',
                status: '切换观察者状态',
            },
        },
        watcherEditor: {
            help: {
                text: `您可以在此**编辑**或**创建**观察者。

                * 创建后，您**不能**更改观察者的名称。它必须**唯一**。
                * 观察者可以监视单个键。（**不使用**前缀）
                * 观察者可以监视以特定字符串开头的每个键。（**使用**前缀）
                * 每个观察者可以执行任意数量的**操作**，但必须至少关联**一个操作**。`,
                shortcuts: {
                    addAction: '添加新操作',
                },
            },
            fields: {
                name: {
                    label: '名称',
                    placeholder: '输入值..',
                    tooltip: '观察者的名称。',
                },
                key: {
                    label: '键',
                    placeholder: '输入值..',
                    tooltip: '此观察者关联的键。',
                },
                prefix: {
                    label: '这是一个前缀',
                    tooltip: '如果选中，将监视具有此前缀的所有键。',
                },
            },
            actionList: {
                columns: {
                    action: '操作',
                    event: '事件',
                },
                actions: {
                    edit: '编辑操作',
                    remove: '删除操作',
                },
            },
            actions: {
                actions: {
                    label: '操作',
                },
            },
            messages: {
                duplicate: '已存在同名的观察者',
                duplicateAction: '已存在此类型的操作',
            },
        },
        actionEditor: {
            title: '操作',
            fields: {
                action: {
                    label: '操作',
                    tooltip: '事件发生时执行的操作。',
                },
                event: {
                    label: '事件',
                    tooltip: '事件类型',
                },
            },
        },
        leaseManager: {
            title: '租约',
            help: {
                text: `这是**所有租约**的列表。在这里您可以：

                * 按 ID 排序（点击**列标题**）。
                * 按任何列筛选列表（使用**搜索框**）。
                * 撤销选中的租约（点击**删除**）。
                * 撤销所有租约（点击**清除**）。
                * 您也可以使用相应的**操作图标**查看或撤销单个租约。`,
            },
            columns: {
                id: 'ID',
            },
            actions: {
                view: '查看详情',
                remove: '删除租约',
            },
        },
        leaseEditor: {
            title: '查看',
            subtitle: '附加到此租约的键值',
            help: {
                text: `您可以在此**查看**租约的详细信息。

                * 倒计时显示距离到期剩余的小时、分钟和秒数。`,
            },
            fields: {
                grant: {
                    label: 'TTL',
                    tooltip: '租约的总生命周期（秒）。',
                },
                remainingDate: {
                    label: '剩余时间（小时/分钟/秒）',
                    tooltip: '租约到期前的倒计时。',
                },
            },
            columns: {
                key: '键',
            },
        },
        roleManager: {
            title: '角色',
            help: {
                text: `这是**所有 ETCD 角色**的列表。在这里您可以：

                * 按任何列排序（点击**列标题**）。
                * 按任何列筛选列表（使用**搜索框**）。
                * 删除选中的角色（点击**删除**）。
                * 删除所有角色（点击**清除**）。
                * 您也可以使用相应的**操作图标**编辑或删除单个角色。`,
            },
            columns: {
                name: '名称',
            },
            actions: {
                edit: '编辑角色',
                remove: '删除角色',
            },
        },
        roleEditor: {
            help: {
                text: `您可以在此**编辑**或**创建**角色。

                * 创建后，您**不能**更改角色的名称。它必须**唯一**。
                * 角色必须至少关联**一个权限**。
                * 权限的分配和撤销会**立即生效**，您无需点击保存。`,
                shortcuts: {
                    addPermission: '添加新权限',
                },
            },
            fields: {
                name: {
                    label: '名称',
                    placeholder: '输入值..',
                    tooltip: '角色的名称。',
                },
                allKeys: {
                    label: '所有键',
                },
            },
            actions: {
                edit: '编辑权限',
                revoke: '撤销权限',
                permissions: '权限',
            },
            columns: {
                key: '键',
                permission: '权限',
                prefix: '前缀',
            },
        },
        permissionEditor: {
            fields: {
                key: {
                    label: '键',
                    placeholder: '输入值..',
                    tooltip: '此角色授予访问权限的键名称。',
                },
                permission: {
                    label: '权限',
                    tooltip: '此角色授予的权限。如果您想要全部权限，请选择读写。',
                },
                prefix: {
                    label: '这是一个前缀',
                    tooltip: '如果选中，此角色将应用于具有此前缀的所有键。',
                },
                all: {
                    label: '适用于所有键',
                    tooltip: '如果选中，此角色将应用于所有键',
                },
                normal: {
                    label: '适用于单个键',
                    tooltip: '如果选中，此角色将应用于一个键',
                },
            },
            actions: {
                grant: {
                    label: '授予',
                },
            },
            messages: {
                duplicateKey: '已存在与此键关联的权限！',
            },
        },
        about: {
            version: '版本',
            copyright: '版权所有 {year} 贡献者。保留所有权利。',
            tagline: '唯一的 Web、桌面和移动端 ETCD GUI',
            actions: {
                bugs: '报告问题',
                donate: '捐赠',
                updates: '检查更新',
                github: '访问 GitHub 页面',
                credits: '显示贡献者',
            },
        },
        userManager: {
            title: '用户',
            subtitle: '角色',
            help: {
                text: `这是**所有 ETCD 用户**的列表。在这里您可以：

                * 按任何列排序（点击**列标题**）。
                * 按任何列筛选列表（使用**搜索框**）。
                * 删除选中的用户（点击**删除**）。
                * 删除所有用户（点击**清除**）。
                * 您也可以使用相应的**操作图标**编辑或删除单个用户。`,
            },
            columns: {
                name: '名称',
            },
            actions: {
                edit: '编辑用户',
                remove: '删除用户',
            },
        },
        userEditor: {
            title: '用户',
            help: {
                text: `您可以在此**编辑**或**创建**用户。

                * 创建后，您**不能**更改用户的名称。它必须**唯一**。
                * 您也可以在此**更改用户的密码**。
                * 角色的分配和撤销会**立即生效**，您无需点击保存。

                > 密码会根据密码规则进行验证。如果您不喜欢默认规则，可以在**设置标签**中更改它。`,
            },
            subtitle: '角色',
            fields: {
                name: {
                    label: '名称',
                    placeholder: '输入名称..',
                    tooltip: '用户的名称',
                },
                password: {
                    label: '密码',
                    placeholder: '输入值..',
                    tooltip: '用户的密码。必须为 8-16 个字符，无空格。必须包含大写字母和数字。',
                },
                pwcheck: {
                    label: '确认密码',
                    placeholder: '输入值..',
                    tooltip: '确认密码',
                },
            },
            messages: {
                pwmatch: '两次输入的密码不匹配',
                invalid: '密码无效',
                norights: '没有角色。现在添加一个！',
            },
        },
    },
};
