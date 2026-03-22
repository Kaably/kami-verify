<template>
  <div class="page-card">
    <div class="page-header">
      <h3>卡密管理</h3>
      <el-button type="primary" @click="showGenerateDialog">生成卡密</el-button>
    </div>

    <div class="search-bar">
      <el-select v-model="search.software_id" placeholder="选择软件" clearable style="width: 150px">
        <el-option v-for="s in softwareList" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-select v-model="search.status" placeholder="状态" clearable style="width: 100px">
        <el-option label="未使用" :value="0" />
        <el-option label="已使用" :value="1" />
        <el-option label="已禁用" :value="2" />
      </el-select>
      <el-input v-model="search.keyword" placeholder="搜索卡密/用户" style="width: 200px" clearable />
      <el-button type="primary" @click="loadList">搜索</el-button>
      <el-button @click="exportCards">导出</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="card_key" label="卡密" width="200" />
      <el-table-column prop="software_name" label="软件" width="120" />
      <el-table-column prop="duration" label="时长" width="80">
        <template #default="{ row }">{{ row.duration }}{{ row.duration_unit === 'day' ? '天' : row.duration_unit === 'month' ? '月' : '年' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'info' : row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 0 ? '未使用' : row.status === 1 ? '已使用' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bind_user" label="绑定用户" width="120" />
      <el-table-column prop="expire_at" label="到期时间" width="180" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 20px; justify-content: flex-end;"
      @current-change="loadList"
    />

    <el-dialog v-model="generateVisible" title="生成卡密" width="500px">
      <el-form :model="generateForm" label-width="80px">
        <el-form-item label="软件">
          <el-select v-model="generateForm.software_id" style="width: 100%">
            <el-option v-for="s in softwareList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="generateForm.count" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="时长">
          <el-input-number v-model="generateForm.duration" :min="1" />
          <el-select v-model="generateForm.duration_unit" style="width: 80px; margin-left: 10px;">
            <el-option label="天" value="day" />
            <el-option label="月" value="month" />
            <el-option label="年" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="前缀">
          <el-input v-model="generateForm.prefix" style="width: 150px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="generateForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" @click="generateCards">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

const list = ref([])
const softwareList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const generateVisible = ref(false)

const search = reactive({ software_id: null, status: null, keyword: '' })
const generateForm = reactive({
  software_id: null,
  count: 10,
  duration: 30,
  duration_unit: 'day',
  prefix: 'KAMI',
  remark: ''
})

async function loadList() {
  const params = new URLSearchParams({ page: page.value, pageSize: pageSize.value })
  if (search.software_id) params.append('software_id', search.software_id)
  if (search.status !== null) params.append('status', search.status)
  if (search.keyword) params.append('keyword', search.keyword)
  
  const res = await api.get(`/cards/list?${params}`)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

async function loadSoftware() {
  const res = await api.get('/software/list')
  softwareList.value = res.data || []
}

function showGenerateDialog() {
  generateForm.software_id = softwareList.value[0]?.id || null
  generateVisible.value = true
}

async function generateCards() {
  const res = await api.post('/cards/generate', generateForm)
  if (res.code === 200) {
    ElMessage.success(res.message)
    generateVisible.value = false
    loadList()
  }
}

async function exportCards() {
  const res = await api.post('/cards/export', { software_id: search.software_id, status: search.status })
  const blob = new Blob([res], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cards_${Date.now()}.csv`
  a.click()
}

onMounted(() => {
  loadSoftware()
  loadList()
})
</script>
