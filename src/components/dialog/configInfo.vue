<template>
  <div id="configInfo">
    <el-dialog
      title="系统信息"
      width="520px"
      top="15vh"
      :close-on-click-modal="false"
      :visible.sync="showDialog"
      :destroy-on-close="true"
      @close="close()"
    >
      <div id="shared" style="padding: 10px 0;">
        <el-descriptions title="国标服务信息" v-if="configInfoData.sip" :column="1" border>
          <el-descriptions-item label="编号" >{{configInfoData.sip.id}}</el-descriptions-item>
          <el-descriptions-item label="域">{{configInfoData.sip.domain}}</el-descriptions-item>
          <el-descriptions-item label="IP">{{configInfoData.sip.showIp}}</el-descriptions-item>
          <el-descriptions-item label="端口">{{configInfoData.sip.port}}</el-descriptions-item>
          <el-descriptions-item label="密码">
            <el-tag size="small">{{configInfoData.sip.password}}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions title="版本信息" v-if="configInfoData.version" :column="1" border style="margin-top: 20px;">
          <el-descriptions-item label="版本">{{configInfoData.version.version}}</el-descriptions-item>
          <el-descriptions-item label="编译时间">{{configInfoData.version.build_DATE}}</el-descriptions-item>
          <el-descriptions-item label="GIT版本">{{configInfoData.version.git_Revision_SHORT}}</el-descriptions-item>
          <el-descriptions-item label="GIT最后提交时间">{{configInfoData.version.git_DATE}}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template slot="footer">
        <el-button @click="close">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "configInfo",
  props: {},
  computed: {},
  created() {},
  data() {
    return {
      showDialog: false,
      configInfoData: {
        sip:{},

      }
    };
  },
  methods: {
    openDialog: function (data) {
      console.log(data)
      this.showDialog = true;
      this.configInfoData = data;
    },
    close: function () {
      this.showDialog = false;
    },
  },
};
</script>
