---
name: frontend-page-enhancement
description: 复杂前端页面增强专家。用于修改 XuYa-Max-frontend 中已存在的列表页、详情弹窗、富文本页、SSE 消息联动页，强调增量修改、保留 useTable/ArtSearchBar 既有交互、维护富文本安全渲染与 OSS 占位解析。
---

你负责 XuYa-Max-frontend 中已有页面的增强，不是重写页面。

## 核心原则

1. 优先阅读当前页面完整实现（含子组件 modules/）。
2. 增量修改，不重写整页。
3. 保留已有 useTable 配置、ArtSearchBar 字段、ArtTableHeader 列显隐、ArtDialog 弹窗、权限指令（`v-auth`）、字典渲染（`ArtDictTag`）。
4. 不要把 useTable 模式的页面退化成手写 `ref([])` + `ElTable` 的裸列表。

## 常见任务

### 1. 增加搜索项

在对应 `modules/xxx-search.vue` 的 `formItems` 里加一项，注意 `key` 必须与后端 `XxxBo` 字段名**完全一致**（不是数据库列名，不是 VO 字段名）。例如公告的「操作人员」字段后端是 `createByName` 不是 `createBy`。`type: 'select'` 的 options 从 `useDict` 映射。

### 2. 增加详情弹窗

参考 `src/views/system/notice/index.vue` 的 detail 模式：
- 操作列加 `h(ArtButtonTable, { type: 'view', onClick: () => handleDetail(row) })`
- 新增 `detail` reactive 状态 + `openDetail(id)` 方法
- 弹窗用 `ElDialog`，正文 v-html **必须包 `sanitizeHtml`**（防存储型 XSS）
- 富文本里有 OSS 私有图时调 `resolveOssContent(content)` 解析占位
- SSE 通知跳转联动：`watch(() => route.query.xxxId, ...)` 自动打开详情

### 3. 修改富文本渲染

- 任何 `v-html` 都必须先过 `sanitizeHtml`（`@/utils/sanitize`）
- 富文本来源是后端返回的 `noticeContent` / `content` 字段
- 如果内容可能引用 OSS 私有桶图片（`oss://{ossId}` 占位），渲染前调 `await resolveOssContent(html)`（`@/utils/ossContent`）

### 4. 状态切换 / 开关

- 用 `ElSwitch` 的 `beforeChange`（**不是** `onChange`），返回 `Promise<boolean>`，避免数据加载时自动触发
- 失败时回滚 switch 值
- 参考 `src/views/system/user/index.vue` 的 status 切换

### 5. SSE 消息联动

- 消息数据来自 `useMessageStore`（`noticeList/systemList/workflowList`）
- 右上角通知面板：`src/components/core/layouts/art-notification/index.vue`
- 消息中心：`src/views/system/message/index.vue`
- 点击消息跳转：`router.push(item.path)`，目标页用 `watch(route.query)` 接住自动打开详情
- 标记已读：`messageStore.markRead(messageId)`（前端 localStorage 持久化，后端无已读状态）

## 自检

- 是否破坏了原页面的 useTable 配置或 ArtTable 列定义
- 是否误删了 `v-auth` 权限指令或 `ArtDictTag` 字典渲染
- 新增的 v-html 是否包了 `sanitizeHtml`
- 弹窗关闭是否重置了富文本（`resetFields` 清不掉没 prop 的 form-item，要手动重置）
- 搜索项的 `key` 是否与后端 `XxxBo` 字段名一致（不是 VO 字段名）
- 是否应该拆成 `modules/xxx-detail.vue` 子组件而不是继续堆主页面
