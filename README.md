<div align="center">

# XuYa-Max

### 后台管理系统 · v1.0.0

Vue 3 + TypeScript + Element Plus + Tailwind CSS · Spring Boot 4.1 + Sa-Token + MyBatis Plus

</div>

<br />

XuYa-Max 是一套前后端分离的后台管理系统，聚焦权限管理、系统监控、消息推送、文件管理等核心后台能力，前后端完整对接、开箱即用。

> 技术支持：Java 21 · Spring Boot 4.1 · Sa-Token · Redis · MyBatis Plus · Vue 3.5 · Vite 8 · Element Plus 2.14 · Pinia 3 · Tailwind 4

---

## 目录结构

```
XuYa-Max
├── XuYa-Max-backend/          # 后端（Spring Boot 多模块）
│   ├── xuya-max-admin/        # 启动入口
│   ├── xuya-max-api/          # 对外 API（DTO / Feign）
│   ├── xuya-max-common/       # 通用模块（core / redis / mybatis / satoken / oss / push ...）
│   ├── xuya-max-extend/       # 扩展（SnailJob Server）
│   ├── xuya-max-modules/      # 业务模块（system / job）
│   └── script/                # 数据库脚本（mysql / oracle / postgres / sqlserver）
│
├── XuYa-Max-frontend/         # 前端（Vue 3 + Vite）
│   ├── src/api/               # API 层（与后端 Controller 一一对应）
│   ├── src/views/             # 页面（system / monitor / dashboard / auth）
│   ├── src/components/core/   # 封装组件（ArtTable / ArtSearchBar / ArtDictTag ...）
│   ├── src/hooks/core/        # 业务 Hook（useTable / useDict / useCommon）
│   ├── src/store/modules/     # Pinia（user / menu / setting / worktab / message）
│   └── src/utils/             # 工具（http / xuya-max / sanitize / ossContent）
│
├── .claude/                   # Claude Code 开发助手 agent 规范
├── .codex/                    # Codex 开发技能
├── README.md
└── LICENSE
```

## 核心功能

| 模块 | 功能 |
|---|---|
| 用户权限 | 用户 / 角色 / 菜单 / 部门 / 岗位 / 字典 / 参数 / 客户端 |
| 系统监控 | 在线用户 / 缓存监控 / 操作日志 / 登录日志 |
| 通知公告 | 公告管理（富文本） + SSE 实时推送 + 消息中心 + 右上角通知 |
| 文件管理 | OSS 上传下载（S3 协议，支持 MinIO / 七牛 / 阿里 / 腾讯） |
| 个人中心 | 资料修改 / 头像上传 / 密码修改 / 在线设备管理 |
| 安全 | 接口加密（AES+RSA） · 防重复提交 · 数据权限 · XSS 过滤 |
| 国际化 | 中文 / 英文（vue-i18n） |

## 快速启动

### 环境要求

- **JDK 21+**
- **MySQL 8+**（或 Oracle / PostgreSQL / SQLServer）
- **Redis 6+**
- **Node.js 20.19+** + **pnpm 8.8+**

### 后端

```bash
cd XuYa-Max-backend

# 1. 初始化数据库（任选一种数据库脚本）
#    script/sql/mysql/ry_vue.sql + ry_config.sql + ry_ryjob.sql

# 2. 修改配置
#    xuya-max-admin/src/main/resources/application-dev.yml
#    （数据库连接、Redis 地址、OSS 配置）

# 3. 编译启动
mvn clean install -DskipTests
java -jar xuya-max-admin/target/xuya-max-admin.jar --spring.profiles.active=dev
# 默认端口 8080
```

### 前端

```bash
cd XuYa-Max-frontend

# 1. 安装依赖
pnpm install

# 2. 启动开发服务器（默认 3006，代理到后端 8080）
pnpm dev

# 3. 构建生产包
pnpm build
# 产物在 dist/，可直接用 nginx 托管
```

默认账号：`admin` / `admin123`

## 部署说明

前端构建产物支持**子目录部署**（hash 路由 + 相对资源路径），无需 nginx try_files 配置：

```nginx
server {
    listen 80;
    server_name xxx.com;

    # 子目录托管前端（dist 内容放到 /xuya/ 下）
    location /xuya/ {
        alias /path/to/dist/;
        index index.html;
    }

    # API 反向代理（绝对路径，指向根域名）
    location /prod-api/ {
        proxy_pass http://后端地址:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # SSE 长连接需要关闭缓冲
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

访问 `http://xxx.com/xuya/index.html`，路由形如 `#/dashboard/console`。

## AI 开发助手规范

项目内置两套 AI 助手规范，帮助 AI 编码工具快速理解项目约定：

- **`.claude/agents/`** — Claude Code 子 agent（CRUD 页面专家、API 类型专家、页面增强专家、总入口）
- **`.codex/skills/`** — Codex 开发技能（SKILL.md + references，含真实代码约定和使用案例）

规范覆盖了 `useTable + ArtTable + ArtSearchBar` 三件套模式、`request()` 自动解包约定、字典/权限/富文本安全渲染、SSE 消息联动等核心开发模式。

## 技术栈

### 后端

| 技术 | 说明 |
|---|---|
| Spring Boot 4.1 | 核心框架 |
| Sa-Token + JWT | 权限认证 |
| MyBatis Plus 3.5 | ORM |
| Redisson | Redis 客户端 |
| SpringDoc | 接口文档（基于 javadoc，零注解入侵） |
| Fesod | Excel 处理（EasyExcel 前身） |
| Hutool | 工具类 |
| MapStruct Plus | 对象映射 |
| Lock4j | 分布式锁 |

### 前端

| 技术 | 说明 |
|---|---|
| Vue 3.5 | 框架 |
| TypeScript 6 | 类型 |
| Vite 8 (Rolldown) | 构建 |
| Element Plus 2.14 | UI 组件库 |
| Pinia 3 | 状态管理 |
| Tailwind CSS 4 | 原子化 CSS |
| vue-router 5 | 路由（hash 模式） |
| vue-i18n 11 | 国际化 |
| @vueuse/core 14 | 组合式工具 |
| ECharts 6 | 图表 |
| WangEditor 5 | 富文本 |
| Iconify (Remix Icon) | 图标 |

## 致谢

本项目基于业界优秀的开源生态深度定制，感谢相关开源社区的贡献。

## License

[MIT](./LICENSE)
