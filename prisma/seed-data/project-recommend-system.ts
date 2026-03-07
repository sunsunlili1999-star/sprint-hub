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
        status: SprintStatus.IN_PROGRESS,
        startDate: new Date('2026-03-05'),
        endDate: new Date('2026-04-05'),
        goal: '完成小康App和标签平台的推荐场景接入',
      },
    }),
  ])

  // 创建项目需求
  const requirements = await Promise.all([
    prisma.workItem.create({
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
    }),
    prisma.workItem.create({
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
      },
    }),
    prisma.workItem.create({
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
      },
    }),
    prisma.workItem.create({
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
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-recommend-005',
        title: '小康App推荐接口',
        description: '为小康App提供推荐API接口，支持首页内容推荐、相关文章推荐、医生推荐等场景。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        sprintId: sprints[2].id,
        creatorId: 'user-zhaoliu',
        productId: 'product-xiaokang-app',
        estimatedHours: 24,
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-recommend-006',
        title: '标签平台推荐接口',
        description: '为标签平台提供推荐API接口，支持用户标签推荐、相似标签推荐、热门标签推荐等场景。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        sprintId: sprints[2].id,
        creatorId: 'user-chenqi',
        productId: 'product-tag-platform',
        estimatedHours: 24,
      },
    }),
  ])

  // 创建一些任务（子工作项）
  const tasks = await Promise.all([
    prisma.workItem.create({
      data: {
        id: 'task-recommend-001',
        title: '设计数据采集SDK',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'COMPLETED',
        projectId: project.id,
        parentId: requirements[0].id,
        creatorId: 'user-zhangsan',
        devOwnerId: 'user-zhangsan',
        estimatedHours: 8,
        actualHours: 6,
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'task-recommend-002',
        title: '实现数据上报接口',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'COMPLETED',
        projectId: project.id,
        parentId: requirements[0].id,
        creatorId: 'user-zhangsan',
        devOwnerId: 'user-zhangsan',
        estimatedHours: 16,
        actualHours: 14,
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'task-recommend-003',
        title: '用户基础标签提取',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        projectId: project.id,
        parentId: requirements[1].id,
        creatorId: 'user-lisi',
        devOwnerId: 'user-lisi',
        estimatedHours: 16,
      },
    }),
  ])

  // 将小康App的需求同步到推荐系统项目（关联项目和迭代）
  await prisma.workItem.updateMany({
    where: {
      productId: 'product-xiaokang-app',
      type: WorkItemType.REQUIREMENT,
    },
    data: {
      projectId: project.id,
      sprintId: sprints[1].id,  // 分配到 Sprint 2 - 推荐算法
    },
  })

  // ==================== Sprint 2 - 标签管理功能 ====================
  // 创建标签管理功能需求（属于标签平台产品）
  const tagManagementReq = await prisma.workItem.create({
    data: {
      id: 'req-tag-management',
      title: '标签管理功能',
      description: '实现标签平台的核心标签管理功能，包括标签列表主体分类、查询列表、新建标签-数据表映射等功能。为推荐系统提供标签数据支撑。',
      type: WorkItemType.REQUIREMENT,
      requirementType: RequirementType.FEATURE,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      productId: 'product-tag-platform',
      moduleId: 'module-tag-list',
      sprintId: sprints[1].id,  // Sprint 2 - 推荐算法
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 80,
      plannedStartDate: new Date('2026-02-01'),
      plannedEndDate: new Date('2026-02-14'),
    },
  })

  // 创建任务1：实现标签列表主体分类功能
  const task1 = await prisma.workItem.create({
    data: {
      id: 'task-tag-category',
      title: '实现标签列表主体分类功能',
      description: '实现标签按主体类型（用户、设备、订单等）进行分类展示，支持分类树形结构。',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      productId: 'product-tag-platform',
      moduleId: 'module-tag-list',
      sprintId: sprints[1].id,
      parentId: tagManagementReq.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 24,
      plannedStartDate: new Date('2026-02-01'),
      plannedEndDate: new Date('2026-02-05'),
    },
  })

  // 任务1的工作项
  await prisma.workItem.createMany({
    data: [
      {
        id: 'workitem-tag-category-page',
        title: '主体分类页面开发',
        description: '开发主体分类的前端页面，包括分类树形组件、分类筛选器等。',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'COMPLETED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task1.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-admin',
        estimatedHours: 8,
        actualHours: 7,
      },
      {
        id: 'workitem-tag-category-api',
        title: '主体分类接口开发',
        description: '开发主体分类的后端API，包括分类列表、分类详情、分类CRUD等接口。',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'COMPLETED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task1.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-lisi',  // 后端任务分配给李四
        estimatedHours: 8,
        actualHours: 10,
      },
      {
        id: 'workitem-tag-category-debug',
        title: '主体分类接口联调',
        description: '前后端接口联调，确保分类功能正常工作。',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task1.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-admin',
        estimatedHours: 4,
      },
    ],
  })

  // 创建任务2：实现查询列表功能
  const task2 = await prisma.workItem.create({
    data: {
      id: 'task-tag-query-list',
      title: '实现查询列表功能',
      description: '实现标签查询列表功能，支持多条件筛选、排序、分页。',
      type: WorkItemType.TASK,
      priority: Priority.P1,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'IN_PROGRESS',
      projectId: project.id,
      productId: 'product-tag-platform',
      moduleId: 'module-tag-list',
      sprintId: sprints[1].id,
      parentId: tagManagementReq.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 28,
      plannedStartDate: new Date('2026-02-03'),
      plannedEndDate: new Date('2026-02-08'),
    },
  })

  // 任务2的工作项
  await prisma.workItem.createMany({
    data: [
      {
        id: 'workitem-tag-query-page',
        title: '查询列表页面开发',
        description: '开发标签查询列表的前端页面，包括筛选表单、数据表格、分页组件等。',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task2.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-admin',
        estimatedHours: 12,
      },
      {
        id: 'workitem-tag-query-api',
        title: '查询列表接口开发',
        description: '开发标签查询列表的后端API，支持多条件筛选、排序、分页查询。',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task2.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-lisi',  // 后端任务分配给李四
        estimatedHours: 10,
      },
      {
        id: 'workitem-tag-query-debug',
        title: '查询列表接口联调',
        description: '前后端接口联调，确保列表筛选、排序、分页功能正常工作。',
        type: WorkItemType.TASK,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task2.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-admin',
        estimatedHours: 4,
      },
    ],
  })

  // 创建任务3：实现新建标签-数据表映射功能
  const task3 = await prisma.workItem.create({
    data: {
      id: 'task-tag-mapping',
      title: '实现新建标签-数据表映射功能',
      description: '实现新建标签时与数据表的映射配置，支持选择数据源、配置字段映射关系。',
      type: WorkItemType.TASK,
      priority: Priority.P0,
      currentPhase: Phase.DEVELOPMENT,
      devStatus: 'NOT_STARTED',
      projectId: project.id,
      productId: 'product-tag-platform',
      moduleId: 'module-tag-list',
      sprintId: sprints[1].id,
      parentId: tagManagementReq.id,
      creatorId: 'user-admin',
      devOwnerId: 'user-admin',
      estimatedHours: 32,
      plannedStartDate: new Date('2026-02-07'),
      plannedEndDate: new Date('2026-02-14'),
    },
  })

  // 任务3的工作项
  await prisma.workItem.createMany({
    data: [
      {
        id: 'workitem-tag-mapping-page',
        title: '标签映射配置页面开发',
        description: '开发新建标签时的数据表映射配置页面，包括数据源选择、字段拖拽映射组件。',
        type: WorkItemType.TASK,
        priority: Priority.P0,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task3.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-admin',
        estimatedHours: 16,
      },
      {
        id: 'workitem-tag-mapping-api',
        title: '标签映射配置接口开发',
        description: '开发标签与数据表映射关系的后端API，包括数据源列表、表结构获取、映射保存等接口。',
        type: WorkItemType.TASK,
        priority: Priority.P0,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task3.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-lisi',  // 后端任务分配给李四
        estimatedHours: 12,
      },
      {
        id: 'workitem-tag-mapping-debug',
        title: '标签映射配置接口联调',
        description: '前后端接口联调，确保映射配置功能完整可用。',
        type: WorkItemType.TASK,
        priority: Priority.P0,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        projectId: project.id,
        productId: 'product-tag-platform',
        moduleId: 'module-tag-list',
        sprintId: sprints[1].id,
        parentId: task3.id,
        creatorId: 'user-admin',
        devOwnerId: 'user-admin',
        estimatedHours: 4,
      },
    ],
  })

  console.log(`  已创建项目: ${project.name}`)
  console.log(`  已关联 2 个产品（小康App、标签平台）`)
  console.log(`  已添加 ${6} 个成员`)
  console.log(`  已创建 ${sprints.length} 个迭代`)
  console.log(`  已创建 ${requirements.length + 1} 个需求`)
  console.log(`  已创建 ${tasks.length + 3} 个任务`)
  console.log(`  已创建 9 个工作项（标签管理功能）`)
  console.log(`  已同步小康App的 2 个需求到项目`)

  return project
}
