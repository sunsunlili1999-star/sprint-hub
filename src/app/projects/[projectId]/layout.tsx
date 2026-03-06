import { ProjectLayoutClient } from "./components/ProjectLayoutClient"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectDetailLayout({ children, params }: LayoutProps) {
  const { projectId } = await params
  
  return (
    <ProjectLayoutClient projectId={projectId}>
      {children}
    </ProjectLayoutClient>
  )
}
