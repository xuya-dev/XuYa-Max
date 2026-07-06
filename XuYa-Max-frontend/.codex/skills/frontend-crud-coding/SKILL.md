---
name: frontend-crud-coding
description: 在 XuYa-Max-frontend（Vue 3 + Element Plus 前端 + Spring Boot 后端）中按真实 Vue 3 + TypeScript + Element Plus + Tailwind v4 + useTable + XuyaTable/XuyaSearchBar/XuyaDialog 代码风格生成或修改 CRUD 页面、API、types、组件接入和样式壳。用于新增或修改标准 CRUD 列表页、树表页、系统管理页、监控页、详情弹窗、富文本页、SSE 消息联动，补齐与后端接口对应的 src/api、types 和 src/views 代码；触发后应先读取适用 references，再阅读目标模块真实代码。
---

# 前端编码规范（XuYa-Max-frontend）

本前端基于 Vue 3 + Element Plus（Vue 3 + TS + Element Plus + Tailwind v4 + Pinia + Vite 7 + Iconify/Remix Icon），对接 **XuYa-Max 后端**（Spring Boot 4.1 + Sa-Token + MyBatis Plus，Spring Boot 后端，Java 包 `dev.xuya`，菜单走 backend 模式）。

先对齐当前前端项目里的真实实现，再参考 plus-ui 的业务逻辑（但不要照搬代码，两者技术栈差异大）。不要只套通用 Vue 模板。

## 执行流程

1. 判断任务类型：新增标准 CRUD、树表、已有页面增强、详情弹窗、富文本页、只补 API/types。
2. 按「文档读取规则」读取必要 reference，不一次性展开所有资料。
3. 阅读目标目录下最近似的真实代码：
   - 标准单表优先看 `src/views/system/notice/index.vue`、`src/api/system/notice/*`、`src/views/system/post/index.vue`。
   - 字典数据页（内联搜索+弹窗）看 `src/views/system/dict/data/index.vue`。
   - 复杂系统页（树+表+导入）看 `src/views/system/user/index.vue`、`src/views/system/role/index.vue`。
   - 监控页看 `src/views/monitor/online/index.vue`、`src/views/monitor/cache/index.vue`。
4. 新增代码时同步维护 `src/api/<module>/<business>/index.ts`、`types.ts`、`src/views/<module>/<business>/index.vue`。
5. 增强已有页面时只做增量修改，保留原页面的 useTable 配置、XuyaSearchBar 字段、XuyaTableHeader 列显隐、XuyaDialog 弹窗、权限指令、字典渲染。
6. 修改完成后按影响范围运行验证：
   - 改 TS/Vue/API/types：优先 `npx vite build`（快，跳过 tsc）
   - 想做严格类型检查：`pnpm exec vue-tsc --noEmit`
   - 完整构建：`pnpm build`（= `vue-tsc --noEmit && vite build`，TS 错误会阻塞）
6. 不确定组件用法或页面结构时，从 `demo-templates` 分支拉取参考页面（见下方）。

## 参考页面（demo-templates 分支）

项目有一个 `demo-templates` 分支，归档了原模板的完整演示页面（组件展示、表单示例、图表、水印等），开发时可随时拉取参考：

```bash
git checkout demo-templates -- src/views/widgets/watermark/index.vue
git checkout demo-templates -- src/views/template/
git diff --name-only main..demo-templates | grep views/
```

可用参考：`views/template/`（banner/card/表单）、`views/widgets/`（水印/二维码/富文本/图表）、`views/examples/`（权限/表格/表单示例）、`views/article/`（综合示例）。

**注意**：参考完后用 `git checkout HEAD -- <file>` 撤销，不要把演示页提交到 main。

## 文档读取规则

- 前端 API、types、页面、useTable、组件、样式和验证规则，先读 [references/frontend.md](references/frontend.md)。
- 不确定任务边界、需要标准用例或提问方式时，再读 [references/examples.md](references/examples.md)。
- reference 只约束实现方式和自检范围；发生冲突时，以当前模块真实代码和实际调用点为准。

## 优先级规则

发生冲突时按下面顺序决策：

1. 目标目录下最近似页面、API、types 的真实实现。
2. 当前项目公共 hooks（useTable/useDict/useCommon）、组件（Art*/El*）、工具（xuya-max.ts/sanitize.ts/ossContent.ts）。
3. plus-ui 的业务逻辑（仅作业务参考，不照搬代码）。
4. 通用 Vue 3 / Element Plus 习惯。

也就是说：

- 同模块已有页面怎么写，优先怎么写。
- 复杂模块不能为了「标准 CRUD」退化成裸模板页。

## 仓库通用规则

