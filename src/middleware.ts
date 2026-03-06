import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 登录页面不需要认证
        if (req.nextUrl.pathname.startsWith("/login")) {
          return true
        }
        // API 路由中的 auth 路由不需要认证
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true
        }
        // 其他页面需要登录
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (favicon)
     * - 公共文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
  ],
}
