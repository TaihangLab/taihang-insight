<template>
  <div id="addUser" v-loading="getDeviceListLoading">
    <el-dialog
      title="添加国标设备通道"
      width="1000px"
      top="10vh"
      :close-on-click-modal="false"
      :visible.sync="showDialog"
      :destroy-on-close="true"
      append-to-body
      @close="close()"
    >
      <div class="page-header" style="margin-bottom: 16px;">
        <div class="page-header-btn" style="text-align: left; display: flex; align-items: center; gap: 10px;">
          <span>搜索:</span>
          <el-input @input="getDeviceList" style="width: 200px;" size="small" placeholder="关键字"
                    prefix-icon="el-icon-search" v-model="searchSrt" clearable></el-input>
          <span style="margin-left: 10px;">在线状态:</span>
          <el-select size="small" style="width: 120px;" @change="getDeviceList" v-model="online" placeholder="请选择"
                     default-first-option>
            <el-option label="全部" value=""></el-option>
            <el-option label="在线" value="true"></el-option>
            <el-option label="离线" value="false"></el-option>
          </el-select>
          <el-button size="small" icon="el-icon-refresh" :loading="getDeviceListLoading"
                     @click="getDeviceList()">刷新</el-button>
        </div>
      </div>
      <!--设备列表-->
      <el-table size="small" :data="deviceList" style="width: 100%;" :height="winHeight" header-row-class-name="table-header" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" >
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="deviceId" label="设备编号" min-width="200" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="channelCount" label="通道数" width="100" align="center">
        </el-table-column>
        <el-table-column prop="manufacturer" label="厂家" min-width="120" show-overflow-tooltip>
        </el-table-column>
        <el-table-column label="地址" min-width="160" >
          <template v-slot:default="scope">
            <el-tag v-if="scope.row.hostAddress" size="mini" effect="plain">{{ scope.row.hostAddress }}</el-tag>
            <el-tag v-else size="mini" type="info" effect="plain">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template v-slot:default="scope">
            <el-tag size="mini" :type="scope.row.onLine ? 'success' : 'info'" effect="dark">
              {{ scope.row.onLine ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="currentChange"
          :current-page="currentPage"
          :page-size="count"
          :page-sizes="[10, 25, 35, 50, 200]"
          layout="total, sizes, prev, pager, next"
          :total="total">
        </el-pagination>
      </div>

      <template slot="footer">
        <el-button type="primary" @click="onSubmit">确 定</el-button>
        <el-button @click="close">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getGbDeviceList } from '@/api/dialog'

export default {
  name: "gbDeviceSelect",
  props: {},
  computed: {},
  data() {
    return {
      showDialog: false,
      deviceList: [], //设备列表
      currentDevice: {}, //当前操作设备对象
      searchSrt: "",
      online: null,
      videoComponentList: [],
      updateLooper: 0, //数据刷新轮训标志
      currentDeviceChannelsLenth: 0,
      winHeight: 580,
      currentPage: 1,
      count: 10,
      total: 0,
      getDeviceListLoading: false,
      multipleSelection: [],
    };
  },
  mounted() {
    this.initData();
  },
  methods: {
    initData: function () {
      this.getDeviceList();
    },
    currentChange: function (val) {
      this.currentPage = val;
      this.getDeviceList();
    },
    handleSizeChange: function (val) {
      this.count = val;
      this.getDeviceList();
    },
    handleSelectionChange: function (val){
      this.multipleSelection = val;
    },
    getDeviceList: function () {
      this.getDeviceListLoading = true;
      getGbDeviceList({
        page: this.currentPage,
        count: this.count,
        query: this.searchSrt,
        status: this.online,
      }).then( (res)=> {
        if (res.data.code === 0) {
          this.total = res.data.data.total;
          this.deviceList = res.data.data.list;
        }
        this.getDeviceListLoading = false;
      }).catch( (error)=> {
        console.error(error);
        this.getDeviceListLoading = false;
      });
    },
    openDialog: function (callback) {
      this.listChangeCallback = callback;
      this.showDialog = true;
    },
    onSubmit: function () {
      if (this.listChangeCallback ) {
        this.listChangeCallback(this.multipleSelection)
      }
      this.showDialog = false;
    },
    close: function () {
      this.showDialog = false;
    },

  }
};
</script>
