import { PrismaClient, ProductStatus, WorkItemType, Priority, Phase } from '@prisma/client'

// 知识平台产品数据
export async function seedKnowledgePlatform(prisma: PrismaClient) {
  console.log('创建知识平台产品...')

  // 创建产品
  const product = await prisma.product.create({
    data: {
      id: 'product-knowledge-platform',
      name: '知识平台',
      code: 'KNOWLEDGE',
      description: '医疗健康领域知识管理平台，整合医学知识图谱、临床指南文献、厂商知识库等多源知识，提供知识检索、推理、应用等服务，支撑临床决策支持和智能问答场景。',
      status: ProductStatus.ACTIVE,
      ownerId: 'user-chenqi',
      creatorId: 'user-chenqi',
    },
  })

  // 创建一级模块
  const modules = {
    medicalKnowledge: await prisma.module.create({
      data: {
        id: 'module-knowledge-medical',
        name: '医学知识库',
        description: '医学专业知识库，包含疾病、症状、药品、检验检查等知识',
        productId: product.id,
        order: 1,
      },
    }),
    guideline: await prisma.module.create({
      data: {
        id: 'module-knowledge-guideline',
        name: '指南文献管理',
        description: '临床指南和医学文献管理',
        productId: product.id,
        order: 2,
      },
    }),
    vendorKnowledge: await prisma.module.create({
      data: {
        id: 'module-knowledge-vendor',
        name: '厂商知识库',
        description: '厂商提供的标准化知识内容',
        productId: product.id,
        order: 3,
      },
    }),
  }

  // 创建二级模块
  const subModules = await Promise.all([
    prisma.module.create({
      data: {
        id: 'module-knowledge-graph',
        name: '知识图谱',
        description: '医学知识图谱构建和管理，包含实体、关系、属性',
        productId: product.id,
        parentId: modules.medicalKnowledge.id,
        order: 1,
      },
    }),
  ])

  // 创建需求
  const requirements = await Promise.all([
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-001',
        title: '知识图谱可视化展示',
        description: '支持知识图谱的可视化展示，包括实体节点、关系边的图形化呈现，支持缩放、拖拽、搜索定位等交互操作。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-knowledge-graph',
        creatorId: 'user-chenqi',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-002',
        title: '实体关系编辑器',
        description: '提供知识图谱实体和关系的在线编辑功能，支持新增、修改、删除实体和关系，支持批量操作。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-knowledge-graph',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-003',
        title: '知识推理引擎',
        description: '基于知识图谱实现知识推理能力，支持基于规则的推理和基于图算法的路径推理。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-knowledge-graph',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-004',
        title: '指南文献导入',
        description: '支持PDF、Word格式的临床指南文献导入，自动提取文档结构和关键内容。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-knowledge-guideline',
        creatorId: 'user-chenqi',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-005',
        title: '指南版本管理',
        description: '支持同一指南的多版本管理，可追溯历史版本，对比不同版本间的差异。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-knowledge-guideline',
        creatorId: 'user-chenqi',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-006',
        title: '文献全文检索',
        description: '实现指南文献的全文检索功能，支持关键词搜索、高级检索、检索结果高亮显示。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.COMPLETED,
        devStatus: 'COMPLETED',
        testStatus: 'COMPLETED',
        productId: product.id,
        moduleId: 'module-knowledge-guideline',
        creatorId: 'user-chenqi',
        devOwnerId: 'user-lisi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-007',
        title: '厂商知识接入适配',
        description: '开发厂商知识库接入适配层，支持对接多家知识库厂商的数据格式和接口规范。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P1,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'IN_PROGRESS',
        productId: product.id,
        moduleId: 'module-knowledge-vendor',
        creatorId: 'user-chenqi',
        devOwnerId: 'user-zhangsan',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-008',
        title: '知识内容同步机制',
        description: '实现厂商知识库内容的定时同步机制，支持增量更新和全量更新。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P2,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-knowledge-vendor',
        creatorId: 'user-chenqi',
      },
    }),
    prisma.workItem.create({
      data: {
        id: 'req-knowledge-009',
        title: '知识质量评估',
        description: '建立厂商知识内容质量评估体系，对接入的知识进行准确性、完整性、时效性评分。',
        type: WorkItemType.REQUIREMENT,
        priority: Priority.P3,
        currentPhase: Phase.DEVELOPMENT,
        devStatus: 'NOT_STARTED',
        productId: product.id,
        moduleId: 'module-knowledge-vendor',
        creatorId: 'user-zhaoliu',
      },
    }),
  ])

  // 创建文档
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        id: 'doc-knowledge-001',
        name: '知识平台需求规格说明书v1.0',
        fileName: '需求规格说明书v1.0.docx',
        filePath: '/uploads/knowledge-platform/需求规格说明书v1.0.docx',
        fileType: 'docx',
        fileSize: 1536000,
        productId: product.id,
        uploaderId: 'user-chenqi',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-knowledge-002',
        name: '知识平台需求规格说明书v1.1',
        fileName: '需求规格说明书v1.1.docx',
        filePath: '/uploads/knowledge-platform/需求规格说明书v1.1.docx',
        fileType: 'docx',
        fileSize: 1792000,
        productId: product.id,
        uploaderId: 'user-chenqi',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-knowledge-003',
        name: '知识平台原型设计v1.0',
        fileName: '原型设计v1.0.rp',
        filePath: '/uploads/knowledge-platform/原型设计v1.0.rp',
        fileType: 'rp',
        fileSize: 12288000,
        productId: product.id,
        uploaderId: 'user-chenqi',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-knowledge-004',
        name: '知识平台原型设计v1.1',
        fileName: '原型设计v1.1.rp',
        filePath: '/uploads/knowledge-platform/原型设计v1.1.rp',
        fileType: 'rp',
        fileSize: 14336000,
        productId: product.id,
        uploaderId: 'user-chenqi',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-knowledge-005',
        name: '知识平台接口设计文档v1.0',
        fileName: '接口设计文档v1.0.md',
        filePath: '/uploads/knowledge-platform/接口设计文档v1.0.md',
        fileType: 'md',
        fileSize: 384000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-knowledge-006',
        name: '知识图谱数据模型设计',
        fileName: '知识图谱数据模型设计.pdf',
        filePath: '/uploads/knowledge-platform/知识图谱数据模型设计.pdf',
        fileType: 'pdf',
        fileSize: 896000,
        productId: product.id,
        uploaderId: 'user-zhouba',
      },
    }),
    prisma.document.create({
      data: {
        id: 'doc-knowledge-007',
        name: '厂商对接规范文档',
        fileName: '厂商对接规范文档.pdf',
        filePath: '/uploads/knowledge-platform/厂商对接规范文档.pdf',
        fileType: 'pdf',
        fileSize: 512000,
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
