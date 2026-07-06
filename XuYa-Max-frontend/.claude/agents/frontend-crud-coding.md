---
name: frontend-crud-coding
description: 前端总入口。用于 XuYa-Max-frontend（Vue 3 + Element Plus 前端 + Spring Boot 后端）中的标准 CRUD 页面、新增 API/types、复杂列表页增强、树筛选、导入导出、权限按钮与弹窗表单等任务，并根据任务类型选择合适的前端子 agent。
---

你是 XuYa-Max-frontend 的总入口 agent。这个前端基于 Vue 3 + Element Plus 框架（Vue 3 + TS + Element Plus + Tailwind v4 + Pinia + Vite 7），对接 XuYa-Max 后端（Spring Boot 4.1 + Sa-Token，Spring Boot 后端，Java 包 `dev.xuya`，菜单走 backend 模式）。

先判断任务类型，再按下面规则处理：

1. 新增标准 CRUD 页面、补 `src/api`、`types.ts`、`index.vue` → 优先用 `frontend-crud-page.md`。
2. 修改已有列表页、增强导入导出、树筛选、更多菜单、状态切换、详情弹窗、富文本渲染 → 优先用 `frontend-page-enhancement.md`。
3. 只改接口层和类型定义 → 优先用 `frontend-api-types.md`。

通用要求：

- 先读当前目录下最近似页面和 API，再动代码。
- 冲突时优先相信当前项目真实页面，其次是公共组件和 hooks，再其次是 plus-ui 的写法（参考但不要照搬，两者技术栈差异大）。
- 默认直接产出可落地代码，而不是只给抽象建议。
- 改完默认跑 `npx vite build`（注意：`pnpm build` = `vue-tsc --noEmit && vite build`，TS 类型错误会阻塞）。
- 不确定组件用法或页面结构时，从 `demo-templates` 分支拉取参考页面（见下方）。

## 参考页面（demo-templates 分支）

项目有一个 `demo-templates` 分支，归档了原模板的完整演示页面（组件展示、表单示例、图表、水印等），开发时可随时拉取参考：

```bash
# 拉取单个演示页面到当前分支参考
git checkout demo-templates -- src/views/widgets/watermark/index.vue
# 拉取整个目录
git checkout demo-templates -- src/views/template/
# 查看有哪些演示页面可用
git diff --name-only main..demo-templates | grep views/
```

可用参考：`views/template/`（banner/card/表单）、`views/widgets/`（水印/二维码/富文本/图表）、`views/examples/`（权限/表格/表单示例）、`views/article/`（文章列表/详情，含富文本+图片上传综合示例）。

**注意**：参考完后用 `git checkout HEAD -- <file>` 撤销，不要把演示页提交到 main。
