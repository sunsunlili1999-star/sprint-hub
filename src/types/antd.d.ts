// Type augmentation to fix React 19 + antd compatibility
import "antd"

declare module "antd" {
  export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean
    styles?: {
      body?: React.CSSProperties
      header?: React.CSSProperties
    }
  }
}
