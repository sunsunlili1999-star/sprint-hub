import type { Metadata } from "next";
import "@ant-design/v5-patch-for-react-19";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "SprintHub - 项目迭代管理系统",
  description: "AI赋能的项目迭代管理平台，支持多项目管理、迭代规划、工作项跟踪、依赖管理",
  keywords: ["项目管理", "迭代管理", "敏捷开发", "Scrum", "看板"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <AntdRegistry>
          <SessionProvider>
            <ConfigProvider
              locale={zhCN}
              theme={{
                token: {
                  colorPrimary: "#7c7cff",
                  colorLink: "#7c7cff",
                  colorLinkHover: "#9999ff",
                  colorText: "#475569",
                  colorTextSecondary: "#64748b",
                  borderRadius: 6,
                },
                components: {
                  Button: {
                    colorPrimary: "#7c7cff",
                    colorPrimaryHover: "#9999ff",
                    colorPrimaryActive: "#6366f1",
                  },
                  Menu: {
                    itemSelectedBg: "rgba(124, 124, 255, 0.1)",
                    itemSelectedColor: "#7c7cff",
                    // dark 模式菜单样式
                    darkItemBg: "#242c40",
                    darkSubMenuItemBg: "#242c40",
                    darkItemSelectedBg: "rgba(124, 124, 255, 0.3)",
                    darkItemSelectedColor: "#ffffff",
                    darkItemHoverBg: "rgba(255, 255, 255, 0.08)",
                  },
                  Table: {
                    colorBgContainer: "#ffffff",
                  },
                },
              }}
            >
              <MainLayout>{children}</MainLayout>
            </ConfigProvider>
          </SessionProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
