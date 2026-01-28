/**
 * UserService 类型声明
 */

export interface UserInfo {
  username?: string
  [key: string]: unknown
}

declare interface UserService {
  setUser(user: UserInfo | null): void
  getUser(): UserInfo
  clearUserInfo(): void
  getToken(): string | null
  getAdminToken(): string | null
  setToken(token: string): void
  clearToken(): void
}

declare const userService: UserService

export default userService

