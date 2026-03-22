<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>卡密验证系统</h3>
      </div>
      <div class="sidebar-menu">
        <div v-for="item in menuItems" :key="item.path" 
             :class="['menu-item', { active: $route.path === item.path }]"
             @click="$router.push(item.path)">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="header">
        <span>{{ currentPageTitle }}</span>
        <div>
          <span style="margin-right: 15px;">{{ authStore.admin?.username }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </div>
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const menuItems = [
  { path: '/dashboard', title: '控制台', icon: 'DataAnalysis' },
  { path: '/software', title: '软件管理', icon: 'Monitor' },
  { path: '/packer', title: '软件一键加密', icon: 'Lock' },
  { path: '/cards', title: '卡密管理', icon: 'Ticket' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/logs', title: '日志管理', icon: 'Document' },
  { path: '/config', title: '系统配置', icon: 'Setting' }
]

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === router.currentRoute.value.path)
  return item?.title || ''
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
