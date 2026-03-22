<template>
  <div>
    <div class="stat-cards">
      <div class="stat-card">
        <div class="title">软件总数</div>
        <div class="value">{{ stats.softwareCount }}</div>
      </div>
      <div class="stat-card">
        <div class="title">卡密总数</div>
        <div class="value">{{ stats.cardStats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="title">用户总数</div>
        <div class="value">{{ stats.userCount }}</div>
      </div>
      <div class="stat-card">
        <div class="title">今日登录</div>
        <div class="value">{{ stats.todayLogins }}</div>
      </div>
    </div>

    <div class="page-card">
      <h3 style="margin-bottom: 20px;">卡密使用情况</h3>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="未使用" :value="stats.cardStats.unused" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已使用" :value="stats.cardStats.used" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已禁用" :value="stats.cardStats.disabled" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="使用率" :value="cardUsageRate" suffix="%" />
        </el-col>
      </el-row>
    </div>

    <div class="page-card" style="margin-top: 20px;">
      <h3 style="margin-bottom: 20px;">最近日志</h3>
      <el-table :data="recentLogs" stripe>
        <el-table-column prop="software_name" label="软件" width="120" />
        <el-table-column prop="action" label="操作" width="100" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="detail" label="详情" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../utils/api'

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

onMounted(loadStats)
</script>
