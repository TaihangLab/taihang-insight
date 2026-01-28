<template>
  <div id="MonitorGroupTree">
    <div>
      <vue-easy-tree
        class="flow-tree"
        ref="veTree"
        node-key="treeId"
        :height="treeHeight?treeHeight:'78vh'"
        lazy
        style="padding: 0 0 2rem 0.5rem"
        :load="loadNode"
        :data="treeData"
        :props="props"
        :default-expanded-keys="['']"
        @node-click="nodeClickHandler"
      >
        <template v-slot:default="{ node, data }">
          <span class="custom-tree-node">
            <span v-if="node.data.type === 0 && chooseId !== node.data.deviceId" style="color: #409EFF" class="iconfont icon-bianzubeifen3"></span>
            <span v-if="node.data.type === 0 && chooseId === node.data.deviceId" style="color: #c60135;" class="iconfont icon-bianzubeifen3"></span>
            <span v-if="node.data.type === 1 && node.data.status === 'ON'" style="color: #409EFF" class="iconfont icon-shexiangtou2"></span>
            <span v-if="node.data.type === 1 && node.data.status !== 'ON'" style="color: #808181" class="iconfont icon-shexiangtou2"></span>
            <span style=" padding-left: 1px" v-if="node.data.deviceId !=='' && showCode" :title="node.data.deviceId">{{ node.label }}（编号：{{ node.data.deviceId }}）</span>
            <span style=" padding-left: 1px" v-if="node.data.deviceId ==='' || !showCode" :title="node.data.deviceId">{{ node.label }}</span>
          </span>
        </template>
      </vue-easy-tree>
    </div>
  </div>
</template>

<script>
import VueEasyTree from "@wchbrad/vue-easy-tree";
import centerAPI from '@/api/center';

export default {
  name: 'MonitorGroupTree',
  components: {
    VueEasyTree
  },
  data() {
    return {
      props: {
        label: "name",
        id: "treeId"
      },
      showCode: false,
      searchSrt: "",
      chooseId: "",
      treeData: [],
    }
  },
  props: ['clickEvent', 'hasChannel', 'treeHeight'],
  methods: {
    loadNode: async function (node, resolve) {
      try {
        if (node.level === 0) {
          resolve([{
            treeId: "",
            deviceId: "",
            name: "根资源组",
            isLeaf: false,
            type: 0
          }]);
        } else {
          if (node.data.leaf) {
            resolve([]);
            return;
          }
          
          // 使用专用的实时监控API
          const response = await centerAPI.realtimeMonitor.getGroupTree({
            query: this.searchSrt,
            parent: node.data.id,
            hasChannel: this.hasChannel
          });
          
          // 解包后端响应: response.data = {code: 0, msg: "成功", data: [...]}
          const treeData = (response.data && response.data.data) || [];
          resolve(treeData);
        }
      } catch (error) {
        console.error('加载业务分组树失败:', error);
        this.$message.error('加载业务分组树失败');
        resolve([]);
      }
    },
    reset: function () {
      this.$forceUpdate();
    },
    refreshNode: function (node) {
      node.loaded = false;
      node.expand();
    },
    refresh: function (id) {
      let node = this.$refs.veTree.getNode(id);
      if (node) {
        node.loaded = false;
        node.expand();
      }
    },
    nodeClickHandler: function (data, node, tree) {
      this.chooseId = data.deviceId;
      if (this.clickEvent) {
        this.clickEvent(data);
      }
    }
  },
}
</script>

<style scoped>
.custom-tree-node .el-radio__label {
  padding-left: 4px !important;
}
</style>

