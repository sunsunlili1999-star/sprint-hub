import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { seedUsers } from './seed-data/users'
import { seedDataPlatform } from './seed-data/product-data-platform'
import { seedKnowledgePlatform } from './seed-data/product-knowledge-platform'
import { seedTagPlatform } from './seed-data/product-tag-platform'
import { seedXiaokangApp } from './seed-data/product-xiaokang-app'
import { seedRecommendSystemProject } from './seed-data/project-recommend-system'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter }) as any

async function clearDatabase() {
  console.log('清空旧数据...')
  
  // 按照外键依赖顺序删除
  await prisma.pokeRecord.deleteMany()
  await prisma.workItemDependency.deleteMany()
  await prisma.progressLog.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.message.deleteMany()
  await prisma.releaseItem.deleteMany()
  await prisma.release.deleteMany()
  await prisma.workItem.deleteMany()
  await prisma.module.deleteMany()
  await prisma.document.deleteMany()
  await prisma.sprint.deleteMany()
  await prisma.statusConfig.deleteMany()
  await prisma.phaseConfig.deleteMany()
  await prisma.projectProduct.deleteMany()  // 项目-产品关联表
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.productMember.deleteMany()
  await prisma.productVersion.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('  已清空旧数据')
}

async function main() {
  console.log('=========================================')
  console.log('  SprintHub 数据库种子数据填充')
  console.log('=========================================')
  console.log('')

  // 清空旧数据
  await clearDatabase()
  console.log('')

  // 创建用户
  await seedUsers(prisma)
  console.log('')

  // 创建产品数据
  await seedDataPlatform(prisma)
  console.log('')

  await seedKnowledgePlatform(prisma)
  console.log('')

  await seedTagPlatform(prisma)
  console.log('')

  await seedXiaokangApp(prisma)
  console.log('')

  // 创建项目（需要在产品之后，因为要关联产品）
  await seedRecommendSystemProject(prisma)
  console.log('')

  console.log('=========================================')
  console.log('✅ 数据填充完成！')
  console.log('=========================================')
  console.log('')
  console.log('测试账号：')
  console.log('  邮箱: zhangsan@example.com  密码: 123456  (开发)')
  console.log('  邮箱: lisi@example.com      密码: 123456  (开发)')
  console.log('  邮箱: wangwu@example.com    密码: 123456  (测试)')
  console.log('  邮箱: zhaoliu@example.com   密码: 123456  (产品)')
  console.log('  邮箱: chenqi@example.com    密码: 123456  (产品)')
  console.log('  邮箱: zhouba@example.com    密码: 123456  (架构师)')
  console.log('  邮箱: admin@example.com     密码: 123456  (管理员)')
  console.log('')
  console.log('产品数据：')
  console.log('  - 数据中台 (DATA): 14个需求, 19个模块, 10个文档')
  console.log('  - 知识平台 (KNOWLEDGE): 9个需求, 4个模块, 7个文档')
  console.log('  - 标签平台 (TAG): 10个需求, 4个模块, 9个文档')
  console.log('  - 小康App (XIAOKANG): 2个需求, 2个模块, 2个文档')
  console.log('')
  console.log('项目数据：')
  console.log('  - 推荐系统 (RECOMMEND): 关联小康App和知识平台, 6个需求, 3个迭代')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
