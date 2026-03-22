<template>
  <div class="app-container">
    <audio ref="bgMusic" loop preload="auto">
      <source src="/bgmusic.mp3" type="audio/mpeg">
    </audio>
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

    <!-- 音乐控制按钮 -->
    <div class="music-control" @click="toggleMusic" :title="isPlaying ? '暂停音乐' : '播放音乐'">
      <span v-if="isPlaying">🎵</span>
      <span v-else>🔇</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, provide } from 'vue'

const bgMusic = ref(null)
const isPlaying = ref(false)
const showWelcome = ref(false)
const WELCOME_SHOWN_KEY = 'icy_welcome_shown'
const MUSIC_PLAYING_KEY = 'icy_music_playing'

function playMusic() {
  if (bgMusic.value) {
    bgMusic.value.play().then(() => {
      isPlaying.value = true
      localStorage.setItem(MUSIC_PLAYING_KEY, 'true')
    }).catch(() => {
      localStorage.setItem(MUSIC_PLAYING_KEY, 'false')
    })
  }
}

function pauseMusic() {
  if (bgMusic.value) {
    bgMusic.value.pause()
    isPlaying.value = false
    localStorage.setItem(MUSIC_PLAYING_KEY, 'false')
  }
}

function toggleMusic() {
  if (isPlaying.value) {
    pauseMusic()
  } else {
    playMusic()
  }
}

function closeWelcome() {
  showWelcome.value = false
  localStorage.setItem(WELCOME_SHOWN_KEY, Date.now().toString())
  playMusic()
}

provide('playMusic', playMusic)
provide('isPlaying', isPlaying)

onMounted(async () => {
  if (bgMusic.value) {
    bgMusic.value.volume = 0.3
  }
  
  await nextTick()
  
  const lastWelcome = localStorage.getItem(WELCOME_SHOWN_KEY)
  const now = Date.now()
  const showAgain = !lastWelcome || (now - parseInt(lastWelcome)) > 2000
  
  if (showAgain) {
    showWelcome.value = true
  } else {
    const wasPlaying = localStorage.getItem(MUSIC_PLAYING_KEY) === 'true'
    if (wasPlaying) {
      playMusic()
    }
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

/* 音乐控制按钮 */
.music-control {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  transition: all 0.3s ease;
}

.music-control:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
}

/* 全局手机端适配 */
@media screen and (max-width: 768px) {
  .welcome-dialog .el-dialog {
    width: 90% !important;
    max-width: 400px !important;
    margin: 10vh auto !important;
    border-radius: 15px !important;
  }

  .welcome-dialog .el-dialog__body {
    padding: 30px 20px 20px !important;
  }

  .welcome-dialog .el-dialog__footer {
    padding: 0 20px 25px !important;
  }

  .welcome-icon {
    font-size: 50px;
    margin-bottom: 15px;
  }

  .welcome-main-title {
    font-size: 20px;
  }

  .welcome-btn {
    font-size: 16px !important;
    padding: 14px 40px !important;
    letter-spacing: 2px !important;
  }

  .music-control {
    width: 40px;
    height: 40px;
    font-size: 20px;
    bottom: 15px;
    right: 15px;
  }

  /* Element Plus 组件适配 */
  .el-table {
    font-size: 12px !important;
  }

  .el-button {
    padding: 8px 15px !important;
  }

  .el-input__inner {
    font-size: 14px !important;
  }

  .el-dialog {
    width: 90% !important;
    max-width: 400px !important;
  }

  .el-form-item__label {
    font-size: 13px !important;
  }

  .el-pagination {
    flex-wrap: wrap;
    justify-content: center;
  }

  .el-pagination .el-pagination__sizes,
  .el-pagination .el-pagination__jump {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .welcome-dialog .el-dialog {
    width: 95% !important;
    max-width: 350px !important;
    margin: 5vh auto !important;
  }

  .welcome-icon {
    font-size: 40px;
  }

  .welcome-main-title {
    font-size: 16px;
  }

  .welcome-btn {
    font-size: 14px !important;
    padding: 12px 30px !important;
  }

  .el-table {
    font-size: 11px !important;
  }

  .el-button--small {
    padding: 6px 10px !important;
    font-size: 12px !important;
  }
}
</style>
