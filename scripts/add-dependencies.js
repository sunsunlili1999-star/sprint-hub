const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/sprint_hub?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 找到所有迭代
  const sprints = await prisma.sprint.findMany({
    select: { id: true, name: true }
  });
  console.log('所有迭代:', JSON.stringify(sprints, null, 2));

  // 找到迭代2
  const sprint2 = sprints.find(s => s.name.includes('2'));
  if (!sprint2) {
    console.log('未找到迭代2');
    return;
  }
  console.log('\n选中迭代:', sprint2.name, sprint2.id);

  // 获取迭代中的工作项
  const items = await prisma.workItem.findMany({
    where: { sprintId: sprint2.id },
    select: { 
      id: true, 
      title: true, 
      type: true, 
      devStatus: true,
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('\n工作项列表 (共' + items.length + '个):');
  items.forEach((item, i) => {
    console.log(`${i}: [${item.type}] ${item.title.substring(0, 50)} | id: ${item.id}`);
  });

  // 找到联调接口相关的工作项和接口开发相关的工作项
  const debugItems = items.filter(item => item.title.includes('联调'));
  const apiDevItems = items.filter(item => item.title.includes('接口开发') || item.title.includes('API开发'));
  
  console.log('\n联调工作项:', debugItems.map(i => i.title));
  console.log('接口开发工作项:', apiDevItems.map(i => i.title));

  // 获取一个用户ID来创建依赖
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('未找到用户');
    return;
  }

  // 创建依赖关系：联调 -> 接口开发
  // 规则：联调接口的工作项 依赖于 接口开发的工作项
  let created = 0;
  for (const debugItem of debugItems) {
    for (const apiItem of apiDevItems) {
      // 检查是否已存在依赖
      const existing = await prisma.workItemDependency.findUnique({
        where: {
          workItemId_dependsOnId: {
            workItemId: debugItem.id,
            dependsOnId: apiItem.id
          }
        }
      });
      
      if (!existing) {
        await prisma.workItemDependency.create({
          data: {
            workItemId: debugItem.id,    // 联调工作项
            dependsOnId: apiItem.id,      // 依赖接口开发
            dependencyType: 'FF',
            createdById: user.id
          }
        });
        console.log(`创建依赖: "${debugItem.title}" -> "${apiItem.title}"`);
        created++;
      }
    }
  }

  console.log(`\n共创建 ${created} 个依赖关系`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
