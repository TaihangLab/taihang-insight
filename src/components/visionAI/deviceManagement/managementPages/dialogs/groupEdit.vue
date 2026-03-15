<template>
  <div id="groupEdit" v-loading="loading">
    <el-dialog
      title="分组编辑"
      width="40%"
      top="2rem"
      :append-to-body="true"
      :close-on-click-modal="false"
      v-model:visible="showDialog"
      :destroy-on-close="true"
      @close="close()"
    >
      <div id="shared" style="margin-top: 1rem; margin-right: 100px">
        <el-form ref="form" :model="group" label-width="140px">
          <el-form-item label="节点编号" prop="id">
            <el-input v-model="group.deviceId" placeholder="请输入编码">
              <template v-slot:append>
<el-button  @click="buildDeviceIdCode(group.deviceId)">生成</el-button>
</template>
            </el-input>
          </el-form-item>
          <el-form-item label="节点名称" prop="name">
            <el-input v-model="group.name" clearable></el-input>
          </el-form-item>
          <el-form-item label="行政区划" prop="name">
            <el-input v-model="group.civilCode">
              <template v-slot:append>
<el-button  @click="buildCivilCode(group.civilCode)">选择</el-button>
</template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <div style="float: right">
              <el-button type="primary" @click="onSubmit">确认</el-button>
              <el-button @click="close">取消</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
    <channelCode ref="channelCode"></channelCode>
    <chooseCivilCode ref="chooseCivilCode"></chooseCivilCode>
  </div>
</template>

<script>
import channelCode from "./channelCode.vue";
import ChooseCivilCode from "./chooseCivilCode.vue";
import wvpAxios from "@/api/camera/base";

export default {
  name: "groupEdit",
  components: { ChooseCivilCode, channelCode },
  computed: {},
  props: [],
  created() {},
  data() {
    return {
      submitCallback: null,
      showDialog: false,
      loading: false,
      level: 0,
      group: {
        id: 0,
        deviceId: "",
        name: "",
        parentDeviceId: "",
        businessGroup: "",
        civilCode: "",
        platformId: "",
      },
    };
  },
  methods: {
    openDialog: function (group, callback) {
      console.log(group);
      if (group) {
        this.group = group;
      }
      this.showDialog = true;
      this.submitCallback = callback;
    },
    onSubmit: function () {
      wvpAxios({
        method: "post",
        url: this.group.id ? "/group/update" : "/group/add",
        data: this.group,
      })
        .then((res) => {
          if (res.data.code === 0) {
            this.$message.success({
              showClose: true,
              message: "保存成功",
            });
            if (this.submitCallback) this.submitCallback(this.group);
          } else {
            this.$message({
              showClose: true,
              message: res.data.msg,
              type: "error",
            });
          }
          this.close();
        })
        .catch((error) => {
          this.$message({
            showClose: true,
            message: error,
            type: "error",
          });
        });
    },
    buildDeviceIdCode: function (deviceId) {
      console.log(this.group);
      let lockContent = this.group.businessGroup ? "216" : "215";
      this.$refs.channelCode.openDialog(
        (code) => {
          this.group.deviceId = code;
        },
        deviceId,
        5,
        lockContent,
      );
    },
    buildCivilCode: function (deviceId) {
      this.$refs.chooseCivilCode.openDialog((code) => {
        this.group.civilCode = code;
      });
    },
    close: function () {
      this.showDialog = false;
      console.log(this.group);
    },
  },
};
</script>
