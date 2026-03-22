<template>
  <div class="app-container">
    <router-view />

    <el-dialog 
      v-model="showWelcome" 
      title="" 
      width="500px" 
      :close-on-click-modal="false"
      :show-close="false"
      class="welcome-dialog"
      append-to-body
    >
      <div class="welcome-content">
        <div class="welcome-icon">👑</div>
        <h2 class="welcome-main-title">欢迎回到<br>超级无敌大帅比ICY的卡密验证系统</h2>
      </div>
      <template #footer>
        <el-button type="primary" size="large" @click="closeWelcome" class="welcome-btn">
          朕收到了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const showWelcome = ref(false)
const WELCOME_SHOWN_KEY = 'icy_welcome_shown'

function closeWelcome() {
  showWelcome.value = false
  localStorage.setItem(WELCOME_SHOWN_KEY, Date.now().toString())
}

onMounted(async () => {
  await nextTick()
  
  const lastWelcome = localStorage.getItem(WELCOME_SHOWN_KEY)
  const now = Date.now()
  const showAgain = !lastWelcome || (now - parseInt(lastWelcome)) > 2000
  
  if (showAgain) {
    showWelcome.value = true
  }
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: #0a0a0a;
}

.welcome-dialog .el-dialog {
  background: linear-gradient(145deg, rgba(15, 15, 15, 0.98) 0%, rgba(5, 5, 5, 1) 100%) !important;
  border: 2px solid rgba(255, 105, 180, 0.5) !important;
  border-radius: 20px !important;
  box-shadow: 0 0 50px rgba(255, 105, 180, 0.3), 0 25px 60px rgba(0, 0, 0, 0.8) !important;
}

.welcome-dialog .el-dialog__header {
  display: none;
}

.welcome-dialog .el-dialog__body {
  padding: 50px 30px 30px !important;
}

.welcome-dialog .el-dialog__footer {
  padding: 0 30px 40px !important;
  text-align: center !important;
}

.welcome-content {
  text-align: center;
}

.welcome-icon {
  font-size: 70px;
  margin-bottom: 25px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.welcome-main-title {
  color: #ff69b4;
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 0 30px rgba(255, 105, 180, 0.5);
  line-height: 1.5;
}

.welcome-btn {
  background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 700 !important;
  font-size: 18px !important;
  padding: 18px 60px !important;
  letter-spacing: 4px !important;
  border-radius: 30px !important;
  transition: all 0.3s ease !important;
}

.welcome-btn:hover {
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%) !important;
  box-shadow: 0 0 30px rgba(255, 105, 180, 0.6) !important;
  transform: scale(1.05);
}
</style>
