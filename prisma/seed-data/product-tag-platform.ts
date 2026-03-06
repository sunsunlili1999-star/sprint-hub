import { PrismaClient, ProductStatus, WorkItemType, Priority, Phase } from '@prisma/client'

// 标签平台产品数据
export async function seedTagPlatform(prisma: PrismaClient) {
  console.log('创建标签平台产品...')

  // 创建产品
  const product = await prisma.product.create({
    data: {
      id: 'product-tag-platform',
      name: '标签平台',
      code: 'TAG',
      description: '企业级标签管理平台，支持标签的创建、维护、计算和应用全生命周期管理。提供灵活的标签体系构建能力，支撑用户画像、精准营销、风险控制等业务场景。',
      status: ProductStatus.ACTIVE,
      ownerId: 'user-zhaoliu',
      creatorId: 'user-zhaoliu',
    },
  })

  // 创建一级模块
  const modules = {
    tagManagement: await prisma.module.create({
      data: {
        id: 'module-tag-management',
        name: '标签管理',
        description: '标签的创建、编辑、发布、下线全生命周期管理',
        productId: product.id,
        order: 1,
      },
    }),
    metadataManagement: await prisma.module.create({
      data: {
        id: 'module-tag-metadata',
        name: '元数据管理',
        description: '标签计算所依赖的主体和数据源管理',
        productId: product.id,
        order: 2,
      },
    }),
  }

  // 创建二级模块
  const subModules = await Promise.all([
    prisma.module.create({
      data: {
        id: 'module-tag-list',
        name: '标签列表',
        description: '标签列表展示和管理，支持按分类、状态筛选',
        productId: product.id,
        parentId: modules.tagManagement.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-tag-subject',
        name: '主体管理',
        description: '标签主体（如用户、设备、订单等）的定义和管理',
        productId: product.id,
        parentId: modules.metadataManagement.id,
        order: 1,
      },
    }),
  ])

  // 创建需求
  const requirements = await Promise.all([
    prisma.workItem.create({
      data: {
        id: 'req-tag-001',
        title: '标签分类体系管理',
        description: '支持多级标签分类体系的创建和管理，分类可包含名称、编码、描述、排序等属性，支持分类的新增、编辑、删除、排序操作。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-tag-list',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-002',
        title: '标签创建向导',
        description: '提供标签创建向导，分步骤引导用户完成标签基本信息、计算逻辑、更新策略等配置，降低标签创建门槛。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-tag-list',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-003',
        title: 'SQL标签计算配置',
        description: '支持通过SQL定义标签计算逻辑，提供SQL编辑器、语法校验、字段映射等功能。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-tag-list',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-004',
        title: '标签版本管理',
        description: '支持标签的版本管理，记录标签定义的历史变更，支持版本回滚。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-tag-list',
        creatorId: 'user-zhaoliu',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-005',
        title: '标签发布审批流程',
        description: '标签发布前需经过审批流程，支持配置审批人和审批规则，记录审批历史。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-tag-list',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-006',
        title: '标签质量监控',
        description: '监控标签计算质量，包括覆盖率、空值率、异常值检测等指标，异常时发送告警。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P3,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-tag-list',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-007',
        title: '主体定义管理',
        description: '支持定义标签主体类型（如用户、患者、机构等），配置主体的唯一标识字段和属性字段。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-tag-subject',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-008',
        title: '主体数据源绑定',
        description: '支持将数据源表与主体进行绑定，配置主体ID字段映射关系。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-tag-subject',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-009',
        title: '主体画像查询',
        description: '提供主体画像查询功能，输入主体ID可查询该主体的所有标签值。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-tag-subject',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-tag-010',
        title: '标签人群圈选',
        description: '基于标签条件组合圈选目标人群，支持标签间的与或非逻辑组合，输出人群包。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-tag-subject',
        creatorId: 'user-zhaoliu',
      },
    }),
  ])

  // 创建文档
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        id: 'doc-tag-001',
        name: '标签平台需求规格说明书v1.0',
        fileName: '需求规格说明书v1.0.docx',
        filePath: '/uploads/tag-platform/需求规格说明书v1.0.docx',
        fileType: 'docx',
        fileSize: 1280000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-002',
        name: '标签平台需求规格说明书v1.1',
        fileName: '需求规格说明书v1.1.docx',
        filePath: '/uploads/tag-platform/需求规格说明书v1.1.docx',
        fileType: 'docx',
        fileSize: 1536000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-003',
        name: '标签平台需求规格说明书v2.0',
        fileName: '需求规格说明书v2.0.docx',
        filePath: '/uploads/tag-platform/需求规格说明书v2.0.docx',
        fileType: 'docx',
        fileSize: 2048000,
        productId: product.id,
        uploaderId: 'user-chenqi',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-004',
        name: '标签平台原型设计v1.0',
        fileName: '原型设计v1.0.rp',
        filePath: '/uploads/tag-platform/原型设计v1.0.rp',
        fileType: 'rp',
        fileSize: 10240000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-005',
        name: '标签平台原型设计v2.0',
        fileName: '原型设计v2.0.rp',
        filePath: '/uploads/tag-platform/原型设计v2.0.rp',
        fileType: 'rp',
        fileSize: 12800000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-006',
        name: '标签平台接口设计文档v1.0',
        fileName: '接口设计文档v1.0.md',
        filePath: '/uploads/tag-platform/接口设计文档v1.0.md',
        fileType: 'md',
        fileSize: 320000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-007',
        name: '标签平台接口设计文档v1.1',
        fileName: '接口设计文档v1.1.md',
        filePath: '/uploads/tag-platform/接口设计文档v1.1.md',
        fileType: 'md',
        fileSize: 384000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-008',
        name: '标签计算引擎技术方案',
        fileName: '标签计算引擎技术方案.pdf',
        filePath: '/uploads/tag-platform/标签计算引擎技术方案.pdf',
        fileType: 'pdf',
        fileSize: 768000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-tag-009',
        name: '标签平台数据库设计文档',
        fileName: '数据库设计文档.pdf',
        filePath: '/uploads/tag-platform/数据库设计文档.pdf',
        fileType: 'pdf',
        fileSize: 640000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
  ])

  console.log(`  已创建产品: ${product.name}`)
  console.log(`  已创建 ${Object.keys(modules).length + subModules.length} 个模块`)
  console.log(`  已创建 ${requirements.length} 个需求`)
  console.log(`  已创建 ${documents.length} 个文档`)

  return { product, modules, subModules, requirements, documents }
}
