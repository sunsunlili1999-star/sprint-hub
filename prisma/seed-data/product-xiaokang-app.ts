import { PrismaClient, ProductStatus, WorkItemType, Priority, Phase } from '@prisma/client'

// 小康App产品数据
export async function seedXiaokangApp(prisma: PrismaClient) {
  console.log('创建小康App产品...')

  // 创建产品
  const product = await prisma.product.create({
    data: {
      id: 'product-xiaokang-app',
      name: '小康App',
      code: 'XIAOKANG',
      description: '小康是一款AI医疗健康应用，通过人工智能技术为用户提供智能问诊、健康管理、用药指导等服务，致力于让优质医疗资源触手可及。',
      status: ProductStatus.ACTIVE,
      ownerId: 'user-zhaoliu',
      creatorId: 'user-zhaoliu',
    },
  })

  // 创建模块：iOS和安卓
  const modules = {
    ios: await prisma.module.create({
      data: {
        id: 'module-xiaokang-ios',
        name: 'iOS端',
        description: '小康App iOS客户端，支持iPhone和iPad设备',
        productId: product.id,
        order: 1,
      },
    }),
    android: await prisma.module.create({
      data: {
        id: 'module-xiaokang-android',
        name: '安卓端',
        description: '小康App Android客户端，支持各类安卓设备',
        productId: product.id,
        order: 2,
      },
    }),
  }

  // 创建需求：iOS和安卓埋点
  const requirements = await Promise.all([
    prisma.workItem.create({
      data: {
        id: 'req-xiaokang-001',
        title: 'iOS端用户行为埋点',
        description: `实现iOS端用户行为数据埋点功能，包括：
1. 页面浏览埋点：记录用户访问的页面、停留时长、页面来源
2. 点击事件埋点：记录按钮点击、功能使用情况
3. 业务埋点：问诊流程、健康检测、用药记录等关键业务节点
4. 性能埋点：页面加载时间、接口响应时间、崩溃率等
5. 支持埋点数据本地缓存和批量上报
6. 遵循苹果隐私政策，支持用户授权管理`,
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: modules.ios.id,
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
        estimatedHours: 40,
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-xiaokang-002',
        title: '安卓端用户行为埋点',
        description: `实现安卓端用户行为数据埋点功能，包括：
1. 页面浏览埋点：记录用户访问的页面、停留时长、页面来源
2. 点击事件埋点：记录按钮点击、功能使用情况
3. 业务埋点：问诊流程、健康检测、用药记录等关键业务节点
4. 性能埋点：页面加载时间、接口响应时间、崩溃率、ANR等
5. 支持埋点数据本地缓存和批量上报
6. 适配各安卓版本和机型，做好兼容性处理`,
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: modules.android.id,
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-lisi',
        estimatedHours: 40,
      },
    }),
  ])

  // 创建文档
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        id: 'doc-xiaokang-001',
        name: '小康App产品介绍',
        fileName: '小康App产品介绍.pdf',
        filePath: '/uploads/xiaokang-app/小康App产品介绍.pdf',
        fileType: 'pdf',
        fileSize: 1024000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-xiaokang-002',
        name: '埋点设计文档',
        fileName: '埋点设计文档.docx',
        filePath: '/uploads/xiaokang-app/埋点设计文档.docx',
        fileType: 'docx',
        fileSize: 512000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
  ])

  console.log(`  已创建产品: ${product.name}`)
  console.log(`  已创建 ${Object.keys(modules).length} 个模块`)
  console.log(`  已创建 ${requirements.length} 个需求`)
  console.log(`  已创建 ${documents.length} 个文档`)

  return product
}
