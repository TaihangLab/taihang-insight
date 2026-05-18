/**
 * v-hasPerm / v-hasRole 指令
 *
 * 用法：
 *   <el-button v-hasPerm="'system:user:add'">新增</el-button>
 *   <el-button v-hasPerm="['system:user:add','system:user:edit']">新增/编辑</el-button>
 *   <el-button v-hasRole="'admin'">仅管理员</el-button>
 *
 * 超级管理员（permissions 含 *:*:* 或 roles 含 superadmin）总是放行。
 */
import store from '@/store'

const ALL_PERMISSIONS = '*:*:*'
const SUPER_ADMIN_ROLE = 'superadmin'

function hasPerm (value) {
  const permissions = (store.state.user && store.state.user.permissions) || []
  if (permissions.indexOf(ALL_PERMISSIONS) !== -1) return true
  if (Array.isArray(value)) {
    return value.some(p => permissions.indexOf(p) !== -1)
  }
  return permissions.indexOf(value) !== -1
}

function hasRole (value) {
  const roles = (store.state.user && store.state.user.roles) || []
  if (roles.indexOf(SUPER_ADMIN_ROLE) !== -1) return true
  if (Array.isArray(value)) {
    return value.some(r => roles.indexOf(r) !== -1)
  }
  return roles.indexOf(value) !== -1
}

export default {
  install (Vue) {
    Vue.directive('hasPerm', {
      inserted (el, binding) {
        if (!binding.value) return
        if (!hasPerm(binding.value)) {
          el.parentNode && el.parentNode.removeChild(el)
        }
      }
    })
    Vue.directive('hasRole', {
      inserted (el, binding) {
        if (!binding.value) return
        if (!hasRole(binding.value)) {
          el.parentNode && el.parentNode.removeChild(el)
        }
      }
    })
    Vue.prototype.$hasPerm = hasPerm
    Vue.prototype.$hasRole = hasRole
  }
}

export { hasPerm, hasRole }
