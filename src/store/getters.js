const getters = {
  token: state => state.user.token,
  userInfo: state => state.user.userInfo,
  username: state => (state.user.userInfo && state.user.userInfo.userName) || '',
  nickname: state => (state.user.userInfo && state.user.userInfo.nickName) || '',
  avatar: state => (state.user.userInfo && state.user.userInfo.avatar) || '',
  roles: state => state.user.roles,
  permissions: state => state.user.permissions,
  tenantId: state => state.user.tenantId,
  dynamicTenantId: state => state.user.dynamicTenantId,
  isSuperAdmin: state => Array.isArray(state.user.roles) && state.user.roles.indexOf('superadmin') >= 0,
  sidebarMenus: state => state.permission.sidebarMenus,
  addRoutes: state => state.permission.addRoutes,
  routes: state => state.permission.routes
}

export default getters
