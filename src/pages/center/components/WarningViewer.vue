<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import alertStatisticsAPI from '@/api/center/alertStatistics';
import type { WarningImage } from '@/types/center/components';
import type { AlertImage } from '@/types/center/alertStatistics';

interface Props {
  todayWarnings?: number;
  deviceCount?: number;
  totalDevices?: number;
}

const props = withDefaults(defineProps<Props>(), {
  todayWarnings: 0,
  deviceCount: 0,
  totalDevices: 0
});

// 数据状态
const warningImages = ref<WarningImage[]>([]);
const loading = ref<boolean>(false);
const currentIndex = ref<number>(0);

// 定时器
let refreshTimer: number | null = null;

// 当前显示的图片
const currentImage = computed(() => {
  if (warningImages.value.length === 0) return null;
  return warningImages.value[currentIndex.value];
});

// 预览图片列表
const previewImages = computed(() => {
  return warningImages.value.map(img => img.image);
});

/**
 * 获取图片URL
 */
function getImageUrl(image: AlertImage): string {
  return image.image_url || '';
}

/**
 * 加载预警图片数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const images = await alertStatisticsAPI.getLatestImages(10);
    if (images && images.length > 0) {
      warningImages.value = images.map((item: AlertImage): WarningImage => ({
        id: item.id,
        image: getImageUrl(item),
        event: item.alert_type || '',
        time: item.alert_time || '',
        alert_time: item.alert_time || '',
        level: '',
        levelText: '',
        location: item.location || '',
        camera_name: item.camera_name || ''
      }));
      currentIndex.value = 0;
    } else {
      warningImages.value = [];
    }
  } catch (error) {
    console.error('[WarningViewer] 加载预警图片失败:', error);
    warningImages.value = [];
  } finally {
    loading.value = false;
  }
}

/**
 * 选择图片
 */
function selectImage(index: number) {
  if (index >= 0 && index < warningImages.value.length) {
    currentIndex.value = index;
  }
}

/**
 * 上一张
 */
function prevImage() {
  if (warningImages.value.length === 0) return;
  currentIndex.value = (currentIndex.value - 1 + warningImages.value.length) % warningImages.value.length;
}

/**
 * 下一张
 */
function nextImage() {
  if (warningImages.value.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % warningImages.value.length;
}

onMounted(() => {
  loadData();
  refreshTimer = window.setInterval(loadData, 30 * 1000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

defineExpose({
  refresh: loadData,
  loading
});
</script>

<template>
  <div class="w-full h-full flex flex-col gap-3">
    <!-- 主图区域 -->
    <div class="relative flex-1 bg-black/20 rounded-lg overflow-hidden min-h-[200px]">
      <template v-if="currentImage">
        <!-- 主图 -->
        <el-image
          :src="currentImage.image"
          fit="cover"
          class="w-full h-full"
          :preview-src-list="previewImages"
          :initial-index="currentIndex"
          :preview-teleported="true"
        >
          <template #error>
            <div class="flex items-center justify-center w-full h-full text-[#7EAEE5]">
              图片加载失败
            </div>
          </template>
        </el-image>

        <!-- 左右导航按钮 -->
        <el-button
          class="absolute left-3 top-1/2 -translate-y-1/2 z-10"
          :icon="ArrowLeft"
          circle
          size="large"
          @click="prevImage"
        />
        <el-button
          class="absolute right-3 top-1/2 -translate-y-1/2 z-10"
          :icon="ArrowRight"
          circle
          size="large"
          @click="nextImage"
        />

        <!-- 预警信息覆盖层 - 右下角小窗口 -->
        <div class="absolute bottom-16 right-3 bg-black/40 backdrop-blur border border-cyan-400/30 rounded-lg px-4 py-3 min-w-[200px]">
          <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <span class="text-[#7EAEE5]">预警时间：</span>
            <span class="text-white">{{ currentImage.time }}</span>
            <span class="text-[#7EAEE5]">预警事件：</span>
            <span class="text-white">{{ currentImage.event }}</span>
            <span class="text-[#7EAEE5]">预警点位：</span>
            <span class="text-white">{{ currentImage.location }}</span>
          </div>
        </div>
      </template>

      <!-- 无数据时显示 -->
      <div v-else class="flex items-center justify-center w-full h-full text-[#7EAEE5]">
        暂无预警图片
      </div>

      <!-- 顶部统计信息 -->
      <div class="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
        <!-- 今日预警 -->
        <div class="flex items-center gap-2 bg-black/40 backdrop-blur border border-cyan-400/30 rounded-lg px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <i class="i-carbon-warning text-white text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-[#7EAEE5]">今日预警</div>
            <div class="text-lg font-bold text-cyan-400">{{ todayWarnings }}<span class="text-xs ml-1">个</span></div>
          </div>
        </div>

        <!-- 设备概览 -->
        <div class="flex items-center gap-2 bg-black/40 backdrop-blur border border-cyan-400/30 rounded-lg px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center">
            <i class="i-carbon-video text-white text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-[#7EAEE5]">设备概览</div>
            <div class="text-lg font-bold text-cyan-400">{{ deviceCount }}/{{ totalDevices }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 缩略图列表 -->
    <div v-if="warningImages.length > 0" class="h-16 flex items-center gap-2 overflow-x-auto overflow-y-hidden">
      <div
        v-for="(item, index) in warningImages"
        :key="item.id"
        class="flex-shrink-0 w-20 h-14 rounded cursor-pointer border-2 transition-all overflow-hidden"
        :class="currentIndex === index ? 'border-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'"
        @click="selectImage(index)"
      >
        <el-image
          :src="item.image"
          fit="cover"
          class="w-full h-full"
        >
          <template #error>
            <div class="flex items-center justify-center w-full h-full text-[#7EAEE5] text-xs">
              加载失败
            </div>
          </template>
        </el-image>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 隐藏缩略图滚动条但保持可滚动 */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(0, 255, 255, 0.1);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}
</style>
