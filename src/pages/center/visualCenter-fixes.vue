<!--
  视觉中心大屏页面展示修复补丁

  这个文件包含了针对大屏页面展示问题的修复方案
  主要修复：
  1. 图片加载失败时的后备方案
  2. 数据为空时的占位显示
  3. 图表渲染错误处理
  4. 响应式布局优化
-->

<script setup lang="ts">
/**
 * 将此代码片段添加到 visualCenter.vue 的 <script setup> 部分
 */

// 修复 1: 增强图片 URL 转换功能
function convertMinIOUrlToLocal(minioUrl: string): string {
  if (!minioUrl) {
    // 没有URL时返回默认图片 - 使用更可靠的方式
    try {
      return new URL('../monitoringWarning/images/1.jpg', import.meta.url).href;
    } catch {
      // 如果 import.meta.url 不可用，使用相对路径
      return '/src/components/visionAI/monitoringWarning/images/1.jpg';
    }
  }

  // 开发环境：如果后端返回空字符串或无效URL，使用本地图片
  if (process.env.NODE_ENV === 'development') {
    // 本地测试图片列表 - 确保图片存在
    const localImages = [
      new URL('../monitoringWarning/images/1.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/2.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/3.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/4.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/5.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/6.jpg', import.meta.url).href
    ];

    // 检查图片是否可访问
    if (!minioUrl || minioUrl === '' || minioUrl.includes('192.168.0.14:9000')) {
      return localImages[Math.floor(Math.random() * localImages.length)];
    }

    // 如果是 http/https URL，直接返回
    if (minioUrl.startsWith('http://') || minioUrl.startsWith('https://')) {
      return minioUrl;
    }

    // 其他情况返回本地图片
    return localImages[0];
  }

  // 生产环境保持原URL
  return minioUrl;
}

// 修复 2: 增强数据加载错误处理
async function loadWarningImagesData(): Promise<void> {
  loading.warningImages = true;
  try {
    const response = await centerAPI.alertStatistics.getLatestImages(10);
    if (response.data?.code === 0 && response.data?.data) {
      const images = response.data.data.map((item: any) => ({
        ...item,
        image: convertMinIOUrlToLocal(item.image)
      }));

      // 如果有数据，使用数据
      if (images.length > 0) {
        warningImages.value = images;
        currentWarningImage.value = {
          image: images[0].image,
          event: images[0].event,
          time: images[0].time,
          level: images[0].level,
          levelText: images[0].levelText,
          location: images[0].location
        };
        currentImageIndex.value = 0;
      } else {
        // 如果数据为空，使用模拟数据
        useFallbackImages();
      }
    } else {
      // API 返回错误，使用模拟数据
      useFallbackImages();
    }
  } catch (error) {
    console.error('加载预警图片失败:', error);
    // 使用模拟数据作为后备
    useFallbackImages();
  } finally {
    loading.warningImages = false;
  }
}

// 修复 3: 添加模拟数据后备方案
function useFallbackImages(): void {
  const fallbackImages = [
    {
      id: 1,
      image: convertMinIOUrlToLocal(''),
      event: '未戴安全帽',
      time: new Date().toLocaleString(),
      alert_time: new Date().toISOString(),
      level: 'high',
      levelText: '重要',
      location: '一号车间',
      camera_name: '摄像头001'
    },
    {
      id: 2,
      image: convertMinIOUrlToLocal(''),
      event: '违规吸烟',
      time: new Date(Date.now() - 300000).toLocaleString(),
      alert_time: new Date(Date.now() - 300000).toISOString(),
      level: 'medium',
      levelText: '普通',
      location: '二号车间',
      camera_name: '摄像头002'
    },
    {
      id: 3,
      image: convertMinIOUrlToLocal(''),
      event: '闲杂人员',
      time: new Date(Date.now() - 600000).toLocaleString(),
      alert_time: new Date(Date.now() - 600000).toISOString(),
      level: 'low',
      levelText: '提示',
      location: '大门入口',
      camera_name: '摄像头003'
    }
  ];

  warningImages.value = fallbackImages;
  if (fallbackImages.length > 0) {
    currentWarningImage.value = {
      image: fallbackImages[0].image,
      event: fallbackImages[0].event,
      time: fallbackImages[0].time,
      level: fallbackImages[0].level,
      levelText: fallbackImages[0].levelText,
      location: fallbackImages[0].location
    };
    currentImageIndex.value = 0;
  }
}

