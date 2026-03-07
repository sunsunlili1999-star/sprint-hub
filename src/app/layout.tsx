import type { Metadata } from "next";
import "@ant-design/v5-patch-for-react-19";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "./globals.css";
import { MainLayout } from "@/components/layout/main-layout";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AppLoadingProvider } from "@/components/providers/AppLoadingProvider";

export const metadata: Metadata = {
  title: "Projex - AI 驱动的智能项目管理平台",
  description: "Projex 是一款 AI 驱动的智能项目管理平台，内置 AI 助手小派，支持需求智能解析、迭代自动规划、风险实时预警、进度智能追踪",
  keywords: ["项目管理", "AI项目经理", "迭代管理", "敏捷开发", "智能规划", "风险分析"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
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
              <AppLoadingProvider>
                <MainLayout>{children}</MainLayout>
              </AppLoadingProvider>
            </ConfigProvider>
          </SessionProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
