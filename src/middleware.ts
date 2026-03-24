import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/login")

    // 如果已登录且访问登录页，重定向到首页
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // 如果未登录且访问受保护页面，重定向到登录页
    if (!isAuthPage && !isAuth) {
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", callbackUrl)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // 让 middleware 函数处理授权逻辑
    },
    pages: {
      signIn: "/login",
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
     * - 公共文件（图片等）
     * - api/auth (NextAuth API 路由)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif).*)",
  ],
}
