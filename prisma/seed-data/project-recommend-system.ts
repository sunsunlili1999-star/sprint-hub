import { PrismaClient, ProjectStatus, SprintStatus, WorkItemType, Priority, Phase, ProjectRole } from '@prisma/client'

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
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-14'),
        goal: '实现基于协同过滤和内容推荐的混合推荐算法',
      },
    }),
    prisma.sprint.create({
      data: {
        id: 'sprint-recommend-003',
        name: 'Sprint 3 - 场景接入',
        projectId: project.id,
        status: SprintStatus.PLANNING,
        startDate: new Date('2026-02-17'),
        endDate: new Date('2026-03-02'),
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

  console.log(`  已创建项目: ${project.name}`)
  console.log(`  已关联 2 个产品（小康App、标签平台）`)
  console.log(`  已添加 ${6} 个成员`)
  console.log(`  已创建 ${sprints.length} 个迭代`)
  console.log(`  已创建 ${requirements.length} 个需求`)
  console.log(`  已创建 ${tasks.length} 个任务`)
  console.log(`  已同步小康App的 2 个需求到项目`)

  return project
}
