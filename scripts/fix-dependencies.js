const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/sprint_hub?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 删除所有不匹配的依赖
  // 正确的依赖应该是：
  // - 主体分类接口联调 -> 主体分类接口开发
  // - 查询列表接口联调 -> 查询列表接口开发
  // - 标签映射配置接口联调 -> 标签映射配置接口开发
  
  const correctPairs = [
    { debug: 'workitem-tag-category-debug', api: 'workitem-tag-category-api' },
    { debug: 'workitem-tag-query-debug', api: 'workitem-tag-query-api' },
    { debug: 'workitem-tag-mapping-debug', api: 'workitem-tag-mapping-api' },
  ];

  // 删除不正确的依赖
  const allDeps = await prisma.workItemDependency.findMany();
  console.log('当前依赖数量:', allDeps.length);
  
  for (const dep of allDeps) {
    const isCorrect = correctPairs.some(p => 
      p.debug === dep.workItemId && p.api === dep.dependsOnId
    );
    if (!isCorrect) {
      await prisma.workItemDependency.delete({
        where: { id: dep.id }
      });
      console.log('删除不正确的依赖:', dep.workItemId, '->', dep.dependsOnId);
    }
  }

  // 再添加一些更有意义的依赖
  // 页面开发 -> 接口开发（页面需要接口支持）
  const pageToApiDeps = [
    { page: 'workitem-tag-category-page', api: 'workitem-tag-category-api' },
    { page: 'workitem-tag-query-page', api: 'workitem-tag-query-api' },
    { page: 'workitem-tag-mapping-page', api: 'workitem-tag-mapping-api' },
  ];

  const user = await prisma.user.findFirst();
  
  for (const pair of pageToApiDeps) {
    try {
      await prisma.workItemDependency.create({
        data: {
          workItemId: pair.page,
          dependsOnId: pair.api,
          dependencyType: 'FF',
          createdById: user.id
        }
      });
      console.log('创建依赖: 页面', pair.page, '-> 接口', pair.api);
    } catch (e) {
      if (e.code === 'P2002') {
        console.log('依赖已存在:', pair.page, '->', pair.api);
      } else {
        throw e;
      }
    }
  }

  // 联调 -> 页面开发（联调需要页面完成）
  const debugToPageDeps = [
    { debug: 'workitem-tag-category-debug', page: 'workitem-tag-category-page' },
    { debug: 'workitem-tag-query-debug', page: 'workitem-tag-query-page' },
    { debug: 'workitem-tag-mapping-debug', page: 'workitem-tag-mapping-page' },
  ];

  for (const pair of debugToPageDeps) {
    try {
      await prisma.workItemDependency.create({
        data: {
          workItemId: pair.debug,
          dependsOnId: pair.page,
          dependencyType: 'FF',
          createdById: user.id
        }
      });
      console.log('创建依赖: 联调', pair.debug, '-> 页面', pair.page);
    } catch (e) {
      if (e.code === 'P2002') {
        console.log('依赖已存在:', pair.debug, '->', pair.page);
      } else {
        throw e;
      }
    }
  }

  // 最终验证
  const finalDeps = await prisma.workItemDependency.findMany({
    include: {
      workItem: { select: { title: true } },
      dependsOn: { select: { title: true } }
    }
  });
  
  console.log('\n最终依赖关系:');
  finalDeps.forEach(dep => {
    console.log(`  "${dep.workItem.title}" 依赖 "${dep.dependsOn.title}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
