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
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="原密码" prop="old_password">
          <el-input v-model="form.old_password" type="password" show-password autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="form.new_password" type="password" show-password autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" show-password autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import userService from '../service/UserService'
const config = require('../../../config/index.js')

export default {
  name: "changePassword",
  data() {
    const validateConfirm = (rule, value, callback) => {
      if (value !== this.form.new_password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    return {
      showDialog: false,
      saving: false,
      form: {
        old_password: '',
        new_password: '',
        confirm: ''
      },
      rules: {
        old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
        ],
        confirm: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: validateConfirm, trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    openDialog() {
      this.form = { old_password: '', new_password: '', confirm: '' };
      this.showDialog = true;
    },
    close() {
      this.showDialog = false;
    },
    submit() {
      this.$refs.form.validate((ok) => {
        if (!ok) return;
        this.saving = true;
        const axios = require('axios');
        const token = userService.getToken();
        axios.post(config.API_BASE_URL + '/api/v1/auth/change-password', {
          old_password: this.form.old_password,
          new_password: this.form.new_password
        }, {
          timeout: 15000,
          headers: token ? { 'access-token': token } : {}
        }).then(() => {
          this.$message.success('密码已修改，请重新登录');
          this.saving = false;
          this.close();
          userService.clearUserInfo();
          userService.clearLoginStatus();
          this.$router.push('/login');
        }).catch((e) => {
          this.saving = false;
          const detail = e.response && e.response.data && e.response.data.detail;
          this.$message.error(detail || '修改失败');
        });
      });
    }
  },
};
</script>
