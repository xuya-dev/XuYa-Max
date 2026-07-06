# 前端约定（XuYa-Max-frontend）

## 优先参考的代码来源

- 当前目标目录下最近似页面、API、types。
- 标准单表：`src/views/system/notice/index.vue`、`src/api/system/notice/index.ts`、`src/api/system/notice/types.ts`、`src/views/system/post/index.vue`。
- 字典数据页（内联搜索+弹窗）：`src/views/system/dict/data/index.vue`。
- 复杂系统页：`src/views/system/user/index.vue`、`src/views/system/role/index.vue`、`src/views/system/menu/index.vue`。
- 监控页：`src/views/monitor/online/index.vue`、`src/views/monitor/cache/index.vue`、`src/views/monitor/operlog/index.vue`。
- 公共 hooks：`src/hooks/core/useTable.ts`、`src/hooks/core/useDict.ts`、`src/hooks/core/useCommon.ts`、`src/hooks/core/useHeaderBar.ts`。
- 工具：`src/utils/xuya-max.ts`（parseTime/handleTree/tansParams）、`src/utils/sanitize.ts`（sanitizeHtml）、`src/utils/ossContent.ts`（resolveOssContent）。

## 基础栈与格式

- 技术栈：Vue 3.5 + TypeScript 5.6 + Element Plus 2.11 + Tailwind v4 + Pinia 3 + Vite 7 + Iconify（Remix Icon 离线包）。
- 包管理：`pnpm`（Node ≥20.19.0，pnpm ≥8.8.0）。
- `.prettierrc`：无分号、单引号、2 空格、`printWidth: 100`、`trailingComma: "none"`、`arrowParens: "always"`。
- Lint：`pnpm lint`（eslint flat config）；格式化：`pnpm fix`。
- 不要在一个页面里混入与仓库不一致的格式和写法。

## API 文件规则

- 标准 API 文件放在 `src/api/<module>/<business>/index.ts`，同目录维护 `types.ts`。
- import 顺序：
  `import request from '@/utils/http'`
  `import type { XxxForm, XxxQuery, XxxVO } from './types'`
- **`request()` 已自动解包 `res.data.data`**，API 返回类型直接写业务数据类型：
  - 列表分页：`Promise<PageResult<XxxVO>>` → 调用方拿到 `{ rows, total }`
  - 详情：`Promise<XxxVO>` → 调用方直接拿到 VO
  - 不分页列表：`Promise<XxxVO[]>` → 调用方直接拿到数组
  - 增删改：`Promise<void>` 或不写返回类型
- `PageResult/PageQuery/BaseEntity/ElTagType` 是全局 `declare interface`（`src/types/xuya-max.d.ts`），**无需 import**。
- 标准函数命名：
  `listXxx` → `GET /<module>/<business>/list`
  `getXxx` → `GET /<module>/<business>/{id}`
  `addXxx` → `POST /<module>/<business>`
  `updateXxx` → `PUT /<module>/<business>`
  `delXxx` → `DELETE /<module>/<business>/{id or ids}`
  `changeXxxStatus` → `PUT /<module>/<business>/changeStatus`
- query string 用 `params`，请求体用 `data`。
- 两种写法都存在：`export function listXxx(...)` 和 `export const listXxx = (...)`，跟随当前模块。
- 自定义请求头：`isToken: false`（登录/验证码）、`repeatSubmit: false`（关防重）、`isEncrypt: 'true'`（加密）。

## 类型文件规则

- 标准三件套：`VO extends BaseEntity`、`Query extends PageQuery`、`Form`。
- `Form` 的主键：`id?: number | string | undefined`（新增时 undefined）。
- 批量删除参数：`string | number | Array<string | number>`。
- Java 数值 → `number`，Boolean → `boolean`，日期/文本 → `string`。
- 日期范围查询保留 `params?: any`，不要删。
- 能明确写出类型时不要用 `any`。

## Vue 页面结构规则

- 页面用 `<script setup lang="ts">` + `defineOptions({ name: 'Xxx' })`。
- 标准列表页根节点：`class="xxx-page art-full-height flex flex-col overflow-hidden"`。
- 标准结构：
  搜索栏（`ArtSearchBar` 或内联 `ElForm`）
  表格卡片 `ElCard.art-table-card`
  `ArtTableHeader`（列显隐 + 刷新 + 左侧按钮槽）
  `ArtTable`（数据 + 分页 + 选择）
  新增/编辑 `ElDialog`（外置 modules 子组件或内联）
- 列表数据统一通过 `useTable` 管理（不要手写 `ref([])` + 裸 `ElTable`）。

## useTable 规则

```ts
const { columns, columnChecks, data, loading, pagination, getData,
        replaceSearchParams, resetSearchParams,
        handleSizeChange, handleCurrentChange,
        refreshData, refreshCreate, refreshUpdate, refreshRemove } = useTable({
  core: {
    apiFn: listXxx,
    apiParams: { ...searchForm.value },
    columnsFactory: () => [ ... ]
  }
})
```

- 列用 `formatter: (row) => h(Component, props)` 渲染自定义内容（字典用 `ArtDictTag`，操作按钮用 `ArtButtonTable`）。
- 搜索：`handleSearch(p) => { replaceSearchParams(p); getData() }`。
- 刷新策略：`refreshData`（全量）、`refreshCreate`（新增后回第一页）、`refreshUpdate`（更新后保持页）、`refreshRemove`（删除后智能处理空页）。
- `useTable` 的分页字段默认 `pageNum/pageSize`（已通过全局 `tableConfig` 对接后端 PageQuery）。

