const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/sprint_hub?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 找到迭代2
  const sprint2 = await prisma.sprint.findFirst({
    where: { name: { contains: '2' } }
  });
  
  if (!sprint2) {
    console.log('未找到迭代2');
    return;
  }
  
  console.log('迭代:', sprint2.name, sprint2.id);

  // 获取迭代中的工作项
  const items = await prisma.workItem.findMany({
    where: { sprintId: sprint2.id },
    select: { 
      id: true, 
      title: true, 
      type: true,
      parentId: true,
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('\n当前工作项:');
  items.forEach(item => {
    console.log(`[${item.type}] ${item.title} (parent: ${item.parentId || '无'})`);
  });

  // 需要改为工作项(BUG)的项目：接口开发、页面开发、接口联调
  // 这些应该是工作项，属于某个任务
  const workItemKeywords = ['接口开发', '页面开发', '接口联调'];
  
  const itemsToConvert = items.filter(item => 
    item.type === 'TASK' && 
    workItemKeywords.some(keyword => item.title.includes(keyword))
  );

  console.log('\n需要转换为工作项的任务:');
  itemsToConvert.forEach(item => {
    console.log(`- ${item.title}`);
  });

  // 找到父任务（实现xxx功能的任务）
  const parentTasks = items.filter(item => 
    item.type === 'TASK' && 
    item.title.includes('实现') && 
    item.title.includes('功能')
  );

  console.log('\n父任务:');
  parentTasks.forEach(task => {
    console.log(`- ${task.title} (${task.id})`);
  });

  // 建立映射关系
  // 主体分类相关 -> task-tag-category
  // 查询列表相关 -> task-tag-query-list  
  // 标签映射相关 -> task-tag-mapping
  const mappings = [
    { keyword: '主体分类', parentId: 'task-tag-category' },
    { keyword: '查询列表', parentId: 'task-tag-query-list' },
    { keyword: '标签映射', parentId: 'task-tag-mapping' },
  ];

  // 转换类型并设置父任务
  for (const item of itemsToConvert) {
    const mapping = mappings.find(m => item.title.includes(m.keyword));
    
    if (mapping) {
      await prisma.workItem.update({
        where: { id: item.id },
        data: {
          type: 'BUG',  // 工作项类型
          parentId: mapping.parentId,
        }
      });
      console.log(`\n更新: "${item.title}"`);
      console.log(`  类型: TASK -> BUG (工作项)`);
      console.log(`  父任务: ${mapping.parentId}`);
    }
  }

  // 验证结果
  const updatedItems = await prisma.workItem.findMany({
    where: { sprintId: sprint2.id },
    select: { 
      id: true, 
      title: true, 
      type: true,
      parentId: true,
    },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }]
  });
  
  console.log('\n\n===== 更新后的工作项 =====');
  updatedItems.forEach(item => {
    const indent = item.parentId ? '  └─ ' : '';
    console.log(`${indent}[${item.type}] ${item.title}`);
  });

  // 统计
  const requirements = updatedItems.filter(i => i.type === 'REQUIREMENT').length;
  const tasks = updatedItems.filter(i => i.type === 'TASK').length;
  const bugs = updatedItems.filter(i => i.type === 'BUG').length;
  console.log(`\n统计: 需求 ${requirements} | 任务 ${tasks} | 工作项 ${bugs}`);
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
