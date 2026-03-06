import { PrismaClient, ProductStatus, WorkItemType, Priority, Phase } from '@prisma/client'

// 数据中台产品数据
export async function seedDataPlatform(prisma: PrismaClient) {
  console.log('创建数据中台产品...')

  // 创建产品
  const product = await prisma.product.create({
    data: {
      id: 'product-data-platform',
      name: '数据中台',
      code: 'DATA',
      description: '企业级数据中台解决方案，提供数据采集、存储、加工、服务全链路能力，支撑业务数据化和数据业务化。涵盖数据源管理、元数据管理、数据建模、数据汇聚、数据开发、数据索引等核心功能模块。',
      status: ProductStatus.ACTIVE,
      ownerId: 'user-zhaoliu',
      creatorId: 'user-zhaoliu',
    },
  })

  // 创建一级模块
  const modules = {
    business: await prisma.module.create({
      data: {
        id: 'module-data-business',
        name: '业务管理',
        description: '管理接入数据中台的业务系统、机构和前置机',
        productId: product.id,
        order: 1,
      },
    }),
    dataManage: await prisma.module.create({
      data: {
        id: 'module-data-manage',
        name: '数据管理',
        description: '管理数据源连接和元数据信息',
        productId: product.id,
        order: 2,
      },
    }),
    modeling: await prisma.module.create({
      data: {
        id: 'module-data-modeling',
        name: '数据建模',
        description: '数仓分层设计和模型管理',
        productId: product.id,
        order: 3,
      },
    }),
    collection: await prisma.module.create({
      data: {
        id: 'module-data-collection',
        name: '数据汇聚',
        description: '数据采集任务管理和运维监控',
        productId: product.id,
        order: 4,
      },
    }),
    development: await prisma.module.create({
      data: {
        id: 'module-data-development',
        name: '数据开发',
        description: '离线数据开发和任务调度',
        productId: product.id,
        order: 5,
      },
    }),
    index: await prisma.module.create({
      data: {
        id: 'module-data-index',
        name: '数据索引',
        description: 'EMPI和EMOI主数据索引服务',
        productId: product.id,
        order: 6,
      },
    }),
  }

  // 创建二级模块
  const subModules = await Promise.all([
    // 业务管理子模块
    prisma.module.create({
      data: {
        id: 'module-data-org',
        name: '机构管理',
        description: '管理接入机构信息，支持多级机构树',
        productId: product.id,
        parentId: modules.business.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-system',
        name: '业务系统',
        description: '管理业务系统接入配置',
        productId: product.id,
        parentId: modules.business.id,
        order: 2,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-agent',
        name: '前置机管理',
        description: '管理数据采集前置机',
        productId: product.id,
        parentId: modules.business.id,
        order: 3,
      },
    }),
    // 数据管理子模块
    prisma.module.create({
      data: {
        id: 'module-data-source',
        name: '数据源',
        description: '管理各类数据库和文件数据源连接',
        productId: product.id,
        parentId: modules.dataManage.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-metadata',
        name: '元数据',
        description: '元数据采集和血缘分析',
        productId: product.id,
        parentId: modules.dataManage.id,
        order: 2,
      },
    }),
    // 数据建模子模块
    prisma.module.create({
      data: {
        id: 'module-data-warehouse',
        name: '数仓设计',
        description: '数仓分层架构设计(ODS/DWD/DWS/ADS)',
        productId: product.id,
        parentId: modules.modeling.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-model',
        name: '模型管理',
        description: '维度模型和事实表管理',
        productId: product.id,
        parentId: modules.modeling.id,
        order: 2,
      },
    }),
    // 数据汇聚子模块
    prisma.module.create({
      data: {
        id: 'module-data-task',
        name: '采集任务管理',
        description: '配置和管理数据采集任务',
        productId: product.id,
        parentId: modules.collection.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-ops',
        name: '任务运维',
        description: '采集任务监控和运维',
        productId: product.id,
        parentId: modules.collection.id,
        order: 2,
      },
    }),
    // 数据开发子模块
    prisma.module.create({
      data: {
        id: 'module-data-dev-task',
        name: '开发任务管理',
        description: '离线开发任务配置和调度',
        productId: product.id,
        parentId: modules.development.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-workbench',
        name: '离线开发工作台',
        description: '在线SQL开发和调试环境',
        productId: product.id,
        parentId: modules.development.id,
        order: 2,
      },
    }),
    // 数据索引子模块
    prisma.module.create({
      data: {
        id: 'module-data-empi',
        name: 'EMPI',
        description: '企业级患者主索引',
        productId: product.id,
        parentId: modules.index.id,
        order: 1,
      },
    }),
    prisma.module.create({
      data: {
        id: 'module-data-emoi',
        name: 'EMOI',
        description: '企业级医疗机构主索引',
        productId: product.id,
        parentId: modules.index.id,
        order: 2,
      },
    }),
  ])

  // 创建需求
  const requirements = await Promise.all([
    prisma.workItem.create({
      data: {
        id: 'req-data-001',
        title: '机构信息批量导入功能',
        description: '支持通过Excel模板批量导入机构信息，包含机构编码、名称、级别、上级机构等字段，导入时进行数据校验并反馈校验结果。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-data-org',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-002',
        title: '业务系统接入向导',
        description: '提供业务系统接入配置向导，分步骤引导用户完成系统基本信息、数据库连接、采集规则等配置，降低接入门槛。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-data-system',
        creatorId: 'user-zhaoliu',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-003',
        title: '前置机心跳监控',
        description: '实现前置机心跳检测机制，实时监控前置机在线状态，异常时发送告警通知，支持配置告警阈值和通知方式。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-data-agent',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-004',
        title: '数据源连接池管理',
        description: '实现数据源连接池统一管理，支持配置最大连接数、超时时间、空闲回收等参数，提供连接池监控面板。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-data-source',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-005',
        title: '元数据自动采集',
        description: '支持从数据源自动采集表结构、字段信息、索引、约束等元数据，定时增量同步变更。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-data-metadata',
        creatorId: 'user-zhaoliu',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-006',
        title: '数据血缘分析',
        description: '基于SQL解析实现数据血缘自动分析，支持表级和字段级血缘关系，提供可视化血缘图谱展示。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P3,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-data-metadata',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-007',
        title: '数仓分层可视化设计器',
        description: '提供数仓分层架构可视化设计工具，支持拖拽式设计ODS/DWD/DWS/ADS各层表结构和数据流向。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-data-warehouse',
        creatorId: 'user-zhaoliu',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-008',
        title: '维度模型设计器',
        description: '支持维度建模方法论，提供星型模型和雪花模型设计能力，自动生成建表DDL语句。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-data-model',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-009',
        title: '采集任务可视化配置',
        description: '提供采集任务可视化配置界面，支持配置源表、目标表、字段映射、过滤条件、增量策略等。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-data-task',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-010',
        title: '任务执行日志查询',
        description: '支持查询任务执行历史日志，包含执行时间、数据量、耗时、状态等信息，支持按时间范围和状态筛选。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.TESTING,
        devStatus: 'COMPLETED',
        testStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-data-ops',
        creatorId: 'user-chenqi',
        devOwnerId: 'user-lisi',
        testOwnerId: 'user-wangwu',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-011',
        title: 'SQL在线编辑器',
        description: '提供Web版SQL编辑器，支持语法高亮、智能提示、格式化、执行计划分析等功能。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-data-workbench',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-012',
        title: '任务依赖配置',
        description: '支持配置开发任务间的依赖关系，实现DAG调度，提供依赖关系可视化展示。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-data-dev-task',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-013',
        title: 'EMPI匹配规则配置',
        description: '支持配置患者主索引匹配规则，包括精确匹配和模糊匹配策略，支持自定义匹配权重。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-data-empi',
        creatorId: 'user-zhaoliu',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-data-014',
        title: 'EMOI机构匹配服务',
        description: '实现医疗机构主索引匹配服务API，支持根据机构编码、名称等进行匹配查询。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-data-emoi',
        creatorId: 'user-chenqi',
      },
    }),
  ])

  // 创建文档
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        id: 'doc-data-001',
        name: '数据中台需求规格说明书v1.0',
        fileName: '需求规格说明书v1.0.docx',
        filePath: '/uploads/data-platform/需求规格说明书v1.0.docx',
        fileType: 'docx',
        fileSize: 2048000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-002',
        name: '数据中台需求规格说明书v1.1',
        fileName: '需求规格说明书v1.1.docx',
        filePath: '/uploads/data-platform/需求规格说明书v1.1.docx',
        fileType: 'docx',
        fileSize: 2560000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-003',
        name: '数据中台需求规格说明书v2.0',
        fileName: '需求规格说明书v2.0.docx',
        filePath: '/uploads/data-platform/需求规格说明书v2.0.docx',
        fileType: 'docx',
        fileSize: 3072000,
        productId: product.id,
        uploaderId: 'user-chenqi',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-004',
        name: '数据中台原型设计v1.0',
        fileName: '原型设计v1.0.rp',
        filePath: '/uploads/data-platform/原型设计v1.0.rp',
        fileType: 'rp',
        fileSize: 15360000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-005',
        name: '数据中台原型设计v2.0',
        fileName: '原型设计v2.0.rp',
        filePath: '/uploads/data-platform/原型设计v2.0.rp',
        fileType: 'rp',
        fileSize: 18432000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-006',
        name: '数据中台接口设计文档v1.0',
        fileName: '接口设计文档v1.0.md',
        filePath: '/uploads/data-platform/接口设计文档v1.0.md',
        fileType: 'md',
        fileSize: 512000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-007',
        name: '数据中台接口设计文档v1.1',
        fileName: '接口设计文档v1.1.md',
        filePath: '/uploads/data-platform/接口设计文档v1.1.md',
        fileType: 'md',
        fileSize: 640000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-008',
        name: '数据中台数据库设计文档',
        fileName: '数据库设计文档.pdf',
        filePath: '/uploads/data-platform/数据库设计文档.pdf',
        fileType: 'pdf',
        fileSize: 1024000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-009',
        name: '数据中台部署手册',
        fileName: '部署手册.pdf',
        filePath: '/uploads/data-platform/部署手册.pdf',
        fileType: 'pdf',
        fileSize: 768000,
        productId: product.id,
        uploaderId: 'user-zhangsan',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-data-010',
        name: '数据中台用户操作手册',
        fileName: '用户操作手册.pdf',
        filePath: '/uploads/data-platform/用户操作手册.pdf',
        fileType: 'pdf',
        fileSize: 2048000,
        productId: product.id,
        uploaderId: 'user-zhaoliu',
      },
    }),
  ])

  console.log(`  已创建产品: ${product.name}`)
  console.log(`  已创建 ${Object.keys(modules).length + subModules.length} 个模块`)
  console.log(`  已创建 ${requirements.length} 个需求`)
  console.log(`  已创建 ${documents.length} 个文档`)

  return { product, modules, subModules, requirements, documents }
}
