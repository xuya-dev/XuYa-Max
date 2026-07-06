# XuYa-Max 前端

XuYa-Max 后台管理系统前端。基于 Vue 3 + Element Plus 构建，完整对接 XuYa-Max 后端。Vue 3.5 + TypeScript 6 + Vite 8 + Element Plus 2.14 + Tailwind CSS 4。

## 技术栈

| 技术 | 版本 |
|---|---|
| Vue | 3.5 |
| TypeScript | 6.0 |
| Vite (Rolldown) | 8.1 |
| Element Plus | 2.14 |
| Pinia | 3.0 |
| Tailwind CSS | 4.1 |
| vue-router | 5.1（hash 模式） |
| vue-i18n | 11.4 |
| @vueuse/core | 14.3 |
| ECharts | 6.1 |

## 快速启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 3006，代理到后端 8080）
pnpm dev

# 构建生产包
pnpm build

# 预览生产构建
pnpm serve
```

默认账号：`admin` / `admin123`

## 环境变量

| 文件 | 用途 |
|---|---|
| `.env` | 通用配置（版本、端口、权限模式、客户端 ID、加密密钥） |
| `.env.development` | 开发环境（`VITE_API_URL=/dev-api`，代理到 `localhost:8080`） |
| `.env.production` | 生产环境（`VITE_API_URL=/prod-api`） |

关键变量：
- `VITE_ACCESS_MODE = backend` — 菜单由后端 `/system/menu/getRouters` 返回
- `VITE_APP_CLIENT_ID` — PC 端客户端 ID（对应后端 `sys_client` 表）
- `VITE_APP_ENCRYPT = true` — 接口加密（AES+RSA），需与后端 `api-decrypt.enabled` 一致
- `VITE_APP_MESSAGE_ENABLED = true` — SSE 实时消息推送

## 目录结构

```
src/
├── api/                # API 层（与后端 Controller 一一对应）
├── views/              # 页面（system / monitor / dashboard / auth）
├── components/core/    # 封装组件（ArtTable / ArtSearchBar / ArtDictTag ...）
├── hooks/core/         # 业务 Hook（useTable / useDict / useCommon）
├── store/modules/      # Pinia（user / menu / setting / worktab / message）
├── utils/              # 工具（http / xuya-max / sanitize / ossContent / crypto）
├── router/             # 路由配置 + 守卫（hash 模式）
├── directives/         # 权限指令（v-auth / v-roles）
└── locales/            # 国际化（中文 / 英文）
```

## 核心约定

- **useTable + ArtTable + ArtSearchBar** — 标准 CRUD 页面三件套
- **request() 自动解包** `res.data.data` — API 函数直接返回业务数据
- **ArtDictTag** — 字典渲染（通过 `useDict`）
- **v-auth** — 按钮级权限（`v-hasPermi` 是别名）
- **sanitizeHtml** — 所有 `v-html` 必须先过此函数（防存储型 XSS）
- **resolveOssContent** — 解析富文本中 `oss://{ossId}` 占位为 OSS 预签名 URL

## 部署

构建产物支持**子目录部署**（hash 路由 + 相对资源路径）：

```nginx
location /xuya/ {
    alias /path/to/dist/;
}
location /prod-api/ {
    proxy_pass http://后端地址:8080/;
    proxy_buffering off;  # SSE 长连接需要
}
```

访问 `http://xxx.com/xuya/index.html#/dashboard/console`。

## License

MIT
