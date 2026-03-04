# SprintHub - 项目迭代管理系统

<div align="center">

![SprintHub Logo](https://img.shields.io/badge/SprintHub-项目迭代管理系统-blue?style=for-the-badge&logo=sprint&logoColor=white)

**AI赋能的现代化项目迭代管理平台**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## 功能特性

### 核心功能
- **多项目管理** - 支持多项目、多迭代的层级管理
- **工作项管理** - 需求、任务、缺陷的完整生命周期管理
- **依赖管理** - 工作项之间的依赖关系，支持跨项目依赖
- **智能待办** - 基于工作项自动同步的TodoList
- **操作留痕** - 所有操作记录可追溯
- **关注通知** - 关注迭代/工作项，接收变更通知

### AI赋能
- **智能拆分任务** - 输入需求文档，AI自动生成任务列表
- **风险预警** - 分析依赖链路和资源负载，预测延期风险
- **工时估算** - 基于历史数据智能估算任务工时
- **智能排期** - 考虑依赖和资源约束自动排期
- **日报周报生成** - 基于工作记录自动生成工作报告

### 可视化视图
- **甘特图** - 工作项时间线和依赖关系
- **燃尽图** - 迭代进度燃尽曲线
- **看板视图** - 按状态分列展示
- **资源视图** - 人员工作负载分析
- **依赖图** - 可视化依赖网络

---

## 快速开始

### 环境要求

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** (用于运行数据库)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/sprint-hub.git
cd sprint-hub
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动数据库

使用 Docker Compose 启动 PostgreSQL 数据库：

```bash
# 启动数据库服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f postgres
```

数据库信息：
| 配置项 | 值 |
|--------|-----|
| 主机 | localhost |
| 端口 | 5432 |
| 用户名 | postgres |
| 密码 | postgres123 |
| 数据库名 | sprint_hub |

#### 可选：使用 pgAdmin 管理数据库

pgAdmin 是一个可视化的数据库管理工具，已包含在 docker-compose 中：

- **访问地址**: http://localhost:5050
- **登录邮箱**: admin@example.com
- **登录密码**: admin123

连接数据库时使用：
- **主机名**: postgres (Docker 内部网络)
- **端口**: 5432
- **用户名**: postgres
- **密码**: postgres123

### 4. 配置环境变量

项目根目录下已有 `.env` 文件，默认配置如下：

```env
# 数据库配置
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/sprint_hub?schema=public"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"

# AI 配置 (可选)
# OPENAI_API_KEY="your-openai-api-key"
```

> **注意**: 生产环境请修改 `NEXTAUTH_SECRET` 为随机安全字符串

### 5. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# (可选) 填充测试数据
npx prisma db seed

# （可选）可视化数据库
npx prisma studio

```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可看到应用界面。

---

## 项目结构

```
sprint-hub/
├── prisma/
│   └── schema.prisma      # 数据库模型定义
├── src/
│   ├── app/               # Next.js App Router 页面
│   │   ├── page.tsx       # 首页仪表板
│   │   ├── projects/      # 项目管理
│   │   ├── todos/         # 智能待办
│   │   ├── messages/      # 消息中心
│   │   ├── ai/            # AI 助手
│   │   └── api/           # API 路由
│   ├── components/
│   │   ├── ui/            # 基础 UI 组件
│   │   └── layout/        # 布局组件
│   ├── lib/               # 工具函数
│   ├── hooks/             # React Hooks
│   ├── store/             # 状态管理
│   └── types/             # TypeScript 类型
├── docker-compose.yml     # Docker 配置
├── .env                   # 环境变量
└── README.md
```

---

## 常用命令

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

### 数据库命令

```bash
# 生成 Prisma Client
npx prisma generate

# 创建迁移
npx prisma migrate dev --name <migration-name>

# 应用迁移（生产环境）
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset

# 打开 Prisma Studio（数据库可视化工具）
npx prisma studio
```

### Docker 命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重建服务
docker-compose up -d --build

# 删除所有数据（包括数据库数据）
docker-compose down -v
```

---

## 数据库模型

### 核心实体

| 实体 | 说明 |
|------|------|
| User | 用户 |
| Project | 项目 |
| Sprint | 迭代 |
| WorkItem | 工作项（需求/任务/缺陷） |
| WorkItemDependency | 工作项依赖关系 |
| Comment | 评论 |
| Follow | 关注 |
| Message | 消息通知 |
| ActivityLog | 操作记录 |
| ProgressLog | 进度记录（TodoList） |

### 实体关系图

```
Project (项目)
  ├── Sprint (迭代)
  │     └── WorkItem (工作项)
  │           ├── 需求 (Requirement)
  │           │     ├── 任务 (Task)
  │           │     └── 缺陷 (Bug)
  │           └── WorkItemDependency (依赖关系)
  └── ProjectMember (项目成员)
```

---

## 技术栈

### 前端
- **Next.js 16** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **Radix UI** - 无障碍 UI 组件
- **Lucide Icons** - 图标库
- **Zustand** - 状态管理
- **React Query** - 数据请求

### 后端
- **Next.js API Routes** - API 服务
- **Prisma** - ORM 数据库工具
- **PostgreSQL** - 关系型数据库
- **NextAuth.js** - 身份认证

### 开发工具
- **ESLint** - 代码规范
- **Docker** - 容器化部署
- **Prisma Studio** - 数据库可视化

---

## 截图预览

### 首页仪表板
- 逾期警告横幅
- 工作统计卡片
- 今日待办列表
- AI 助手入口
- 项目进度概览
- 团队动态

### 项目列表
- 项目卡片展示
- 进度条显示
- 成员头像
- 筛选和搜索

### 智能待办
- 按需求分组展示
- 进度标记功能
- 完成状态切换
- 逾期警告

### AI 助手
- 日报周报生成
- 智能任务拆分
- 风险预警分析
- 工时估算

---

## 部署

### 使用 Docker 部署

```bash
# 构建镜像
docker build -t sprint-hub .

# 运行容器
docker run -p 3000:3000 sprint-hub
```

### 使用 Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

---

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 许可证

MIT License

---

## 联系我们

如有问题或建议，请提交 [Issue](https://github.com/your-username/sprint-hub/issues)。

---

<div align="center">

**SprintHub** - 让项目管理更智能

</div>
