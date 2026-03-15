<template>
  <div id="SyncChannelProgress" v-loading="isLoging">
    <el-dialog
      width="240px"
      top="13%"
      :append-to-body="true"
      :close-on-click-modal="false"
      v-model:visible="showDialog"
      :destroy-on-close="true"
      :show-close="true"
      @close="close()"
      style="text-align: center"
    >
      <el-progress type="circle" :percentage="percentage" :status="syncStatus"></el-progress>
      <div style="text-align: center">
        {{ msg }}
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getDeviceSyncStatus } from "@/api/dialog";

export default {
  name: "SyncChannelProgress",
  computed: {},
  props: ["platformId"],
  created() {},
  data() {
    return {
      endCallBack: null,
      syncStatus: null,
      percentage: 0,
      total: 0,
      current: 0,
      showDialog: false,
      isLoging: false,
      syncFlag: false,
      deviceId: null,
      timmer: null,
      msg: "正在同步",
    };
  },
  methods: {
    openDialog: function (deviceId, endCallBack) {
      console.log("deviceId: " + deviceId);
      this.deviceId = deviceId;
      this.showDialog = true;
      this.msg = "";
      this.percentage = 0;
      this.total = 0;
      this.current = 0;
      this.syncFlag = false;
      this.syncStatus = null;
      this.endCallBack = endCallBack;
      this.getProgress();
    },
    getProgress() {
      getDeviceSyncStatus(this.deviceId)
        .then((data) => {
          // 响应拦截器已处理成功/失败判断，直接使用数据
          if (data != null) {
            if (data.syncIng) {
              if (data.total === 0) {
                this.msg = `等待同步中`;
                this.timmer = setTimeout(this.getProgress, 300);
              } else {
                this.syncFlag = true;
                this.total = data.total;
                this.current = data.current;
                this.percentage =
                  Math.floor((Number(data.current) / Number(data.total)) * 10000) / 100;
                this.msg = `同步中...[${data.current}/${data.total}]`;
                this.timmer = setTimeout(this.getProgress, 300);
              }
            } else {
              if (data.errorMsg) {
                this.msg = data.errorMsg;
                this.syncStatus = "exception";
              } else {
                this.syncStatus = "success";
                this.percentage = 100;
                this.msg = "同步成功";
                setTimeout(() => {
                  this.showDialog = false;
                }, 3000);
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
          this.syncStatus = "error";
          this.msg = error.response?.data?.msg || error.message;
        });
    },
    close: function () {
      if (this.endCallBack) {
        this.endCallBack();
      }
      window.clearTimeout(this.timmer);
    },
  },
};
</script>
