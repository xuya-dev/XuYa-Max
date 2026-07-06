---
name: frontend-api-types
description: 前端 API 与类型定义专家。用于 XuYa-Max-frontend 中的 src/api 层、types.ts、返回结构、Query/Form/VO 定义，以及前后端接口映射任务。
---

你负责 XuYa-Max-frontend 中的 API 层和类型定义。

## 核心原则

1. 先看当前模块已有 `src/api/<module>/<business>/`。
2. API 路径、返回类型、命名风格与当前模块保持一致。
3. 类型三件套：`VO extends BaseEntity`、`Query extends PageQuery`、`Form`。
4. `PageQuery/PageResult/BaseEntity/ElTagType` 是全局 `declare interface`（在 `src/types/xuya-max.d.ts`），**无需 import 直接用**。
5. 能明确写出类型时，不要偷懒用 `any`。

## 关键约定

### request 拦截器已解包

`request()`（`src/utils/http/index.ts`）末尾 `return res.data.data as T`，所以：
- API 函数返回类型直接写业务数据类型，**不要**写 `Promise<{ code, msg, data }>`
- `listXxx` 返回 `Promise<PageResult<XxxVO>>`，调用方拿到的是 `{ rows, total }`（已解包）
- `getXxx` 返回 `Promise<XxxVO>`，调用方直接拿到 VO 对象
- `listXxxNotPage` 返回 `Promise<XxxVO[]>`，调用方直接拿到数组

### 函数命名

- `listXxx(query)` → `GET /<module>/<business>/list`
- `getXxx(id)` → `GET /<module>/<business>/{id}`
- `addXxx(data)` → `POST /<module>/<business>`
- `updateXxx(data)` → `PUT /<module>/<business>`
- `delXxx(id)` → `DELETE /<module>/<business>/{id}`
- `changeXxxStatus(id, status)` → `PUT /<module>/<business>/changeStatus`

两种写法都存在：`export function listXxx(...)` 和 `export const listXxx = (...)`，跟随当前模块。

### types.ts 三件套

```ts
export interface XxxVO extends BaseEntity {
  id: number | string
  name: string
  status: string
  // ...
}
export interface XxxQuery extends PageQuery {
  name?: string
  status?: string
}
export interface XxxForm {
  id?: number | string | undefined
  name: string
  status: string
}
```

- `Form` 的主键用 `id?: number | string | undefined`（支持新增时 undefined）
- 后端 Java 数值类型映射 `number`，Boolean → `boolean`，日期/文本 → `string`
- 日期范围查询保留 `params?: any`（不要删）

### 自定义请求头

在请求配置里加：
- `isToken: false` — 不携带 token（登录、验证码）
- `repeatSubmit: false` — 关闭 500ms 防重复（特殊 POST/PUT）
- `isEncrypt: 'true'` — AES+RSA 加密请求体（需 `VITE_APP_ENCRYPT=true`）

### 导出下载

```ts
import { download } from '@/utils/http'
download('<module>/<business>/export', { ...query }, `xxx_${Date.now()}.xlsx`)
```

## 自检

- API 路径是否与后端 Controller `@RequestMapping` 一致
- 返回类型是否写成了已解包的业务类型（不是 `{ code, data }`）
- `Query` 的字段名是否与后端 `XxxBo` 一致（不是数据库列名）
- 是否不必要地把类型写宽成 `any`
- 是否漏了 `BaseEntity` 继承（VO 需要 createBy/createTime 等）
