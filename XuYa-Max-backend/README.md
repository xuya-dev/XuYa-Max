# XuYa-Max Backend

后端服务，Java 包名 `dev.xuya`，版本 1.0.0。聚焦权限管理、系统监控、消息推送、文件管理等核心后台能力。

## 模块结构

```
xuya-max-backend
├── xuya-max-admin          # 启动入口（XuYaApplication）
├── xuya-max-api            # 对外 API（PushPayloadDTO / UserOnlineDTO / Feign 接口）
├── xuya-max-common         # 通用模块
│   ├── xuya-max-common-core       # 核心工具（R / PageResult / 枚举 / 工具类）
│   ├── xuya-max-common-doc        # 接口文档（SpringDoc + javadoc）
│   ├── xuya-max-common-encrypt    # 接口加解密（AES + RSA）
│   ├── xuya-max-common-excel      # Excel 导入导出（Fesod）
│   ├── xuya-max-common-json       # JSON 序列化（Jackson）
│   ├── xuya-max-common-log        # 操作日志（注解 + AOP）
│   ├── xuya-max-common-mail       # 邮件
│   ├── xuya-max-common-mybatis    # MyBatis Plus 封装（数据权限 / 分页 / 雪花 ID）
│   ├── xuya-max-common-oss        # 文件存储（S3 协议）
│   ├── xuya-max-common-push       # SSE 消息推送
│   ├── xuya-max-common-redis      # Redis 缓存（Redisson）
│   ├── xuya-max-common-satoken    # 权限认证（Sa-Token）
│   ├── xuya-max-common-security   # 安全（数据脱敏 / XSS / 密码加密）
│   ├── xuya-max-common-sensitive  # 数据敏感词
│   ├── xuya-max-common-web        # Web 基础（全局异常 / 跨域 / 拦截器）
│   └── xuya-max-common-bom        # 依赖版本管理
├── xuya-max-extend         # 扩展模块（SnailJob Server）
├── xuya-max-modules        # 业务模块
│   ├── xuya-max-system            # 系统管理（用户/角色/菜单/部门/字典/通知/消息...）
│   └── xuya-max-job               # 定时任务
└── script                  # 数据库脚本（mysql / oracle / postgres / sqlserver）
```

## 技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| Spring Boot | 4.1.0 | 核心框架 |
| JDK | 21 | 运行环境 |
| Sa-Token | 1.45.0 | 权限认证 |
| MyBatis Plus | 3.5.16 | ORM |
| Redisson | 4.6.1 | Redis 客户端 |
| SpringDoc | 3.0.3 | 接口文档 |
| Hutool | 5.8.46 | 工具类 |
| MapStruct Plus | 1.5.1 | 对象映射 |
| Fesod | 2.0.2 | Excel 处理 |
| Lock4j | 2.2.7 | 分布式锁 |
| AWS SDK | 2.42.9 | S3 对象存储 |

## 快速启动

### 环境要求

- JDK 21+
- MySQL 8+（或 Oracle / PostgreSQL / SQLServer）
- Redis 6+
- Maven 3.9+

### 步骤

```bash
# 1. 初始化数据库
#    执行 script/sql/mysql/ 下的 SQL 脚本

# 2. 修改配置
#    编辑 xuya-max-admin/src/main/resources/application-dev.yml
#    重点：数据库连接、Redis 地址、OSS 配置

# 3. 编译
mvn clean install -DskipTests

# 4. 启动
java -jar xuya-max-admin/target/xuya-max-admin.jar --spring.profiles.active=dev
```

默认端口 **8080**，启动后访问 `http://localhost:8080/doc.html` 查看接口文档。

## 核心特性

- **接口加密**：动态 AES + RSA 加密请求体（`@ApiEncrypt`）
- **数据权限**：MyBatis Plus 插件无感式 SQL 过滤
- **SSE 推送**：登录公告 / 系统消息 / 踢人下线，支持分布式
- **操作日志**：注解式记录（`@Log`），支持业务类型 / 操作人 / 耗时
- **防重复提交**：注解式（`@RepeatSubmit`），基于 Redis
- **数据脱敏**：注解 + Jackson 序列化期脱敏
- **多数据库**：原生支持 MySQL / Oracle / PostgreSQL / SQLServer，可异构切换

## 已裁剪的模块

本项目聚焦核心后台能力，以下模块已裁剪：

| 删除的模块 | 说明 |
|---|---|
| 多租户 | 删除 `tenant_id` 体系 |
| 工作流（WarmFlow） | 删除流程定义 / 实例 / 任务 |
| AI 大模型 | 删除 LLM 对话 / 知识库 |
| SnailJob 任务调度客户端 | 保留 Server，删除业务接入 |
| 代码生成器 | 删除 generator 模块 |

保留了权限管理、系统监控、消息推送、文件管理等核心后台功能。

## License

MIT
