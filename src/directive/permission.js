/**
 * v-hasRole 指令（权限粒度仅到菜单级，不再使用按钮级 v-hasPerm）
 */
import store from '@/store'

function hasRole (value) {
  const roles = (store.state.user && store.state.user.roles) || []
  if (Array.isArray(value)) {
    return value.some(r => roles.indexOf(r) !== -1)
  }
  return roles.indexOf(value) !== -1
}

export default {
  install (Vue) {
    Vue.directive('hasRole', {
      inserted (el, binding) {
        if (!binding.value) return
        if (!hasRole(binding.value)) {
          el.parentNode && el.parentNode.removeChild(el)
        }
      }
    })
    Vue.prototype.$hasRole = hasRole
  }
}

export { hasRole }
