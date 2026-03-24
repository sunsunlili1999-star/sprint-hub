import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// 扩展 NextAuth 类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      avatar: string | null
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    avatar: string | null
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    avatar: string | null
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("请输入邮箱和密码")
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            throw new Error("用户不存在")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error("密码错误")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.avatar = user.avatar
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        avatar: token.avatar,
        role: token.role,
      }
      return session
    },
  },
}

// 获取服务端 Session
export async function getSession() {
  return await getServerSession(authOptions)
}

// 获取当前登录用户 ID（用于 API）
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id || null
}

// 获取当前登录用户（用于 API）
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

// 确保用户已登录（用于 API，未登录时抛出错误）
export async function requireAuth(): Promise<{ id: string; email: string; name: string; avatar: string | null; role: string }> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未登录")
  }
  return user
}
