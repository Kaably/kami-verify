<template>
  <div class="page-card">
    <div class="page-header">
      <h3>日志管理</h3>
      <el-button type="danger" @click="clearLogs">清理日志</el-button>
    </div>

    <div class="search-bar">
      <el-select v-model="search.software_id" placeholder="选择软件" clearable style="width: 150px">
        <el-option v-for="s in softwareList" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-select v-model="search.action" placeholder="操作类型" clearable style="width: 120px">
        <el-option label="登录" value="login" />
        <el-option label="注册" value="register" />
        <el-option label="充值" value="recharge" />
      </el-select>
      <el-date-picker v-model="search.dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
      <el-button type="primary" @click="loadList">搜索</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="software_name" label="软件" width="120" />
      <el-table-column prop="action" label="操作" width="100">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="detail" label="详情" />
      <el-table-column prop="created_at" label="时间" width="180" />
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 20px; justify-content: flex-end;"
      @current-change="loadList"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'

const list = ref([])
const softwareList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const search = reactive({ software_id: null, action: null, dateRange: null })

function getActionType(action) {
  const types = { login: 'success', register: 'primary', recharge: 'warning', login_failed: 'danger' }
  return types[action] || 'info'
}

async function loadList() {
  const params = new URLSearchParams({ page: page.value, pageSize: pageSize.value })
  if (search.software_id) params.append('software_id', search.software_id)
  if (search.action) params.append('action', search.action)
  if (search.dateRange?.length === 2) {
    params.append('start_date', search.dateRange[0].toISOString().split('T')[0])
    params.append('end_date', search.dateRange[1].toISOString().split('T')[0])
  }
  
  const res = await api.get(`/logs/list?${params}`)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

async function loadSoftware() {
  const res = await api.get('/software/list')
  softwareList.value = res.data || []
}

async function clearLogs() {
  await ElMessageBox.confirm('确定清理30天前的日志？', '提示')
  const res = await api.post('/logs/clear', { days: 30 })
  if (res.code === 200) {
    ElMessage.success(res.message)
    loadList()
  }
}

onMounted(() => {
  loadSoftware()
  loadList()
})
</script>
