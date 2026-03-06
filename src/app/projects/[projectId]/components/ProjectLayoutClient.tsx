"use client"

import { useEffect, useCallback, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { message } from "antd"
import { useBreadcrumb } from "@/components/layout/main-layout"
import { projectApi, type ProjectDetail } from "@/lib/api"

interface ProjectListItem {
  id: string
  name: string
  code: string
}

interface ProjectLayoutClientProps {
  projectId: string
  children: React.ReactNode
}

export function ProjectLayoutClient({ projectId, children }: ProjectLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setBreadcrumbs, setHeaderTabs, clearHeaderTabs } = useBreadcrumb()
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [allProjects, setAllProjects] = useState<ProjectListItem[]>([])

  // 从路径获取当前 Tab
  const getActiveTab = useCallback(() => {
    if (pathname.endsWith("/requirements")) return "requirements"
    if (pathname.endsWith("/sprints")) return "sprints"
    if (pathname.endsWith("/documents")) return "documents"
    return "overview"
  }, [pathname])

  // 加载所有项目列表
  const loadAllProjects = useCallback(async () => {
    try {
      const data = await projectApi.getList()
      setAllProjects(data.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })))
    } catch (error) {
      console.error("加载项目列表失败", error)
    }
  }, [])

  // 加载项目详情
  const loadProject = useCallback(async () => {
    try {
      const data = await projectApi.getDetail(projectId)
      setProject(data)
    } catch (error) {
      console.error("加载项目失败", error)
    }
  }, [projectId])

  // 设置面包屑
  useEffect(() => {
    if (project && allProjects.length > 0) {
      setBreadcrumbs([
        { title: "项目管理", href: "/projects" },
        {
          title: project.name,
          dropdown: {
            options: allProjects.map(p => ({ key: p.id, label: p.name })),
            currentKey: projectId,
            onSelect: (newProjectId: string) => {
              const currentTab = getActiveTab()
              if (currentTab === "overview") {
                router.push(`/projects/${newProjectId}`)
              } else {
                router.push(`/projects/${newProjectId}/${currentTab}`)
              }
            },
          },
          star: {
            starred: project.starred,
            onToggle: () => {
              if (project) {
                projectApi.toggleStar(projectId).then(result => {
                  setProject(prev => prev ? { ...prev, starred: result.starred } : null)
                  message.success(result.starred ? "已收藏" : "已取消收藏")
                }).catch(() => {
                  message.error("操作失败")
                })
              }
            },
          },
        },
      ])
    }
  }, [project, allProjects, projectId, setBreadcrumbs, router, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // 设置 Header Tabs
  useEffect(() => {
    const activeTab = getActiveTab()
    setHeaderTabs(
      [
        { key: "overview", label: "概览" },
        { key: "requirements", label: "需求" },
        { key: "sprints", label: "迭代" },
        { key: "documents", label: "文档" },
      ],
      activeTab,
      (key) => {
        if (key === "overview") {
          router.push(`/projects/${projectId}`)
        } else {
          router.push(`/projects/${projectId}/${key}`)
        }
      }
    )
    
    return () => {
      clearHeaderTabs()
    }
  }, [pathname, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAllProjects()
    loadProject()
  }, [loadAllProjects, loadProject])

  return <>{children}</>
}
