"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Skeleton,
  Table,
  Avatar,
  message,
  Upload,
  Modal,
} from "antd"
import type { TableProps, UploadProps } from "antd"
import {
  PlusOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined,
} from "@ant-design/icons"
import { projectApi, type ProjectDetail } from "@/lib/api"

const { Text, Title } = Typography
const { Dragger } = Upload

// 文件图标映射
const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
  if (fileType.includes("word") || fileType.includes("document")) return <FileWordOutlined style={{ color: "#1890ff", fontSize: 20 }} />
  if (fileType.includes("excel") || fileType.includes("sheet")) return <FileExcelOutlined style={{ color: "#52c41a", fontSize: 20 }} />
  if (fileType.includes("image")) return <FileImageOutlined style={{ color: "#722ed1", fontSize: 20 }} />
  return <FileOutlined style={{ color: "#8c8c8c", fontSize: 20 }} />
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface ProjectDocument {
  id: string
  name: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedBy: { id: string; name: string; avatar: string | null }
  uploadedAt: string
}

export default function ProjectDocumentsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadProject = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectApi.getDetail(projectId)
      setProject(data)
      // TODO: 加载项目文档
      setDocuments([])
    } catch (error) {
      console.error("加载项目失败", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  // 删除文档
  const handleDelete = (doc: ProjectDocument) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除文档「${doc.name || doc.fileName}」吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          // TODO: 调用删除文档 API
          message.success("删除成功")
          loadProject()
        } catch (error: any) {
          message.error(error.message || "删除失败")
        }
      },
    })
  }

  // 表格列
  const columns: TableProps<ProjectDocument>["columns"] = [
    {
      title: "文件名",
      dataIndex: "fileName",
      render: (_: unknown, record: ProjectDocument) => (
        <Space>
          {getFileIcon(record.fileType)}
          <div>
            <Text strong>{record.name || record.fileName}</Text>
            {record.name && record.name !== record.fileName && (
              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {record.fileName}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "文件大小",
      dataIndex: "fileSize",
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: "上传者",
      dataIndex: "uploadedBy",
      width: 120,
      render: (uploader: { name: string }) => (
        <Space>
          <Avatar size="small" style={{ background: "#a5b4fc" }}>
            {uploader?.name?.[0] || "?"}
          </Avatar>
          <Text>{uploader?.name}</Text>
        </Space>
      ),
    },
    {
      title: "上传时间",
      dataIndex: "uploadedAt",
      width: 150,
    },
    {
      title: "操作",
      width: 120,
      render: (_: unknown, record: ProjectDocument) => (
        <Space>
          <Button type="text" size="small" icon={<DownloadOutlined />} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ]

  // 上传配置
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    action: `/api/projects/${projectId}/documents/upload`,
    onChange(info) {
      const { status } = info.file
      if (status === "uploading") {
        setUploading(true)
      }
      if (status === "done") {
        message.success(`${info.file.name} 上传成功`)
        setUploading(false)
        loadProject()
      } else if (status === "error") {
        message.error(`${info.file.name} 上传失败`)
        setUploading(false)
      }
    },
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between" }}>
        <Title level={5} style={{ margin: 0 }}>
          <Space>
            <FileOutlined style={{ color: "#7c7cff" }} />
            项目文档
            <Tag color="blue">{documents.length}</Tag>
          </Space>
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsUploadOpen(true)}>
          上传文档
        </Button>
      </div>

      {/* 文档列表 */}
      {documents.length > 0 ? (
        <Card>
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无文档"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsUploadOpen(true)}>
              上传第一个文档
            </Button>
          </Empty>
        </Card>
      )}

      {/* 上传弹窗 */}
      <Modal
        title="上传文档"
        open={isUploadOpen}
        onCancel={() => setIsUploadOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsUploadOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: "#7c7cff", fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个或批量上传，支持 PDF、Word、Excel、图片等格式
            </p>
          </Dragger>
        </div>
      </Modal>
    </div>
  )
}
