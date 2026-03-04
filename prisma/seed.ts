import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充数据...')

  // 清空现有数据
  await prisma.pokeRecord.deleteMany()
  await prisma.workItemDependency.deleteMany()
  await prisma.progressLog.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.message.deleteMany()
  await prisma.workItem.deleteMany()
  await prisma.sprint.deleteMany()
  await prisma.statusConfig.deleteMany()
  await prisma.phaseConfig.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  console.log('已清空旧数据')

  // 创建用户
  const passwordHash = await bcrypt.hash('123456', 10)

  const zhangsan = await prisma.user.create({
    data: {
      email: 'zhangsan@example.com',
      name: '张三',
      password: passwordHash,
      role: 'DEVELOPER',
    },
  })

  const lisi = await prisma.user.create({
    data: {
      email: 'lisi@example.com',
      name: '李四',
      password: passwordHash,
      role: 'DEVELOPER',
    },
  })

  const wangwu = await prisma.user.create({
    data: {
      email: 'wangwu@example.com',
      name: '王五',
      password: passwordHash,
      role: 'TESTER',
    },
  })

  const zhaoliu = await prisma.user.create({
    data: {
      email: 'zhaoliu@example.com',
      name: '赵六',
      password: passwordHash,
      role: 'PRODUCT',
    },
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '管理员',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('已创建用户')

  // 创建项目
  const project1 = await prisma.project.create({
    data: {
      name: '用户系统重构',
      code: 'USR',
      description: '重构现有用户系统，提升性能和用户体验',
      status: 'ACTIVE',
      creatorId: admin.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: '支付模块优化',
      code: 'PAY',
      description: '优化支付流程，接入新的支付渠道',
      status: 'ACTIVE',
      creatorId: admin.id,
    },
  })

  console.log('已创建项目')

  // 添加项目成员
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: zhangsan.id, role: 'DEVELOPER' },
      { projectId: project1.id, userId: lisi.id, role: 'DEVELOPER' },
      { projectId: project1.id, userId: wangwu.id, role: 'TESTER' },
      { projectId: project1.id, userId: zhaoliu.id, role: 'PRODUCT' },
      { projectId: project2.id, userId: lisi.id, role: 'DEVELOPER' },
      { projectId: project2.id, userId: wangwu.id, role: 'TESTER' },
    ],
  })

  console.log('已添加项目成员')

  // 创建迭代
  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 1',
      goal: '完成用户登录和注册功能',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-15'),
      status: 'IN_PROGRESS',
    },
  })

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 2',
      goal: '完成用户个人中心功能',
      startDate: new Date('2026-03-16'),
      endDate: new Date('2026-03-31'),
      status: 'PLANNING',
    },
  })

  console.log('已创建迭代')

  // 创建需求
  const requirement1 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      type: 'REQUIREMENT',
      title: '用户登录功能',
      description: '实现用户通过邮箱和密码登录系统，支持记住密码功能',
      priority: 'P1',
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-03-10'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'IN_PROGRESS',
      creatorId: zhaoliu.id,
      devOwnerId: zhangsan.id,
      testOwnerId: wangwu.id,
      verifyOwnerId: zhaoliu.id,
    },
  })

  const requirement2 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      type: 'REQUIREMENT',
      title: '用户注册功能',
      description: '实现用户通过邮箱注册账号，需要邮箱验证',
      priority: 'P2',
      plannedStartDate: new Date('2026-03-05'),
      plannedEndDate: new Date('2026-03-15'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'NOT_STARTED',
      creatorId: zhaoliu.id,
      devOwnerId: lisi.id,
      testOwnerId: wangwu.id,
      verifyOwnerId: zhaoliu.id,
    },
  })

  console.log('已创建需求')

  // 创建任务
  const task1 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      parentId: requirement1.id,
      type: 'TASK',
      title: '前端登录页面开发',
      description: '开发登录页面UI，包括表单验证',
      priority: 'P1',
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-03-05'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'IN_PROGRESS',
      estimatedHours: 16,
      creatorId: zhangsan.id,
      devOwnerId: zhangsan.id,
    },
  })

  const task2 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      parentId: requirement1.id,
      type: 'TASK',
      title: '后端登录接口开发',
      description: '开发登录API接口，包括JWT token生成',
      priority: 'P1',
      plannedStartDate: new Date('2026-03-01'),
      plannedEndDate: new Date('2026-03-04'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'COMPLETED',
      estimatedHours: 24,
      actualHours: 20,
      creatorId: lisi.id,
      devOwnerId: lisi.id,
    },
  })

  const task3 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      parentId: requirement1.id,
      type: 'TASK',
      title: '联调后端登录接口',
      description: '前后端联调登录功能',
      priority: 'P1',
      plannedStartDate: new Date('2026-03-05'),
      plannedEndDate: new Date('2026-03-07'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'NOT_STARTED',
      estimatedHours: 8,
      creatorId: zhangsan.id,
      devOwnerId: zhangsan.id,
    },
  })

  const task4 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      parentId: requirement2.id,
      type: 'TASK',
      title: '前端注册页面开发',
      description: '开发注册页面UI',
      priority: 'P2',
      plannedStartDate: new Date('2026-03-05'),
      plannedEndDate: new Date('2026-03-10'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'NOT_STARTED',
      estimatedHours: 16,
      creatorId: lisi.id,
      devOwnerId: lisi.id,
    },
  })

  console.log('已创建任务')

  // 创建缺陷
  const bug1 = await prisma.workItem.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      parentId: requirement1.id,
      type: 'BUG',
      title: '登录按钮样式问题',
      description: '在移动端登录按钮显示不完整',
      priority: 'P3',
      plannedStartDate: new Date('2026-03-02'),
      plannedEndDate: new Date('2026-03-03'),
      currentPhase: 'DEVELOPMENT',
      devStatus: 'NOT_STARTED',
      estimatedHours: 2,
      creatorId: wangwu.id,
      devOwnerId: zhangsan.id,
    },
  })

  console.log('已创建缺陷')

  // 创建依赖关系 (task3 依赖 task2)
  const dependency1 = await prisma.workItemDependency.create({
    data: {
      workItemId: task3.id,
      dependsOnId: task2.id,
      dependencyType: 'FF',
      createdById: zhangsan.id,
    },
  })

  console.log('已创建依赖关系')

  // 创建评论
  await prisma.comment.createMany({
    data: [
      {
        workItemId: requirement1.id,
        userId: zhaoliu.id,
        content: '这个需求需要支持记住密码功能，请注意添加',
      },
      {
        workItemId: requirement1.id,
        userId: zhangsan.id,
        content: '好的，我会在前端添加记住密码的checkbox',
      },
      {
        workItemId: task2.id,
        userId: lisi.id,
        content: '接口已开发完成，文档已更新到API文档中',
      },
    ],
  })

  console.log('已创建评论')

  // 创建消息
  await prisma.message.createMany({
    data: [
      {
        userId: zhangsan.id,
        type: 'ASSIGNMENT',
        title: '新任务指派',
        content: '你被指派为【用户登录功能】的开发负责人',
        targetType: 'WORK_ITEM',
        targetId: requirement1.id,
        isRead: true,
      },
      {
        userId: zhangsan.id,
        type: 'POKE',
        title: '李四戳了你一下',
        content: '李四（后端）戳了你一下（联调后端登录接口）',
        targetType: 'WORK_ITEM',
        targetId: task3.id,
        isRead: false,
      },
      {
        userId: zhangsan.id,
        type: 'COMMENT',
        title: '新评论',
        content: '赵六 在【用户登录功能】中发表了评论',
        targetType: 'WORK_ITEM',
        targetId: requirement1.id,
        isRead: false,
      },
    ],
  })

  console.log('已创建消息')

  // 创建操作记录
  await prisma.activityLog.createMany({
    data: [
      {
        workItemId: requirement1.id,
        userId: zhaoliu.id,
        action: '创建了工作项',
      },
      {
        workItemId: requirement1.id,
        userId: zhaoliu.id,
        action: '修改了开发负责人',
        oldValue: '无',
        newValue: '张三',
      },
      {
        workItemId: task2.id,
        userId: lisi.id,
        action: '修改了状态',
        oldValue: '进行中',
        newValue: '已完成',
      },
    ],
  })

  console.log('已创建操作记录')

  // 创建进度记录
  await prisma.progressLog.createMany({
    data: [
      {
        workItemId: task1.id,
        userId: zhangsan.id,
        date: new Date('2026-03-01'),
        isCompleted: false,
      },
      {
        workItemId: task1.id,
        userId: zhangsan.id,
        date: new Date('2026-03-02'),
        isCompleted: false,
      },
      {
        workItemId: task2.id,
        userId: lisi.id,
        date: new Date('2026-03-01'),
        isCompleted: false,
      },
      {
        workItemId: task2.id,
        userId: lisi.id,
        date: new Date('2026-03-03'),
        isCompleted: true,
      },
    ],
  })

  console.log('已创建进度记录')

  // 创建关注
  await prisma.follow.createMany({
    data: [
      {
        userId: zhangsan.id,
        targetType: 'SPRINT',
        sprintId: sprint1.id,
      },
      {
        userId: zhangsan.id,
        targetType: 'WORK_ITEM',
        workItemId: requirement1.id,
      },
      {
        userId: lisi.id,
        targetType: 'WORK_ITEM',
        workItemId: requirement1.id,
      },
    ],
  })

  console.log('已创建关注')

  // 创建戳一戳记录
  await prisma.pokeRecord.create({
    data: {
      dependencyId: dependency1.id,
      pokerId: lisi.id,
      pokedId: zhangsan.id,
      message: '李四（后端）戳了你一下（联调后端登录接口）',
    },
  })

  console.log('已创建戳一戳记录')

  console.log('✅ 数据填充完成！')
  console.log('')
  console.log('测试账号：')
  console.log('  邮箱: zhangsan@example.com  密码: 123456  (开发)')
  console.log('  邮箱: lisi@example.com      密码: 123456  (开发)')
  console.log('  邮箱: wangwu@example.com    密码: 123456  (测试)')
  console.log('  邮箱: zhaoliu@example.com   密码: 123456  (产品)')
  console.log('  邮箱: admin@example.com     密码: 123456  (管理员)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