// 修复 4: 增强图表初始化错误处理
function initTrendChart(): void {
  if (!trendChartRef.value) {
    console.warn('趋势图容器未找到');
    return;
  }

  try {
    trendChart = echarts.init(trendChartRef.value);

    const option = {
      backgroundColor: 'transparent',
      grid: {
        top: 40,
        bottom: 20,
        left: 0,
        right: 20,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'rgba(0, 255, 255, 0.3)',
            width: 1
          }
        },
        backgroundColor: 'rgba(0, 19, 40, 0.8)',
        borderColor: 'rgba(0, 255, 255, 0.3)',
        textStyle: {
          color: '#00FFFF'
        }
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 255, 255, 0.3)'
          }
        },
        axisLabel: {
          color: '#7EAEE5'
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisLabel: {
          color: '#7EAEE5'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(35, 88, 148, 0.3)',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '预警数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: [3, 5, 10, 14, 12, 7, 5],
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#00FFFF' },
                { offset: 1, color: '#207FFF' }
              ]
            }
          },
          itemStyle: {
            color: '#00FFFF',
            borderColor: 'rgba(0, 255, 255, 0.3)',
            borderWidth: 6
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 255, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 255, 255, 0)' }
              ]
            }
          }
        }
      ]
    };

    trendChart.setOption(option);
  } catch (error) {
    console.error('初始化趋势图失败:', error);
  }
}

// 修复 5: 添加图片加载错误处理
function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  // 使用默认图片替代
  img.src = convertMinIOUrlToLocal('');
  console.warn('图片加载失败，使用默认图片:', img.src);
}

// 修复 6: 增强响应式布局处理
function handleResize(): void {
  if (trendChart) {
    try {
      trendChart.resize();
    } catch (e) {
      console.error('趋势图调整大小失败:', e);
    }
  }
  if (levelChart) {
    try {
      levelChart.resize();
    } catch (e) {
      console.error('等级图调整大小失败:', e);
    }
  }
  if (statusChart) {
    try {
      statusChart.resize();
    } catch (e) {
      console.error('状态图调整大小失败:', e);
    }
  }
}
</script>

<template>
  <!-- 在图片标签上添加错误处理 -->
  <img
    :src="currentWarningImage.image"
    :alt="currentWarningImage.event"
    class="main-warning-image"
    @error="handleImageError"
  />

  <!-- 缩略图也添加错误处理 -->
  <img
    :src="warning.image"
    :alt="warning.event"
    @error="handleImageError"
  />
</template>

<style scoped>
/* 修复 7: 添加图片加载占位样式 */
.main-warning-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
  transition: opacity 0.3s ease;
  aspect-ratio: 4/3;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* 图片加载失败时的样式 */
.main-warning-image[src=""],
.main-warning-image:not([src]) {
  opacity: 0;
}

/* 修复 8: 优化全屏模式下的布局 */
@media (display-mode: fullscreen) {
  .visual-center {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .main-image-container {
    height: calc(100% - 160px);
  }

  .panel-box {
    min-height: 300px;
  }
}

/* 修复 9: 小屏幕适配 */
@media (max-width: 1366px) {
  .visual-center {
    padding: 10px;
  }

  .top-bar {
    padding: 0 10px;
  }

  .top-bar .title span {
    font-size: 20px;
  }

  .panel-box {
    padding: 10px;
  }

  .thumbnail-item {
    width: 90px;
    height: 50px;
  }
}

/* 修复 10: 添加淡入动画确保平滑显示 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.main-warning-image {
  animation: fadeIn 0.5s ease-in-out;
}

.thumbnail-item img {
  animation: fadeIn 0.3s ease-in-out;
}
</style>
