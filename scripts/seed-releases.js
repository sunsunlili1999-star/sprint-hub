const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/sprint_hub?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('开始创建发布种子数据...\n');

  // 获取管理员用户
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@example.com' }
  });

  if (!admin) {
    console.log('未找到管理员用户，请先运行基础种子数据');
    return;
  }

  console.log('管理员:', admin.name, admin.id);

  // 获取项目
  const projects = await prisma.project.findMany({
    include: {
      workItems: {
        where: { type: 'REQUIREMENT' },
        select: { id: true, title: true, devStatus: true, testStatus: true, verifyStatus: true }
      }
    }
  });

  console.log(`\n找到 ${projects.length} 个项目`);

  // 删除已有发布数据（清理重复）
  await prisma.releaseLog.deleteMany({});
  await prisma.releaseItem.deleteMany({});
  await prisma.release.deleteMany({});
  console.log('已清理旧的发布数据\n');

  // ==================== 创建已完成的历史发布 ====================

  // 推荐系统项目 - 迭代1发布（已完成）
  const recommendProject = projects.find(p => p.name.includes('推荐'));
  if (recommendProject) {
    console.log('=== 推荐系统项目 ===');
    console.log('项目:', recommendProject.name);
    console.log('需求数:', recommendProject.workItems.length);

    // 创建已完成的发布 - v1.0.0
    const release1 = await prisma.release.create({
      data: {
        name: 'v1.0.0 用户行为采集',
        description: '上线用户行为埋点功能，支持iOS和安卓端的用户行为数据采集，为推荐算法提供数据基础。',
        projectId: recommendProject.id,
        plannedDate: new Date('2024-01-15'),
        actualDate: new Date('2024-01-14'),
        status: 'COMPLETED',
        riskLevel: 'LOW',
        ownerId: admin.id,
        creatorId: admin.id,
      }
    });
    console.log('\n创建发布:', release1.name);

    // 添加发布日志
    await prisma.releaseLog.createMany({
      data: [
        {
          releaseId: release1.id,
          action: 'CREATED',
          description: '创建发布「v1.0.0 用户行为采集」',
          createdById: admin.id,
          createdAt: new Date('2024-01-05'),
        },
        {
          releaseId: release1.id,
          action: 'ITEMS_ADDED',
          description: '添加 2 个需求到发布',
          createdById: admin.id,
          createdAt: new Date('2024-01-05'),
        },
        {
          releaseId: release1.id,
          action: 'CONFIRMED',
          description: '确认发布，计划发布日期 2024-01-15',
          createdById: admin.id,
          createdAt: new Date('2024-01-10'),
        },
        {
          releaseId: release1.id,
          action: 'COMPLETED',
          description: '发布完成，提前1天上线',
          createdById: admin.id,
          createdAt: new Date('2024-01-14'),
        },
      ]
    });

    // 创建已完成的发布 - v1.1.0
    const release2 = await prisma.release.create({
      data: {
        name: 'v1.1.0 用户画像',
        description: '上线用户画像构建功能，基于用户行为数据生成用户标签和兴趣画像。',
        projectId: recommendProject.id,
        plannedDate: new Date('2024-02-20'),
        actualDate: new Date('2024-02-22'),
        status: 'COMPLETED',
        riskLevel: 'MEDIUM',
        riskDescription: '画像计算任务复杂，可能影响上线时间',
        ownerId: admin.id,
        creatorId: admin.id,
      }
    });
    console.log('创建发布:', release2.name);

    await prisma.releaseLog.createMany({
      data: [
        {
          releaseId: release2.id,
          action: 'CREATED',
          description: '创建发布「v1.1.0 用户画像」',
          createdById: admin.id,
          createdAt: new Date('2024-02-01'),
        },
        {
          releaseId: release2.id,
          action: 'RISK_UPDATED',
          description: '风险等级: LOW -> MEDIUM，画像计算任务复杂',
          createdById: admin.id,
          createdAt: new Date('2024-02-10'),
        },
        {
          releaseId: release2.id,
          action: 'CONFIRMED',
          description: '确认发布，计划发布日期 2024-02-20',
          createdById: admin.id,
          createdAt: new Date('2024-02-15'),
        },
        {
          releaseId: release2.id,
          action: 'COMPLETED',
          description: '发布完成，延期2天上线',
          createdById: admin.id,
          createdAt: new Date('2024-02-22'),
        },
      ]
    });

    // ==================== 推荐系统迭代2 - 进行中的发布 ====================
    
    // 获取迭代2的需求
    const sprint2 = await prisma.sprint.findFirst({
      where: { 
        projectId: recommendProject.id,
        name: { contains: '2' }
      }
    });

    if (sprint2) {
      console.log('\n找到迭代2:', sprint2.name);

      // 获取迭代2中的需求
      const sprint2Requirements = await prisma.workItem.findMany({
        where: {
          sprintId: sprint2.id,
          type: 'REQUIREMENT'
        },
        select: { id: true, title: true, devStatus: true, testStatus: true }
      });

      console.log('迭代2需求数:', sprint2Requirements.length);

      // 创建进行中的发布 - v2.0.0
      const release3 = await prisma.release.create({
        data: {
          name: 'v2.0.0 标签管理与推荐算法',
          description: '本次发布包含标签管理功能完善和协同过滤推荐算法上线，是推荐系统的核心功能迭代。包括标签CRUD、主体分类、数据表映射等功能。',
          projectId: recommendProject.id,
          plannedDate: new Date('2026-03-15'),
          status: 'IN_PROGRESS',
          riskLevel: 'MEDIUM',
          riskDescription: '涉及多个功能模块，需要充分测试确保稳定性',
          ownerId: admin.id,
          creatorId: admin.id,
          aiRiskScore: 45,
          aiRiskAnalysis: {
            score: 45,
            level: 'MEDIUM',
            factors: [
              { name: '需求复杂度', impact: 25, description: '涉及标签管理和推荐算法两个核心模块' },
              { name: '开发进度', impact: 15, description: '部分需求开发进度略慢于计划' },
              { name: '测试覆盖', impact: 5, description: '测试用例覆盖率良好' },
            ],
            suggestions: [
              '建议增加接口联调的缓冲时间',
              '关注标签映射配置功能的边界情况测试',
              '提前准备回滚方案',
            ],
            predictedDelay: 2,
          }
        }
      });
      console.log('创建发布:', release3.name);

      // 添加需求到发布
      if (sprint2Requirements.length > 0) {
        await prisma.releaseItem.createMany({
          data: sprint2Requirements.map(req => ({
            releaseId: release3.id,
            workItemId: req.id,
          }))
        });
        console.log(`添加 ${sprint2Requirements.length} 个需求到发布`);
      }

      // 发布日志
      await prisma.releaseLog.createMany({
        data: [
          {
            releaseId: release3.id,
            action: 'CREATED',
            description: '创建发布「v2.0.0 标签管理与推荐算法」',
            createdById: admin.id,
            createdAt: new Date('2026-02-20'),
          },
          {
            releaseId: release3.id,
            action: 'ITEMS_ADDED',
            description: `添加 ${sprint2Requirements.length} 个需求到发布`,
            snapshot: {
              requirements: sprint2Requirements.map(r => ({ id: r.id, title: r.title }))
            },
            createdById: admin.id,
            createdAt: new Date('2026-02-20'),
          },
          {
            releaseId: release3.id,
            action: 'RISK_UPDATED',
            description: '更新风险评估，AI分析风险评分 45 分',
            createdById: admin.id,
            createdAt: new Date('2026-02-25'),
          },
          {
            releaseId: release3.id,
            action: 'CONFIRMED',
            description: '确认发布，计划发布日期 2026-03-15',
            snapshot: {
              confirmedAt: '2026-03-01',
              totalItems: sprint2Requirements.length,
            },
            createdById: admin.id,
            createdAt: new Date('2026-03-01'),
          },
          {
            releaseId: release3.id,
            action: 'STATUS_CHANGED',
            description: '状态变更: READY -> IN_PROGRESS，开始发布流程',
            createdById: admin.id,
            createdAt: new Date('2026-03-05'),
          },
        ]
      });
    }
  }

  // ==================== 其他项目的发布 ====================

  // 查找其他项目
  const otherProjects = projects.filter(p => !p.name.includes('推荐'));
  
  for (const project of otherProjects.slice(0, 2)) {
    console.log(`\n=== ${project.name} ===`);
    console.log('需求数:', project.workItems.length);

    // 创建一个规划中的发布
    const release = await prisma.release.create({
      data: {
        name: `${project.name} v1.0.0`,
        description: `${project.name}首个正式版本发布，包含核心功能模块。`,
        projectId: project.id,
        plannedDate: new Date('2026-04-01'),
        status: 'PLANNING',
        riskLevel: 'LOW',
        ownerId: admin.id,
        creatorId: admin.id,
      }
    });
    console.log('创建发布:', release.name);

    // 添加需求
    if (project.workItems.length > 0) {
      const reqsToAdd = project.workItems.slice(0, 3);
      await prisma.releaseItem.createMany({
        data: reqsToAdd.map(req => ({
          releaseId: release.id,
          workItemId: req.id,
        }))
      });
      console.log(`添加 ${reqsToAdd.length} 个需求`);
    }

    await prisma.releaseLog.create({
      data: {
        releaseId: release.id,
        action: 'CREATED',
        description: `创建发布「${release.name}」`,
        createdById: admin.id,
      }
    });
  }

  // ==================== 统计结果 ====================

  const releaseCount = await prisma.release.count();
  const releaseItemCount = await prisma.releaseItem.count();
  const releaseLogCount = await prisma.releaseLog.count();

  console.log('\n========== 种子数据创建完成 ==========');
  console.log(`发布数量: ${releaseCount}`);
  console.log(`发布项数量: ${releaseItemCount}`);
  console.log(`发布日志数量: ${releaseLogCount}`);

  // 列出所有发布
  const releases = await prisma.release.findMany({
    include: {
      project: { select: { name: true } },
      _count: { select: { items: true, logs: true } }
    },
    orderBy: { plannedDate: 'desc' }
  });

  console.log('\n发布列表:');
  releases.forEach(r => {
    console.log(`- [${r.status}] ${r.name}`);
    console.log(`  项目: ${r.project.name} | 需求: ${r._count.items} | 日志: ${r._count.logs}`);
    console.log(`  计划日期: ${r.plannedDate.toISOString().split('T')[0]}`);
  });
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
