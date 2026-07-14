<template>
  <div id="changePassword">
    <el-dialog
      title="修改密码"
      width="40%"
      top="2rem"
      :close-on-click-modal="false"
      :visible.sync="showDialog"
      :destroy-on-close="true"
      @close="close()"
    >
      <el-alert
        title="当前平台使用本地模拟登录，暂不支持在线修改密码。"
        type="info"
        :closable="false"
        show-icon
      />
      <span slot="footer">
        <el-button type="primary" @click="close">知道了</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "changePassword",
  data() {
    return {
      showDialog: false,
    };
  },
  methods: {
    openDialog() {
      this.showDialog = true;
    },
    close() {
      this.showDialog = false;
    },
  },
};
</script>
