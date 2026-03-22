<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo-area">
          <span class="logo-icon">🔐</span>
          <h3>ICY卡密验证系统</h3>
        </div>
      </div>
      <div class="sidebar-menu">
        <div v-for="item in menuItems" :key="item.path" 
             :class="['menu-item', { active: $route.path === item.path }]"
             @click="$router.push(item.path)">
          <span class="menu-icon">{{ item.emoji }}</span>
          <span class="menu-text">{{ item.title }}</span>
          <span v-if="$route.path === item.path" class="active-indicator"></span>
        </div>
      </div>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ authStore.admin?.username?.charAt(0)?.toUpperCase() || 'A' }}</div>
          <div class="user-details">
            <span class="user-name">{{ authStore.admin?.username }}</span>
            <span class="user-role">管理员</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <span class="page-title">{{ currentPageTitle }}</span>
          <span class="header-time">{{ currentTime }}</span>
        </div>
        <div class="header-right">
          <el-button type="danger" size="small" @click="handleLogout" class="logout-btn">
            <span>退出登录</span>
          </el-button>
        </div>
      </div>
      <div class="content-area">
        <router-view />
      </div>
      <div class="footer">
        <p>© 2026 ICY Card Verification System</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const currentTime = ref('')

const menuItems = [
  { path: '/dashboard', title: '控制台', emoji: '📊' },
  { path: '/software', title: '软件管理', emoji: '💻' },
  { path: '/cards', title: '卡密管理', emoji: '🎫' },
  { path: '/users', title: '用户管理', emoji: '👥' },
  { path: '/logs', title: '日志管理', emoji: '📋' },
  { path: '/config', title: '系统配置', emoji: '⚙️' }
]

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === router.currentRoute.value.path)
  return item?.title || ''
})

let timeInterval = null

function updateTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
  position: relative;
  overflow: hidden;
}

.layout-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.02) 0%, transparent 50%);
  pointer-events: none;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%);
  border-right: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.sidebar-header {
  padding: 20px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.sidebar-header h3 {
  color: #d4af37;
  font-size: 15px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
  letter-spacing: 1px;
  margin: 0;
}

.sidebar-menu {
  flex: 1;
  padding: 15px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: #888;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
  margin: 2px 0;
}

.menu-item:hover {
  color: #d4af37;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
  border-left-color: #d4af37;
}

.menu-item.active {
  color: #d4af37;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%);
  border-left-color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.active-indicator {
  position: absolute;
  right: 15px;
  width: 6px;
  height: 6px;
  background: #d4af37;
  border-radius: 50%;
  box-shadow: 0 0 10px #d4af37;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  background: rgba(10, 10, 10, 0.5);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  font-weight: 700;
  font-size: 16px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: #d4af37;
  font-size: 14px;
  font-weight: 600;
}

.user-role {
  color: #666;
  font-size: 12px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-title {
  color: #d4af37;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.header-time {
  color: #666;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  background: rgba(212, 175, 55, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background: linear-gradient(135deg, #8b0000 0%, #5c0000 100%) !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

.logout-btn:hover {
  background: linear-gradient(135deg, #a00000 0%, #700000 100%) !important;
  box-shadow: 0 0 15px rgba(139, 0, 0, 0.5) !important;
}

.content-area {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
  background: transparent;
}

.content-area::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-track {
  background: #0a0a0a;
}

.content-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #d4af37 0%, #b8960c 100%);
  border-radius: 3px;
}

.footer {
  padding: 15px 30px;
  text-align: center;
  color: #333;
  font-size: 12px;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
  background: rgba(10, 10, 10, 0.5);
}
</style>
