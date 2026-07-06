# 使用案例（XuYa-Max-frontend）

## 案例 1：新增标准 CRUD 页面

### 用户提问示例

```text
使用 $frontend-crud-coding 为 system/post 补一套前端 CRUD 页面。
后端接口已有 /system/post/list、/system/post/{id}、POST /system/post、PUT /system/post、DELETE /system/post/{ids}。
请参考 src/views/system/notice/index.vue 和现有 system/role 风格实现。
```

### 期望执行方式

- 先看 `src/api/system/post/*` 和 `src/views/system/post/index.vue` 是否已存在。
- 再看 `src/views/system/notice/index.vue` 的标准 useTable + XuyaTable + XuyaSearchBar 骨架。
- 生成或修改 `api/index.ts`、`types.ts`、`views/.../index.vue`、`modules/post-search.vue`、`modules/post-dialog.vue`。
- 用 `useTable`、`useDict`、`XuyaTable`、`XuyaTableHeader`、`XuyaSearchBar`、`XuyaButtonTable`、`XuyaDictTag`、`v-auth`。

## 案例 2：增加详情查看功能（富文本）

### 用户提问示例

```text
使用 $frontend-crud-coding 为 system/notice 增加详情查看功能：
1. 操作列加查看按钮
2. 详情弹窗展示富文本正文
3. 富文本要防 XSS
4. 支持 SSE 通知跳转过来自动打开详情
```

### 期望执行方式

- 看 `src/views/system/notice/index.vue` 现有结构。
- 操作列加 `h(XuyaButtonTable, { type: 'view', onClick: () => handleDetail(row) })`。
- 新增 `detail` reactive 状态 + `openDetail(id)` 方法 + `ElDialog` 详情弹窗。
- 正文 v-html 必须包 `sanitizeHtml`（`@/utils/sanitize`）。
- 富文本里 OSS 私有图用 `resolveOssContent`（`@/utils/ossContent`）解析。
- `watch(() => route.query.noticeId, ..., { immediate: true })` 接住 SSE 通知跳转。

## 案例 3：修改已有复杂列表页

### 用户提问示例

```text
使用 $frontend-crud-coding 修改 system/user 页面：
1. 新增一个创建时间快捷筛选
2. 保持现有树筛选、导入、列显隐、状态切换不变
```

### 期望执行方式

- 判断这是「已有复杂页面增强」，不是重新生成 CRUD。
- 优先阅读 `src/views/system/user/index.vue` 完整实现。
- 保留 `XuyaTreePanel`（部门树）、`XuyaExcelImport`（导入）、`XuyaTableHeader`（列显隐）、`v-auth` 权限、`XuyaDictTag` 字典。
- 只增量修改搜索栏（`modules/user-search.vue`）和查询参数处理（日期范围）。

## 案例 4：修复搜索栏字段名错误

### 用户提问示例

```text
使用 $frontend-crud-coding 修复 system/notice 搜索栏「操作人员」字段无效的问题，后端字段是 createByName。
```

### 期望执行方式

- 看 `src/views/system/notice/modules/notice-search.vue`。
- 确认 `key: 'createBy'` 与后端 `SysNoticeBo.createByName` 不一致。
- 改成 `key: 'createByName'`。
- 顺带检查 `NoticeQuery` 类型定义是否对齐。

## 案例 5：接入后端新增状态切换接口

### 用户提问示例

```text
使用 $frontend-crud-coding 给 system/oss 页面接入状态切换，字段 status，参考 system/user。
```

### 期望执行方式

- API 增加 `changeOssStatus(ossId, status)` → `PUT /system/oss/changeStatus`。
- types 确认 `status` 类型（string/number/boolean）。
- 表格列用 `ElSwitch`，**用 `beforeChange` 不是 `onChange`**，返回 `Promise<boolean>`。
- 切换失败时回滚原状态。
- 权限用 `system:oss:edit`。

## 案例 6：只补 API 和 types

### 用户提问示例

```text
使用 $frontend-crud-coding 为 monitor/cache 补全前端 API 和 types，页面先不改。
```

### 期望执行方式

- 只维护 `src/api/monitor/cache/index.ts` 和 `types.ts`。
- 检查同目录 monitor API 的 `export function` / `export const` 风格。
- 返回类型用全局 `PageResult` / `BaseEntity`（无需 import）。
- 不创建页面，不改路由。

## 推荐的高质量任务描述

```text
使用 $frontend-crud-coding 在 XuYa-Max-frontend 中新增 /system/client 列表页：
1. 参考 src/views/system/notice/index.vue 的 useTable 模式
2. 包含搜索栏（XuyaSearchBar）、表格（XuyaTable）、新增/编辑弹窗（XuyaDialog）
3. API 路径沿用后端 /system/client/*
4. 权限用 v-auth="'system:client:add'" 等
5. 状态字段用字典 sys_normal_disable
6. 改完跑 npx vite build 验证
```

## 不推荐的任务描述

```text
帮我写个后台页面
```

更好的写法至少补充：

- 模块名、业务名
- 后端接口前缀
- 是新增还是修改
- 是否需要分页、导出、树表、字典、权限、详情弹窗、富文本
- 想参考哪个现有页面
