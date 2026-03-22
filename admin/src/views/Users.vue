<template>
  <div class="page-card">
    <div class="page-header">
      <h3>用户管理</h3>
    </div>

    <div class="search-bar">
      <el-select v-model="search.software_id" placeholder="选择软件" clearable style="width: 150px">
        <el-option v-for="s in softwareList" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-input v-model="search.keyword" placeholder="搜索用户名" style="width: 200px" clearable />
      <el-button type="primary" @click="loadList">搜索</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="software_name" label="软件" width="120" />
      <el-table-column prop="machine_code" label="机器码" width="180" />
      <el-table-column prop="expire_at" label="到期时间" width="180">
        <template #default="{ row }">
          <span :style="{ color: isExpired(row.expire_at) ? 'red' : '' }">
            {{ row.expire_at || '永久' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login" label="最后登录" width="180" />
      <el-table-column label="操作" width="250">
        <template #default="{ row }">
          <el-button size="small" @click="showExtendDialog(row)">续期</el-button>
          <el-button size="small" type="warning" @click="unbindMachine(row)">解绑</el-button>
          <el-button size="small" type="danger" @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 20px; justify-content: flex-end;"
      @current-change="loadList"
    />

    <el-dialog v-model="extendVisible" title="用户续期" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input :value="extendUser?.username" disabled />
        </el-form-item>
        <el-form-item label="续期天数">
          <el-input-number v-model="extendDays" :min="1" :max="3650" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="extendVisible = false">取消</el-button>
        <el-button type="primary" @click="extendUserTime">确定</el-button>
      </template>
    </el-dialog>
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
const extendVisible = ref(false)
const extendUser = ref(null)
const extendDays = ref(30)

const search = reactive({ software_id: null, keyword: '' })

function isExpired(date) {
  return date && new Date(date) < new Date()
}

async function loadList() {
  const params = new URLSearchParams({ page: page.value, pageSize: pageSize.value })
  if (search.software_id) params.append('software_id', search.software_id)
  if (search.keyword) params.append('keyword', search.keyword)
  
  const res = await api.get(`/users/list?${params}`)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

async function loadSoftware() {
  const res = await api.get('/software/list')
  softwareList.value = res.data || []
}

function showExtendDialog(row) {
  extendUser.value = row
  extendDays.value = 30
  extendVisible.value = true
}

async function extendUserTime() {
  const res = await api.post('/users/extend', { id: extendUser.value.id, days: extendDays.value })
  if (res.code === 200) {
    ElMessage.success('续期成功')
    extendVisible.value = false
    loadList()
  }
}

async function unbindMachine(row) {
  await ElMessageBox.confirm('确定解绑该用户的机器码？', '提示')
  const res = await api.post('/users/unbind-machine', { id: row.id })
  if (res.code === 200) {
    ElMessage.success('解绑成功')
    loadList()
  }
}

async function toggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  const res = await api.post('/users/update-status', { id: row.id, status: newStatus })
  if (res.code === 200) {
    ElMessage.success('操作成功')
    loadList()
  }
}

onMounted(() => {
  loadSoftware()
  loadList()
})
</script>
