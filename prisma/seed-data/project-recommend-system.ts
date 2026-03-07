import { PrismaClient, ProjectStatus, SprintStatus, WorkItemType, Priority, Phase, ProjectRole, RequirementType } from '@prisma/client'

// 推荐系统项目数据
export async function seedRecommendSystemProject(prisma: PrismaClient) {
  console.log('创建推荐系统项目...')

  // 创建项目
  const project = await prisma.project.create({
    data: {
      id: 'project-recommend-system',
      name: '推荐系统',
      code: 'RECOMMEND',
      description: '基于AI的智能推荐系统项目，为小康App和标签平台提供个性化内容推荐能力，包括健康知识推荐、医生推荐、用户标签推荐等场景。',
      status: ProjectStatus.ACTIVE,
      starred: true,
      creatorId: 'user-admin',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-06-30'),
    },
  })

  // 关联产品：小康App 和 标签平台
  await (prisma as any).projectProduct.createMany({
    data: [
      { projectId: project.id, productId: 'product-xiaokang-app' },
      { projectId: project.id, productId: 'product-tag-platform' },
    ],
  })

  // 添加项目成员
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: 'user-admin', role: ProjectRole.MANAGER },
      { projectId: project.id, userId: 'user-zhangsan', role: ProjectRole.DEVELOPER },
      { projectId: project.id, userId: 'user-lisi', role: ProjectRole.DEVELOPER },
      { projectId: project.id, userId: 'user-wangwu', role: ProjectRole.TESTER },
      { projectId: project.id, userId: 'user-zhaoliu', role: ProjectRole.PRODUCT },
      { projectId: project.id, userId: 'user-chenqi', role: ProjectRole.PRODUCT },
    ],
  })

  // 创建迭代
  const sprints = await Promise.all([
    prisma.sprint.create({
      data: {
        id: 'sprint-recommend-001',
        name: 'Sprint 1 - 基础架构',
        projectId: project.id,
        status: SprintStatus.COMPLETED,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-01-29'),
        goal: '搭建推荐系统基础架构，完成数据采集和特征工程基础设施',
      },
    }),
    prisma.sprint.create({
      data: {
        id: 'sprint-recommend-002',
        name: 'Sprint 2 - 推荐算法',
        projectId: project.id,
        status: SprintStatus.IN_PROGRESS,
        startDate: new Date('2026-02-20'),
        endDate: new Date('2026-03-20'),
        goal: '实现基于协同过滤和内容推荐的混合推荐算法',
      },
    }),
    prisma.sprint.create({
      data: {
        id: 'sprint-recommend-003',
        name: 'Sprint 3 - 场景接入',
        projectId: project.id,
        status: SprintStatus.PLANNING,
        startDate: new Date('2026-03-21'),
        endDate: new Date('2026-04-20'),
        goal: '完成小康App和标签平台的推荐场景接入',
      },
    }),
  ])

  // ==================== Sprint 1 需求 ====================
  const sprint1Req = await prisma.workItem.create({
    data: {
      id: 'req-recommend-001',
      title: '用户行为数据采集服务',
      description: '构建用户行为数据采集服务，收集用户在小康App和知识平台上的浏览、点击、搜索、收藏等行为数据，为推荐算法提供数据基础。',
      type: WorkItemType.REQUIREMENT,
      priority: Priority.P0,
      currentPhase: Phase.TESTING,
      devStatus: 'COMPLETED',
      projectId: project.id,
      sprintId: sprints[0].id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 32,
      actualHours: 28,
    },
  })

  // Sprint 1 任务
  await prisma.workItem.createMany({
    data: [
      {
        id: 'task-recommend-001',
        title: '设计数据采集SDK',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'COMPLETED',
        projectId: project.id,
        sprintId: sprints[0].id,
        parentId: sprint1Req.id,
        creatorId: 'user-zhangsan',
        devOwnerId: 'user-zhangsan',
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        id: 'task-recommend-002',
        title: '实现数据上报接口',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'COMPLETED',
        projectId: project.id,
        sprintId: sprints[0].id,
        parentId: sprint1Req.id,
        creatorId: 'user-zhangsan',
        devOwnerId: 'user-zhangsan',
        estimatedHours: 16,
        actualHours: 14,
      },
    ],
  })

  // ==================== Sprint 2 需求和任务 ====================
  // Sprint 2 时间范围: 2026-02-20 ~ 2026-03-20 (28天)

  // 需求1: 用户画像构建 (2.20-3.1)
  const req2 = await prisma.workItem.create({
    data: {
      id: 'req-recommend-002',
      title: '用户画像构建',
      description: '基于用户基础信息和行为数据，构建用户健康画像，包括健康关注点、疾病史、用药习惯、内容偏好等维度。',
      type: WorkItemType.REQUIREMENT,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      sprintId: sprints[1].id,
      creatorId: 'user-admin',
      devOwnerId: 'user-lisi',
      estimatedHours: 40,
      plannedStartDate: new Date('2026-02-20'),
      plannedEndDate: new Date('2026-03-01'),
    },
  })

  // 用户画像任务
  const task2_1 = await prisma.workItem.create({
    data: {
      id: 'task-user-profile-model',
      title: '用户画像数据模型设计',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'COMPLETED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: req2.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 8,
      actualHours: 6,
      plannedStartDate: new Date('2026-02-20'),
      plannedEndDate: new Date('2026-02-21'),
    },
  })

  // 任务下的工作项
  const wi2_1_api = await prisma.workItem.create({
    data: {
      id: 'wi-user-profile-api',
      title: '用户画像接口开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task2_1.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-02-22'),
      plannedEndDate: new Date('2026-02-25'),
    },
  })

  const wi2_1_page = await prisma.workItem.create({
    data: {
      id: 'wi-user-profile-page',
      title: '用户画像页面开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task2_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 10,
      plannedStartDate: new Date('2026-02-22'),
      plannedEndDate: new Date('2026-02-25'),
    },
  })

  const wi2_1_debug = await prisma.workItem.create({
    data: {
      id: 'wi-user-profile-debug',
      title: '用户画像接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task2_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-02-26'),
      plannedEndDate: new Date('2026-02-27'),
    },
  })

  // 需求2: 协同过滤推荐算法 (3.1-3.10)
  const req3 = await prisma.workItem.create({
    data: {
      id: 'req-recommend-003',
      title: '协同过滤推荐算法',
      description: '实现基于用户行为的协同过滤推荐算法，支持基于用户的协同过滤(User-CF)和基于物品的协同过滤(Item-CF)。',
      type: WorkItemType.REQUIREMENT,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      sprintId: sprints[1].id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 48,
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-03-10'),
    },
  })

  // 协同过滤任务
  const task3_1 = await prisma.workItem.create({
    data: {
      id: 'task-cf-user',
      title: 'User-CF算法实现',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: req3.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 20,
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-03-05'),
    },
  })

  const wi3_1_api = await prisma.workItem.create({
    data: {
      id: 'wi-cf-user-api',
      title: 'User-CF推荐接口开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task3_1.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-03-03'),
    },
  })

  const wi3_1_page = await prisma.workItem.create({
    data: {
      id: 'wi-cf-user-page',
      title: 'User-CF推荐展示页面',
      type: WorkItemType.TASK,
      priority: Priority.P2,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task3_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 6,
      plannedStartDate: new Date('2026-03-03'),
      plannedEndDate: new Date('2026-03-04'),
    },
  })

  const wi3_1_debug = await prisma.workItem.create({
    data: {
      id: 'wi-cf-user-debug',
      title: 'User-CF接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task3_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-03-04'),
      plannedEndDate: new Date('2026-03-05'),
    },
  })

  const task3_2 = await prisma.workItem.create({
    data: {
      id: 'task-cf-item',
      title: 'Item-CF算法实现',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: req3.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-lisi',
      estimatedHours: 18,
      plannedStartDate: new Date('2026-03-06'),
      plannedEndDate: new Date('2026-03-10'),
    },
  })

  const wi3_2_api = await prisma.workItem.create({
    data: {
      id: 'wi-cf-item-api',
      title: 'Item-CF推荐接口开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task3_2.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 10,
      plannedStartDate: new Date('2026-03-06'),
      plannedEndDate: new Date('2026-03-08'),
    },
  })

  const wi3_2_page = await prisma.workItem.create({
    data: {
      id: 'wi-cf-item-page',
      title: 'Item-CF推荐展示页面',
      type: WorkItemType.TASK,
      priority: Priority.P2,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task3_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-03-08'),
      plannedEndDate: new Date('2026-03-09'),
    },
  })

  const wi3_2_debug = await prisma.workItem.create({
    data: {
      id: 'wi-cf-item-debug',
      title: 'Item-CF接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task3_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-03-09'),
      plannedEndDate: new Date('2026-03-10'),
    },
  })

  // 需求3: 内容推荐算法 (3.10-3.20)
  const req4 = await prisma.workItem.create({
    data: {
      id: 'req-recommend-004',
      title: '内容推荐算法',
      description: '实现基于内容的推荐算法，根据健康知识、文章的内容特征和用户兴趣进行匹配推荐。',
      type: WorkItemType.REQUIREMENT,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      creatorId: 'user-admin',
      estimatedHours: 40,
      plannedStartDate: new Date('2026-03-10'),
      plannedEndDate: new Date('2026-03-20'),
    },
  })

  const task4_1 = await prisma.workItem.create({
    data: {
      id: 'task-content-feature',
      title: '内容特征提取',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: req4.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 16,
      plannedStartDate: new Date('2026-03-10'),
      plannedEndDate: new Date('2026-03-14'),
    },
  })

  const wi4_1_api = await prisma.workItem.create({
    data: {
      id: 'wi-content-feature-api',
      title: '内容特征提取接口开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task4_1.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-03-10'),
      plannedEndDate: new Date('2026-03-13'),
    },
  })

  const wi4_1_debug = await prisma.workItem.create({
    data: {
      id: 'wi-content-feature-debug',
      title: '内容特征提取接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task4_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-03-13'),
      plannedEndDate: new Date('2026-03-14'),
    },
  })

  const task4_2 = await prisma.workItem.create({
    data: {
      id: 'task-content-match',
      title: '内容匹配推荐',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: req4.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-lisi',
      estimatedHours: 20,
      plannedStartDate: new Date('2026-03-14'),
      plannedEndDate: new Date('2026-03-20'),
    },
  })

  const wi4_2_api = await prisma.workItem.create({
    data: {
      id: 'wi-content-match-api',
      title: '内容匹配推荐接口开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task4_2.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 10,
      plannedStartDate: new Date('2026-03-14'),
      plannedEndDate: new Date('2026-03-17'),
    },
  })

  const wi4_2_page = await prisma.workItem.create({
    data: {
      id: 'wi-content-match-page',
      title: '内容推荐展示页面',
      type: WorkItemType.TASK,
      priority: Priority.P2,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task4_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 6,
      plannedStartDate: new Date('2026-03-17'),
      plannedEndDate: new Date('2026-03-18'),
    },
  })

  const wi4_2_debug = await prisma.workItem.create({
    data: {
      id: 'wi-content-match-debug',
      title: '内容匹配推荐接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[1].id,
      parentId: task4_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-03-18'),
      plannedEndDate: new Date('2026-03-20'),
    },
  })

  // ==================== Sprint 3 需求 (智能规划假数据) ====================
  // 模拟从智能规划导入的电商平台需求

  // 需求1: 用户登录与注册模块
  const req5 = await prisma.workItem.create({
    data: {
      id: 'req-ecommerce-login',
      title: '用户登录与注册模块',
      description: '支持手机号、邮箱、第三方登录注册，为电商平台提供完整的用户认证体系。',
      type: WorkItemType.REQUIREMENT,
      requirementType: RequirementType.FEATURE,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      creatorId: 'user-zhaoliu',
      estimatedHours: 52,
      plannedStartDate: new Date('2026-03-21'),
      plannedEndDate: new Date('2026-03-28'),
    },
  })

  const task5_1 = await prisma.workItem.create({
    data: {
      id: 'task-login-ui',
      title: '登录注册UI开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: req5.id,
      creatorId: 'user-zhaoliu',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 16,
      plannedStartDate: new Date('2026-03-21'),
      plannedEndDate: new Date('2026-03-23'),
    },
  })

  const wi5_1_login_page = await prisma.workItem.create({
    data: {
      id: 'wi-login-page',
      title: '登录页面UI开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task5_1.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 8,
      plannedStartDate: new Date('2026-03-21'),
      plannedEndDate: new Date('2026-03-22'),
    },
  })

  const wi5_1_register_page = await prisma.workItem.create({
    data: {
      id: 'wi-register-page',
      title: '注册流程UI开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task5_1.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 8,
      plannedStartDate: new Date('2026-03-22'),
      plannedEndDate: new Date('2026-03-23'),
    },
  })

  const task5_2 = await prisma.workItem.create({
    data: {
      id: 'task-login-api',
      title: '登录注册API开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: req5.id,
      creatorId: 'user-zhaoliu',
      devOwnerId: 'user-lisi',
      estimatedHours: 28,
      plannedStartDate: new Date('2026-03-21'),
      plannedEndDate: new Date('2026-03-26'),
    },
  })

  const wi5_2_api = await prisma.workItem.create({
    data: {
      id: 'wi-login-register-api',
      title: '登录注册API开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task5_2.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 16,
      plannedStartDate: new Date('2026-03-21'),
      plannedEndDate: new Date('2026-03-24'),
    },
  })

  const wi5_2_third_party = await prisma.workItem.create({
    data: {
      id: 'wi-third-party-login',
      title: '第三方登录集成',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task5_2.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-03-24'),
      plannedEndDate: new Date('2026-03-26'),
    },
  })

  const wi5_debug = await prisma.workItem.create({
    data: {
      id: 'wi-login-debug',
      title: '登录注册接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task5_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-03-26'),
      plannedEndDate: new Date('2026-03-27'),
    },
  })

  // 需求2: 商品展示模块
  const req6 = await prisma.workItem.create({
    data: {
      id: 'req-ecommerce-product',
      title: '商品展示模块',
      description: '商品列表、详情、搜索、分类功能，支持多维度筛选和智能搜索。',
      type: WorkItemType.REQUIREMENT,
      requirementType: RequirementType.FEATURE,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      creatorId: 'user-zhaoliu',
      estimatedHours: 80,
      plannedStartDate: new Date('2026-03-28'),
      plannedEndDate: new Date('2026-04-08'),
    },
  })

  const task6_1 = await prisma.workItem.create({
    data: {
      id: 'task-product-list',
      title: '商品列表功能',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: req6.id,
      creatorId: 'user-zhaoliu',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 32,
      plannedStartDate: new Date('2026-03-28'),
      plannedEndDate: new Date('2026-04-02'),
    },
  })

  const wi6_1_page = await prisma.workItem.create({
    data: {
      id: 'wi-product-list-page',
      title: '商品列表页开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task6_1.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-03-28'),
      plannedEndDate: new Date('2026-03-30'),
    },
  })

  const wi6_1_api = await prisma.workItem.create({
    data: {
      id: 'wi-product-list-api',
      title: '商品列表API开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task6_1.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 16,
      plannedStartDate: new Date('2026-03-28'),
      plannedEndDate: new Date('2026-04-01'),
    },
  })

  const wi6_1_debug = await prisma.workItem.create({
    data: {
      id: 'wi-product-list-debug',
      title: '商品列表接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task6_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-04-01'),
      plannedEndDate: new Date('2026-04-02'),
    },
  })

  const task6_2 = await prisma.workItem.create({
    data: {
      id: 'task-product-detail',
      title: '商品详情功能',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: req6.id,
      creatorId: 'user-zhaoliu',
      devOwnerId: 'user-admin',
      estimatedHours: 28,
      plannedStartDate: new Date('2026-04-02'),
      plannedEndDate: new Date('2026-04-06'),
    },
  })

  const wi6_2_page = await prisma.workItem.create({
    data: {
      id: 'wi-product-detail-page',
      title: '商品详情页开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task6_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 16,
      plannedStartDate: new Date('2026-04-02'),
      plannedEndDate: new Date('2026-04-04'),
    },
  })

  const wi6_2_api = await prisma.workItem.create({
    data: {
      id: 'wi-product-detail-api',
      title: '商品详情API开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task6_2.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 8,
      plannedStartDate: new Date('2026-04-02'),
      plannedEndDate: new Date('2026-04-04'),
    },
  })

  const wi6_2_debug = await prisma.workItem.create({
    data: {
      id: 'wi-product-detail-debug',
      title: '商品详情接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task6_2.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-04-04'),
      plannedEndDate: new Date('2026-04-06'),
    },
  })

  // 需求3: 购物车模块
  const req7 = await prisma.workItem.create({
    data: {
      id: 'req-ecommerce-cart',
      title: '购物车模块',
      description: '添加、修改、删除商品，支持商品数量调整和批量操作。',
      type: WorkItemType.REQUIREMENT,
      requirementType: RequirementType.FEATURE,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      creatorId: 'user-zhaoliu',
      estimatedHours: 36,
      plannedStartDate: new Date('2026-04-08'),
      plannedEndDate: new Date('2026-04-14'),
    },
  })

  const task7_1 = await prisma.workItem.create({
    data: {
      id: 'task-cart-function',
      title: '购物车核心功能',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: req7.id,
      creatorId: 'user-zhaoliu',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 28,
      plannedStartDate: new Date('2026-04-08'),
      plannedEndDate: new Date('2026-04-12'),
    },
  })

  const wi7_1_page = await prisma.workItem.create({
    data: {
      id: 'wi-cart-page',
      title: '购物车页面开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task7_1.id,
      creatorId: 'user-zhangsan',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-04-08'),
      plannedEndDate: new Date('2026-04-10'),
    },
  })

  const wi7_1_api = await prisma.workItem.create({
    data: {
      id: 'wi-cart-api',
      title: '购物车API开发',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task7_1.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-04-08'),
      plannedEndDate: new Date('2026-04-10'),
    },
  })

  const wi7_1_debug = await prisma.workItem.create({
    data: {
      id: 'wi-cart-debug',
      title: '购物车接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task7_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-zhangsan',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-04-10'),
      plannedEndDate: new Date('2026-04-12'),
    },
  })

  // 需求4: 订单管理模块
  const req8 = await prisma.workItem.create({
    data: {
      id: 'req-ecommerce-order',
      title: '订单管理模块',
      description: '创建订单、订单列表、状态跟踪，完整的订单生命周期管理。',
      type: WorkItemType.REQUIREMENT,
      requirementType: RequirementType.FEATURE,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      creatorId: 'user-zhaoliu',
      estimatedHours: 58,
      plannedStartDate: new Date('2026-04-14'),
      plannedEndDate: new Date('2026-04-20'),
    },
  })

  const task8_1 = await prisma.workItem.create({
    data: {
      id: 'task-order-create',
      title: '订单创建流程',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: req8.id,
      creatorId: 'user-zhaoliu',
      devOwnerId: 'user-admin',
      estimatedHours: 32,
      plannedStartDate: new Date('2026-04-14'),
      plannedEndDate: new Date('2026-04-18'),
    },
  })

  const wi8_1_page = await prisma.workItem.create({
    data: {
      id: 'wi-order-create-page',
      title: '订单创建流程开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task8_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 12,
      plannedStartDate: new Date('2026-04-14'),
      plannedEndDate: new Date('2026-04-16'),
    },
  })

  const wi8_1_api = await prisma.workItem.create({
    data: {
      id: 'wi-order-api',
      title: '订单API开发',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task8_1.id,
      creatorId: 'user-lisi',
      devOwnerId: 'user-lisi',
      estimatedHours: 16,
      plannedStartDate: new Date('2026-04-14'),
      plannedEndDate: new Date('2026-04-17'),
    },
  })

  const wi8_1_debug = await prisma.workItem.create({
    data: {
      id: 'wi-order-debug',
      title: '订单接口联调',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      sprintId: sprints[2].id,
      parentId: task8_1.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 4,
      plannedStartDate: new Date('2026-04-17'),
      plannedEndDate: new Date('2026-04-18'),
    },
  })

  // ==================== 添加工作项依赖关系 ====================
  // 接口联调依赖接口开发（页面开发不依赖）
  
  await prisma.workItemDependency.createMany({
    data: [
      // Sprint 2 依赖
      { workItemId: wi2_1_debug.id, dependsOnId: wi2_1_api.id, createdById: 'user-admin' },
      { workItemId: wi3_1_debug.id, dependsOnId: wi3_1_api.id, createdById: 'user-admin' },
      { workItemId: wi3_2_debug.id, dependsOnId: wi3_2_api.id, createdById: 'user-admin' },
      { workItemId: wi4_1_debug.id, dependsOnId: wi4_1_api.id, createdById: 'user-admin' },
      { workItemId: wi4_2_debug.id, dependsOnId: wi4_2_api.id, createdById: 'user-admin' },
      
      // Sprint 3 依赖
      { workItemId: wi5_debug.id, dependsOnId: wi5_2_api.id, createdById: 'user-admin' },
      { workItemId: wi6_1_debug.id, dependsOnId: wi6_1_api.id, createdById: 'user-admin' },
      { workItemId: wi6_2_debug.id, dependsOnId: wi6_2_api.id, createdById: 'user-admin' },
      { workItemId: wi7_1_debug.id, dependsOnId: wi7_1_api.id, createdById: 'user-admin' },
      { workItemId: wi8_1_debug.id, dependsOnId: wi8_1_api.id, createdById: 'user-admin' },
    ],
  })

  console.log(`  已创建项目: ${project.name}`)
  console.log(`  已关联 2 个产品（小康App、标签平台）`)
  console.log(`  已添加 6 个成员`)
  console.log(`  已创建 3 个迭代`)
  console.log(`  - Sprint 1: 1 个需求, 2 个任务`)
  console.log(`  - Sprint 2: 3 个需求, 6 个任务, 12 个工作项`)
  console.log(`  - Sprint 3: 4 个需求 (智能规划导入), 8 个任务, 16 个工作项`)
  console.log(`  已创建 10 个工作项依赖关系`)

  return project
}
