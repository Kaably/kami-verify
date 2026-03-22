<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <div class="welcome-text">
        <div class="welcome-icon">👋</div>
        <h1>欢迎回来，{{ authStore.admin?.username || '管理员' }}</h1>
        <p>Welcome to ICY Card Verification System</p>
      </div>
      <div class="welcome-time">
        <div class="time-display">{{ currentTime }}</div>
        <div class="date-display">{{ currentDate }}</div>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon software">
          <span class="icon-emoji">💻</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.softwareCount }}</div>
          <div class="stat-title">软件总数</div>
        </div>
        <div class="stat-trend up">
          <span>↑</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cards">
          <span class="icon-emoji">🎫</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.cardStats.total }}</div>
          <div class="stat-title">卡密总数</div>
        </div>
        <div class="stat-trend up">
          <span>↑</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon users">
          <span class="icon-emoji">👥</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.userCount }}</div>
          <div class="stat-title">用户总数</div>
        </div>
        <div class="stat-trend up">
          <span>↑</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon logins">
          <span class="icon-emoji">📊</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayLogins }}</div>
          <div class="stat-title">今日登录</div>
        </div>
        <div class="stat-trend up">
          <span>↑</span>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="section-card card-stats-section">
        <div class="section-header">
          <h3>🎫 卡密使用情况</h3>
        </div>
        <div class="card-stats">
          <div class="card-stat-item">
            <div class="stat-circle unused">
              <span>{{ stats.cardStats.unused }}</span>
            </div>
            <div class="stat-label">未使用</div>
          </div>
          <div class="card-stat-item">
            <div class="stat-circle used">
              <span>{{ stats.cardStats.used }}</span>
            </div>
            <div class="stat-label">已使用</div>
          </div>
          <div class="card-stat-item">
            <div class="stat-circle disabled">
              <span>{{ stats.cardStats.disabled }}</span>
            </div>
            <div class="stat-label">已禁用</div>
          </div>
          <div class="card-stat-item">
            <div class="stat-circle rate">
              <span>{{ cardUsageRate }}%</span>
            </div>
            <div class="stat-label">使用率</div>
          </div>
        </div>
        <div class="usage-bar">
          <div class="bar-label">使用进度</div>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: cardUsageRate + '%' }"></div>
          </div>
          <div class="bar-percent">{{ cardUsageRate }}%</div>
        </div>
      </div>

      <div class="section-card logs-section">
        <div class="section-header">
          <h3>📋 最近日志</h3>
          <span class="log-count">共 {{ recentLogs.length }} 条</span>
        </div>
        <el-table :data="recentLogs" style="background: transparent">
          <el-table-column prop="software_name" label="软件" width="120">
            <template #default="{ row }">
              <span class="software-tag">{{ row.software_name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="操作" width="100">
            <template #default="{ row }">
              <span :class="['action-tag', row.action]">{{ getActionText(row.action) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" width="140" />
          <el-table-column prop="detail" label="详情" />
          <el-table-column prop="created_at" label="时间" width="180">
            <template #default="{ row }">
              <span class="time-text">{{ row.created_at }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../utils/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

const stats = ref({
  softwareCount: 0,
  userCount: 0,
  todayLogins: 0,
  cardStats: { total: 0, unused: 0, used: 0, disabled: 0 }
})
const recentLogs = ref([])

const cardUsageRate = computed(() => {
  if (stats.value.cardStats.total === 0) return 0
  return ((stats.value.cardStats.used / stats.value.cardStats.total) * 100).toFixed(1)
})

function getActionText(action) {
  const actions = {
    login: '登录',
    logout: '登出',
    verify: '验证',
    register: '注册',
    create: '创建',
    delete: '删除'
  }
  return actions[action] || action
}

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

async function loadStats() {
  const [softwareRes, cardRes, userRes, logRes] = await Promise.all([
    api.get('/software/list'),
    api.get('/cards/stats'),
    api.get('/users/list?page=1&pageSize=1'),
    api.get('/logs/list?page=1&pageSize=10')
  ])
  
  stats.value.softwareCount = softwareRes.data?.length || 0
  stats.value.cardStats = cardRes.data || { total: 0, unused: 0, used: 0, disabled: 0 }
  stats.value.userCount = userRes.data?.total || 0
  stats.value.todayLogins = logRes.data?.list?.filter(l => l.action === 'login').length || 0
  recentLogs.value = logRes.data?.list || []
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadStats()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 35px 40px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.7) 100%);
  border-radius: 16px;
  margin-bottom: 25px;
  border: 1px solid rgba(212, 175, 55, 0.25);
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.welcome-text {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-icon {
  font-size: 50px;
  animation: wave 1.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-10deg); }
}

.welcome-text h1 {
  color: #d4af37;
  font-size: 28px;
  margin: 0 0 8px 0;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.welcome-text p {
  color: #666;
  font-size: 14px;
  margin: 0;
  letter-spacing: 1px;
}

.welcome-time {
  text-align: right;
}

.time-display {
  font-size: 42px;
  color: #d4af37;
  font-weight: 300;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.date-display {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 25px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%);
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
}

.stat-card:hover::after {
  opacity: 1;
}

.stat-icon {
  width: 65px;
  height: 65px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.icon-emoji {
  font-size: 32px;
}

.stat-icon.software {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(184, 150, 12, 0.1) 100%);
}

.stat-icon.cards {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.1) 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(25, 118, 210, 0.1) 100%);
}

.stat-icon.logins {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, rgba(123, 31, 162, 0.1) 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #d4af37;
  text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

.stat-title {
  font-size: 14px;
  color: #888;
  margin-top: 5px;
}

.stat-trend {
  font-size: 20px;
  padding: 8px 12px;
  border-radius: 8px;
}

.stat-trend.up {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 25px;
}

.section-card {
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%);
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  padding: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-header h3 {
  color: #d4af37;
  font-size: 16px;
  margin: 0;
  font-weight: 600;
}

.log-count {
  color: #666;
  font-size: 12px;
  background: rgba(212, 175, 55, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.card-stat-item {
  text-align: center;
  padding: 20px;
  background: rgba(30, 30, 30, 0.5);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.card-stat-item:hover {
  background: rgba(40, 40, 40, 0.5);
  transform: scale(1.02);
}

.stat-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 20px;
  font-weight: 700;
  position: relative;
}

.stat-circle::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--circle-color), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.stat-circle.unused {
  --circle-color: #4caf50;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.stat-circle.used {
  --circle-color: #d4af37;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
}

.stat-circle.disabled {
  --circle-color: #f44336;
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.stat-circle.rate {
  --circle-color: #2196f3;
  color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.usage-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: rgba(30, 30, 30, 0.5);
  border-radius: 10px;
}

.bar-label {
  color: #888;
  font-size: 14px;
  white-space: nowrap;
}

.bar-container {
  flex: 1;
  height: 10px;
  background: rgba(50, 50, 50, 0.5);
  border-radius: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #f4d03f);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.bar-percent {
  color: #d4af37;
  font-size: 14px;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.software-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(212, 175, 55, 0.15);
  color: #d4af37;
  border-radius: 4px;
  font-size: 12px;
}

.action-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.action-tag.login {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.action-tag.logout {
  background: rgba(255, 152, 0, 0.15);
  color: #ff9800;
}

.action-tag.verify {
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
}

.action-tag.register {
  background: rgba(156, 39, 176, 0.15);
  color: #9c27b0;
}

.time-text {
  color: #666;
  font-size: 12px;
}

:deep(.el-table) {
  background: transparent !important;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(30, 30, 30, 0.5);
}

:deep(.el-table th.el-table__cell) {
  background: rgba(30, 30, 30, 0.5) !important;
  color: #d4af37 !important;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2) !important;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #aaa !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: rgba(30, 30, 30, 0.3) !important;
}

:deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(212, 175, 55, 0.1) !important;
}
</style>
