<template>
  <div id="importChannel" v-loading="isLoging">
    <el-dialog
      title="导入通道数据"
      width="30rem"
      top="2rem"
      :append-to-body="true"
      :close-on-click-modal="false"
      :visible.sync="showDialog"
      :destroy-on-close="true"
      @close="close()"
    >
      <div>
        <el-upload
          class="upload-box"
          drag
          :action="uploadUrl"
          name="file"
          :headers="headers"
          :on-success="successHook"
          :on-error="errorHook"
          >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传 csv / xls / xlsx 文件</div>
        </el-upload>
      </div>
    </el-dialog>
    <ShowErrorData ref="showErrorData" :gbIds="errorGBIds" :streams="errorStreams" ></ShowErrorData>
  </div>
</template>

<script>

import ShowErrorData from './importChannelShowErrorData.vue'

import userService from "../service/UserService.js";

export default {
  name: "importChannel",
  components: {
    ShowErrorData,
  },
  created() {},
  data() {
    return {
      submitCallback: null,
      showDialog: false,
      isLoging: false,
      isEdit: false,
      errorStreams: [],
      errorGBIds: [],
      headers: {
        "access-token": userService.getToken()
      },
      uploadUrl: import.meta.env.MODE === 'development'? `/debug/api/push/upload`: (window.baseUrl ? window.baseUrl : "") + `/api/push/upload`,
    };
  },
  methods: {
    openDialog: function (callback) {
      this.showDialog = true;
      this.submitCallback = callback;
    },
    onSubmit: function () {
      console.log("onSubmit");
      // 注意：该方法在 importChannel.vue 中已被注释或未使用
      // 文件上传通过 el-upload 组件的 action 和 on-success/on-error 钩子处理
      // 如需使用此方法，请根据实际需求进行封装
    },
    close: function () {
      this.showDialog = false;
    },
    successHook: function(response, file, fileList){
      if (response.code === 0) {
        this.$message({
          showClose: true,
          message: response.msg,
          type: "success",
        });
      }else if (response.code === 1) {
        this.errorGBIds = response.data.gbId
        this.errorStreams = response.data.stream
        console.log(this.$refs)
        console.log(this.$refs.showErrorData)
        this.$refs.showErrorData.openDialog()
      }else {
        this.$message({
          showClose: true,
          message: response.msg,
          type: "error",
        });
      }
    },
    errorHook: function (err, file, fileList) {
      this.$message({
        showClose: true,
        message: err,
        type: "error",
      });
    }
  },
};
</script>
<style>
.upload-box{
  text-align: center;
}
.errDataBox{
  max-height: 15rem;
  overflow: auto;
}
</style>