## 弹窗组件规则

- `Props: { visible, title, form }`，`Emits: { 'update:visible', 'success' }`。
- `visibleRef = computed({ get: () => props.visible, set: (val) => emit('update:visible', val) })`。
- **打开时整体重置 form 避免残留**：
  ```ts
  const defaultForm = () => ({ name: '', status: '0' })
  watch(() => props.visible, open => { if(open) Object.assign(form, defaultForm(), props.form) }, { immediate: true })
  ```
- `handleSubmit` 调 `formRef.value.validate()`，按主键判断 add/update，成功后关闭 + emit success。
- `handleClose` 调 `resetFields()` + 重置 defaultForm（**富文本 form-item 没 prop，resetFields 清不掉，要手动重置**）。
- 富文本用 `ArtWangEditor`，用 `contentRef = computed({ get, set })` 代理 string 类型。

## 组件与样式规则

- 优先复用公共组件（`src/components/core/`）：
  - tables：`ArtTable`、`ArtTableHeader`
  - forms：`ArtSearchBar`、`ArtButtonTable`、`ArtButtonMore`、`ArtForm`、`ArtWangEditor`、`ArtUserSelect`、`ArtRoleSelect`、`ArtExcelImport`、`ArtExcelExport`、`ArtDragVerify`
  - others：`ArtDictTag`、`ArtTreePanel`、`ArtFileUpload`、`ArtIconSelect`、`ArtMenuRight`
  - media：`ArtImageUpload`、`ArtImagePreview`、`ArtVideoPlayer`、`ArtCutterImg`
  - base：`ArtSvgIcon`、`ArtLogo`、`ArtBackToTop`
- `ArtButtonTable` 的 type：`'add' | 'edit' | 'delete' | 'view' | 'more'`。
- 组件命名：目录 `art-xxx`，组件内 `defineOptions({ name: 'ArtXxx' })`。
- Tailwind 语义色：`bg-theme/text-theme/success/error/warning/info/g-100..g-900`。
- 自定义类：`flex-c`（居中横排）、`flex-b`（两端对齐）、`flex-cc`（居中横纵）、`flex-cb`（两端+纵居中）、`c-p`（cursor pointer）、`art-full-height`、`art-table-card`。

## 字典、权限与公共工具

- 字典：`const { sys_xxx } = useDict('sys_xxx')`，渲染用 `ArtDictTag`。
- 权限指令：`v-auth="'xxx:add'"`（`v-hasPermi` 是别名，等价；无权限时直接移除 DOM）。
- 角色指令：`v-roles="['admin']"`。
- 工具：
  `parseTime/handleTree/tansParams` from `@/utils/xuya-max`
  `sanitizeHtml` from `@/utils/sanitize`
  `resolveOssContent` from `@/utils/ossContent`
  `download` from `@/utils/http`

## 富文本与安全规则

- 任何 `v-html` 必须先过 `sanitizeHtml`（防存储型 XSS）：
  ```ts
  import { sanitizeHtml } from '@/utils/sanitize'
  const safeContent = computed(() => sanitizeHtml(form.content || '<p>暂无内容</p>'))
  ```
- 富文本里有 OSS 私有图（`oss://{ossId}` 占位）时，渲染前调 `resolveOssContent`：
  ```ts
  import { resolveOssContent } from '@/utils/ossContent'
  if (data.content) data.content = await resolveOssContent(data.content)
  ```

## SSE 消息联动规则

- 消息 store：`useMessageStore`（`@/store/modules/message`）。
- 三类列表：`noticeList`（通知公告）、`systemList`（系统消息）、`workflowList`（工作流）。
- 状态：`connected`、`connectionFailed`（永久断连标记）、`unreadTotal`、`allMessages`。
- API：`connect()`、`disconnect()`、`fetchBox()`、`markRead(messageId)`、`clear()`。
- 点击消息跳转：`router.push(item.path)`，目标页用 `watch(() => route.query.xxxId, ..., { immediate: true })` 接住自动打开详情。
- 已读持久化：前端 localStorage（key `xuya-max-read-msgs:{userId}`），后端无已读状态。

## 验证规则

- 只改文档或 skill：运行 skill 基础校验即可。
- 改前端 TS/Vue/API/types：优先 `npx vite build`（快，约 25-30 秒）。
- 想做严格类型检查：`pnpm exec vue-tsc --noEmit`。
- 完整构建：`pnpm build`（= `vue-tsc --noEmit && vite build`，TS 错误阻塞）。
- 改公共 hooks、组件、构建相关：跑 `pnpm build`。
- 如果验证因为环境、依赖或权限失败，交付时说明失败命令和原因。

## 避免事项

- 不要绕开 `request` 或 `download` 自造请求/下载封装。
- 不要跳过 `types.ts`，把类型全写在页面里。
- 不要把 `useTable` 模式的页面退化成手写 `ref([])` + 裸 `ElTable`。
- 不要在 v-html 前不做 sanitize。
- 不要为了「更整洁」重写复杂页面的大块业务逻辑。
- 不要用 `ElSwitch` 的 `onChange` 做状态切换（会数据加载时自动触发），用 `beforeChange` 返回 `Promise<boolean>`。
- 不要把搜索项的 `key` 写成 VO 字段名或数据库列名，要对齐后端 `XxxBo` 字段名。
