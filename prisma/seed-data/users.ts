import { PrismaClient, SystemRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function seedUsers(prisma: PrismaClient) {
  console.log('创建用户...')
  
  const hashedPassword = await bcrypt.hash('123456', 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-zhangsan',
        email: 'zhangsan@example.com',
        name: '张三',
        password: hashedPassword,
        role: SystemRole.DEVELOPER,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-lisi',
        email: 'lisi@example.com',
        name: '李四',
        password: hashedPassword,
        role: SystemRole.DEVELOPER,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-wangwu',
        email: 'wangwu@example.com',
        name: '王五',
        password: hashedPassword,
        role: SystemRole.TESTER,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-zhaoliu',
        email: 'zhaoliu@example.com',
        name: '赵六',
        password: hashedPassword,
        role: SystemRole.PRODUCT,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-chenqi',
        email: 'chenqi@example.com',
        name: '陈七',
        password: hashedPassword,
        role: SystemRole.PRODUCT,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenqi',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-zhouba',
        email: 'zhouba@example.com',
        name: '周八',
        password: hashedPassword,
        role: SystemRole.DEVELOPER, // 架构师用开发人员角色
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouba',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-admin',
        email: 'admin@example.com',
        name: '管理员',
        password: hashedPassword,
        role: SystemRole.ADMIN,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      },
    }),
  ])

  console.log(`  已创建 ${users.length} 个用户`)
  return users
}
