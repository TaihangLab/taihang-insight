<template>
  <div id="gbChannelSelect" v-loading="getChannelListLoading">
    <el-dialog
      title="添加国标通道"
      width="1000px"
      top="10vh"
      :close-on-click-modal="false"
      :visible.sync="showDialog"
      :destroy-on-close="true"
      append-to-body
      @close="close()"
    >
      <div class="page-header" style="margin-bottom: 16px;">
        <div class="page-header-btn" style="text-align: left; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span>搜索:</span>
          <el-input @input="getChannelList" style="width: 180px;" size="small" placeholder="关键字"
                    prefix-icon="el-icon-search" v-model="searchSrt" clearable></el-input>
          <span style="margin-left: 10px;">状态:</span>
          <el-select size="small" style="width: 100px;" @change="getChannelList" v-model="online" placeholder="请选择">
            <el-option label="全部" value=""></el-option>
            <el-option label="在线" value="true"></el-option>
            <el-option label="离线" value="false"></el-option>
          </el-select>
          <span style="margin-left: 10px;">类型:</span>
          <el-select size="small" style="width: 120px;" @change="getChannelList" v-model="channelType" placeholder="请选择">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="item in Object.values($channelTypeList)" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
          <el-button size="small" icon="el-icon-refresh" :loading="getChannelListLoading"
                     @click="getChannelList()">刷新</el-button>
        </div>
      </div>
      <!--通道列表-->
      <el-table size="small" ref="channelListTable" :data="channelList" :height="winHeight" style="width: 100%;"
                header-row-class-name="table-header" @selection-change="handleSelectionChange" >
        <el-table-column type="selection" width="55" >
        </el-table-column>
        <el-table-column prop="gbName" label="名称" min-width="180" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="gbDeviceId" label="编号" min-width="180" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="gbManufacturer" label="厂家" min-width="120" show-overflow-tooltip>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template v-slot:default="scope">
            <el-tag size="mini" effect="plain" type="success" :style="$channelTypeList[scope.row.dataType].style" >{{$channelTypeList[scope.row.dataType].name}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template v-slot:default="scope">
            <el-tag size="mini" :type="scope.row.gbStatus === 'ON' ? 'success' : 'info'" effect="dark">
              {{ scope.row.gbStatus === 'ON' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #909399; font-size: 13px;">
          <i class="el-icon-info"></i> 未找到通道？请在国标设备管理中同步通道
        </div>
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
import { getChannelByCivilCode, getChannelByParent } from '@/api/dialog'

export default {
  name: "gbChannelSelect",
  props: ['dataType', "selected"],
  computed: {},
  data() {
    return {
      showDialog: false,
      channelList: [], //设备列表
      currentDevice: {}, //当前操作设备对象
      searchSrt: "",
      online: null,
      channelType: "",
      videoComponentList: [],
      updateLooper: 0, //数据刷新轮训标志
      currentDeviceChannelsLenth: 0,
      winHeight: 580,
      currentPage: 1,
      count: 10,
      total: 0,
      getChannelListLoading: false,
      multipleSelection: [],
    };
  },
  methods: {
    initData: function () {
      this.getChannelList();
    },
    currentChange: function (val) {
      this.currentPage = val;
      this.getChannelList();
    },
    handleSizeChange: function (val) {
      this.count = val;
      this.getChannelList();
    },
    handleSelectionChange: function (val){
      this.multipleSelection = val;
    },
    getChannelList: function () {
      this.getChannelListLoading = true;
      const params = {
        page: this.currentPage,
        count: this.count,
        channelType: this.channelType,
        query: this.searchSrt,
        online: this.online,
      }
      
      const apiCall = this.dataType === "civilCode" 
        ? getChannelByCivilCode(params)
        : getChannelByParent(params)
      
      apiCall.then( (res)=> {
        if (res.data.code === 0) {
          this.total = res.data.data.total;
          this.channelList = res.data.data.list;
        }
        this.getChannelListLoading = false;
      }).catch( (error)=> {
        console.error(error);
        this.getChannelListLoading = false;
      });
    },
    openDialog: function (callback) {
      this.listChangeCallback = callback;
      this.showDialog = true;
      this.initData();
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
