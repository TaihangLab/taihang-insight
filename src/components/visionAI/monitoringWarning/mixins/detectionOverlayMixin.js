/**
 * 实时监控检测框OSD叠加 - 混入(Mixin)
 *
 * 功能：
 * 1. 为每个视频窗口提供AI任务选择
 * 2. 通过WebSocket接收实时检测结果
 * 3. 在视频上叠加显示检测框
 */

export default {
  data() {
    return {
      // OSD叠加相关
      selectedAITasks: {}, // 每个视频窗口的AI任务选择 {index: task_id}
      availableAITasks: {}, // 每个摄像头的可用AI任务列表 {camera_id: []}
      wsConnections: {}, // WebSocket连接池 {index: WebSocket}
      detectionResults: {}, // 检测结果数据 {index: {detections: [], frame_size: {}}}
      cameraIdMapping: {}, // 摄像头ID映射 {index: camera_id}
      videoResolutions: {}, // 视频分辨率 {index: {width, height}}
    };
  },

  methods: {
    /**
     * 获取指定摄像头的可用AI任务列表
     */
    async loadAvailableAITasks(cameraId, index) {
      try {
        const response = await this.$http.get(
          `/api/realtime-detection/detection/tasks/by_camera/${cameraId}`,
        );
        // 响应拦截器已处理成功/失败判断，直接使用数据
        const tasks = response.data || response || [];
        this.$set(this.availableAITasks, cameraId, tasks);
        console.log(`✅ 摄像头${cameraId}的AI任务列表:`, tasks);
      } catch (error) {
        console.error(`❌ 获取摄像头${cameraId}的AI任务列表失败:`, error);
      }
    },

    /**
     * AI任务选择变化处理
     */
    onTaskSelectionChange(index) {
      const taskId = this.selectedAITasks[index];

      // 断开旧连接
      if (this.wsConnections[index]) {
        this.wsConnections[index].close();
        delete this.wsConnections[index];
      }

      // 清空检测结果
      this.$set(this.detectionResults, index, null);

      // 如果选择了任务，建立WebSocket连接
      if (taskId) {
        this.connectDetectionWebSocket(index, taskId);
      }
    },

    /**
     * 连接检测结果WebSocket
     */
    connectDetectionWebSocket(index, taskId) {
      try {
        // 构建WebSocket URL
        const protocol = location.protocol === "https:" ? "wss:" : "ws:";
        const host = location.host;
        const wsUrl = `${protocol}//${host}/api/realtime-detection/ws/detection/${taskId}`;

        console.log(`🔌 连接检测WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`✅ WebSocket连接成功: task_id=${taskId}, index=${index}`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // 更新检测结果
            this.$set(this.detectionResults, index, {
              detections: data.detections || [],
              frame_size: data.frame_size || { width: 1920, height: 1080 },
            });

            // 更新视频分辨率
            if (data.frame_size) {
              this.$set(this.videoResolutions, index, {
                width: data.frame_size.width,
                height: data.frame_size.height,
              });
            }
          } catch (error) {
            console.error("❌ 解析检测结果失败:", error);
          }
        };

        ws.onerror = (error) => {
          console.error(`❌ WebSocket错误: task_id=${taskId}`, error);
        };

        ws.onclose = () => {
          console.log(`🔌 WebSocket已断开: task_id=${taskId}`);
          // 清理
          if (this.wsConnections[index] === ws) {
            delete this.wsConnections[index];
          }
        };

        // 保存连接
        this.wsConnections[index] = ws;
      } catch (error) {
        console.error("❌ 创建WebSocket连接失败:", error);
      }
    },

    /**
     * 获取视频窗口宽度
     */
    getVideoWidth(index) {
      const ref = this.$refs[`videoContent${index}`];
      if (ref && ref[0]) {
        return ref[0].clientWidth || 640;
      }
      return 640;
    },

    /**
     * 获取视频窗口高度
     */
    getVideoHeight(index) {
      const ref = this.$refs[`videoContent${index}`];
      if (ref && ref[0]) {
        return ref[0].clientHeight || 480;
      }
      return 480;
    },

    /**
     * 清理指定索引的OSD资源
     */
    cleanupOSDResources(index) {
      // 关闭WebSocket连接
      if (this.wsConnections[index]) {
        this.wsConnections[index].close();
        delete this.wsConnections[index];
      }

      // 清空数据
      this.$set(this.selectedAITasks, index, null);
      this.$set(this.detectionResults, index, null);
      this.$set(this.videoResolutions, index, null);
    },

    /**
     * 清理所有OSD资源
     */
    cleanupAllOSDResources() {
      // 关闭所有WebSocket连接
      Object.values(this.wsConnections).forEach((ws) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      // 清空所有数据
      this.wsConnections = {};
      this.selectedAITasks = {};
      this.detectionResults = {};
      this.availableAITasks = {};
      this.cameraIdMapping = {};
      this.videoResolutions = {};
    },
  },

  beforeDestroy() {
    // 清理所有OSD资源
    this.cleanupAllOSDResources();
  },
};