- `.prettierrc`：`printWidth: 100`、`tabWidth: 2`、`semi: false`（无分号）、`singleQuote: true`、`trailingComma: "none"`、`arrowParens: "always"`。
- Lint：`pnpm lint`（eslint flat config）；格式化：`pnpm fix`（eslint --fix）+ prettier。
- 页面用 `<script setup lang="ts">` + `defineOptions({ name: 'Xxx' })`。
- 请求统一通过 `@/utils/http` 的 `request`（默认导出）或具名导出 `download`。
- **API 自动解包**：`request()` 末尾 `return res.data.data`，调用方拿到的是业务数据，不是 `{ code, data }`。
- 标准列表页优先复用：`useTable`（`@/hooks/core/useTable`）、`useDict`（`@/hooks/core/useDict`）、`useCommon`、`useHeaderBar`。
- 组件自动注册（unplugin-vue-components）：`XuyaTable/XuyaTableHeader/XuyaSearchBar/XuyaButtonTable/XuyaDictTag/ElCard/ElButton/ElDialog` 等模板里直接用，无需 import；但 `h()` 渲染时要显式 import。
- Vue API 自动导入（unplugin-auto-import）：`ref/computed/watch/onMounted/useRoute/useRouter` 等无需 import。
- 权限指令：`v-auth="'xxx:add'"`（`v-hasPermi` 是别名，等价）。
- 字典：`useDict('sys_xxx')` 返回 reactive 对象，用 `XuyaDictTag` 渲染。
- Tailwind 语义色：`bg-theme/text-theme/success/error/warning/info/g-100..g-900`（在 `tailwind.css` 注册）；自定义类 `flex-c/flex-b/flex-cc/c-p/xuya-full-height/xuya-table-card`。

## 目录映射规则

- 后端 `/system/xxx/*` → `src/api/system/xxx/*` + `src/views/system/xxx/*`
- 后端 `/monitor/xxx/*` → `src/api/monitor/xxx/*` + `src/views/monitor/xxx/*`
- 后端 `/resource/xxx/*` → `src/api/resource/xxx/*` 或 `src/api/system/xxx/*`（看现有约定）

标准新增至少包含：

- `src/api/<module>/<business>/index.ts`
- `src/api/<module>/<business>/types.ts`
- `src/views/<module>/<business>/index.vue`

按业务复杂度可能继续补：

- 搜索栏子组件 `modules/xxx-search.vue`
- 弹窗子组件 `modules/xxx-dialog.vue`
- 详情弹窗 `modules/xxx-detail.vue`（或内联在 index.vue）
- 树筛选面板（用 `XuyaTreePanel`）
- 导入弹窗（用 `XuyaExcelImport`）
- 列显隐（`XuyaTableHeader` 自带）

## 任务分型

### 1. 标准单表 CRUD

以 `src/views/system/notice/index.vue`、`src/views/system/post/index.vue` 为主要起点。补齐列表、搜索、分页、新增、编辑、删除、导出、权限、类型。

### 2. 字典数据页（内联搜索+弹窗）

参考 `src/views/system/dict/data/index.vue`：搜索栏直接内联 ElForm（不用 XuyaSearchBar），弹窗内联。

### 3. 强业务页面

如果页面包含树筛选、导入导出、更多菜单、状态切换、角色分配、详情弹窗、富文本、SSE 联动，优先增量修改现有页面，不要重写成简单 CRUD。

### 4. 监控页

参考 `src/views/monitor/*`：在线用户、缓存监控、操作日志、登录日志。列表数据可能是数组（非分页），用 `Array.isArray(res) ? res : []` 兜底。

### 5. 只补 API 和 types

只维护 `src/api/<module>/<business>/index.ts` 与 `types.ts`，但仍要与后端路由、返回结构、当前模块导入方式和类型入口一致。

## 输出要求

使用本 skill 时，默认期望产出应满足：

- 类型完整，不把页面逻辑大量写成 `any`。
- API 路径、函数名、权限标识与后端接口保持一致。
- 列表页用 `useTable + XuyaTable + XuyaTableHeader + XuyaSearchBar` 模式，CRUD 流程闭环完整。
- 复杂页面保留原有交互能力和业务约束。
- 富文本 v-html 必须包 `sanitizeHtml`；OSS 私有图用 `resolveOssContent` 解析。
- 代码体现当前项目 hooks、组件、Tailwind 语义色，而不是通用 Vue 模板裸输出。
- 交付前说明运行过的验证命令；如果无法验证，说明原因。

## 快速检查清单

- `request` 返回类型是否写成了已解包的业务类型（不是 `{ code, data }`）。
- `PageResult/PageQuery/BaseEntity` 是否直接用了全局 `declare interface`（无需 import）。
- `useTable` 的 `apiParams` 是否与搜索栏字段对齐。
- 操作列 `XuyaButtonTable` 的 type 是否在 `'add' | 'edit' | 'delete' | 'view' | 'more'` 之内。
- 字典渲染是否用 `XuyaDictTag`（h 函数里要 import）。
- 搜索项的 `key` 是否与后端 `XxxBo` 字段名一致（不是 VO 字段名）。
- 权限指令是否用 `v-auth`。
- 弹窗关闭是否重置了富文本（resetFields 清不掉没 prop 的 form-item）。
- 详情弹窗的 v-html 是否包了 `sanitizeHtml`。
- 状态切换是否用 `ElSwitch` 的 `beforeChange`（不是 `onChange`）。

## 推荐提问方式

推荐把请求描述到下面粒度：

- 目标模块和业务名
- 后端接口前缀
- 是新增页面、修改页面，还是只补 API/types
- 是否需要导入、导出、树筛选、树表、状态切换、字典、权限按钮、详情弹窗、富文本
- 希望参考哪个现有页面

例如：

- 使用 `$frontend-crud-coding` 为 `/system/notice` 增加详情查看功能，参考 `src/views/system/notice/index.vue`，富文本要 sanitize。
- 使用 `$frontend-crud-coding` 修改 `system/role` 列表页，增加数据权限配置弹窗，保持当前 useTable 风格。
