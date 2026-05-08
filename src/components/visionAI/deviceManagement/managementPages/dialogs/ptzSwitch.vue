<template>
  <div id="ptzSwitch">
    <el-form size="mini" :inline="true" >
      <el-form-item >
        <el-input
          min="1"
          max="4095"
          placeholder="开关编号"
          addonBefore="开关编号"
          addonAfter="(2-255)"
          v-model="switchId"
          size="mini"
        >
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button size="mini" @click="open('on')">开启</el-button>
        <el-button size="mini" @click="open('off')">关闭</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { controlAuxiliary } from '@/api/ptz'

export default {
  name: "ptzSwitch",
  props: [ 'channelDeviceId', 'deviceId'],
  components: {},
  created() {
  },
  data() {
    return {
      switchId: 1,
    };
  },
  methods: {
    open: function (command){
      const loading = this.$loading({
        lock: true,
        fullscreen: true,
        text: '正在发送指令',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      controlAuxiliary(this.deviceId, this.channelDeviceId, {
        command: command,
        switchId: this.switchId,
      }).then((res)=> {
        if (res.code === 0) {
          this.$message({
            showClose: true,
            message: "保存成功",
            type: 'success'
          });
        }else {
          this.$message({
            showClose: true,
            message: res.msg,
            type: 'error'
          });
        }
      }).catch((error)=> {
        this.$message({
          showClose: true,
          message: error,
          type: 'error'
        });
      }).finally(()=>{
        loading.close()
      })
    },
  },
};
</script>
<style>
.channel-form {
  display: grid;
  background-color: #FFFFFF;
  padding: 1rem 2rem 0 2rem;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

</style>
