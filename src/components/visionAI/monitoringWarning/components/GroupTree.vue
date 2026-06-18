<template>
  <div id="MonitorGroupTree">
    <div>
      <vue-easy-tree
        class="flow-tree"
        ref="veTree"
        node-key="treeId"
        :height="effectiveTreeHeight"
        lazy
        style="padding: 0 0 2rem 0.5rem"
        :load="loadNode"
        :data="treeData"
        :props="props"
        :default-expanded-keys="['']"
        @node-click="nodeClickHandler">
        <template v-slot:default="{ node, data }">
          <span class="custom-tree-node">
            <span v-if="node.data.type === 0 && chooseId !== node.data.deviceId" style="color: #409EFF" class="iconfont icon-bianzubeifen3"></span>
            <span v-if="node.data.type === 0 && chooseId === node.data.deviceId" style="color: #c60135;" class="iconfont icon-bianzubeifen3"></span>
            <span v-if="node.data.type === 1 && node.data.status === 'ON'" style="color: #409EFF" class="iconfont icon-shexiangtou2"></span>
            <span v-if="node.data.type === 1 && node.data.status !== 'ON'" style="color: #808181" class="iconfont icon-shexiangtou2"></span>
            <span style="padding-left: 1px" v-if="node.data.deviceId !=='' && showCode" :title="node.data.deviceId">{{ node.label }}（编号：{{ node.data.deviceId }}）</span>
            <span style="padding-left: 1px" v-if="node.data.deviceId ==='' || !showCode" :title="node.data.deviceId">{{ node.label }}</span>
          </span>
        </template>
      </vue-easy-tree>
    </div>
  </div>
</template>

<script>
import VueEasyTree from "@wchbrad/vue-easy-tree";
import { realtimeMonitorAPI } from '../../../service/VisionAIService.js';

export default {
  name: 'MonitorGroupTree',
  components: { VueEasyTree },
  props: ['clickEvent', 'hasChannel', 'treeHeight'],
  data() {
    return {
      props: { label: "name", id: "treeId" },
      showCode: false,
      searchSrt: "",
      chooseId: "",
      treeData: [],
    };
  },
  computed: {
    effectiveTreeHeight() {
      if (this.treeHeight === 'auto') return undefined;
      return this.treeHeight || '78vh';
    }
  },
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
          const response = await realtimeMonitorAPI.getGroupTree({
            query: this.searchSrt,
            parent: node.data.id,
            hasChannel: this.hasChannel
          });
          resolve((response.data && response.data.data) || []);
        }
      } catch (error) {
        console.error('加载业务分组树失败:', error);
        this.$message.error('加载业务分组树失败');
        resolve([]);
      }
    },
    reset() {
      this.$forceUpdate();
    },
    refreshNode(node) {
      node.loaded = false;
      node.expand();
    },
    refresh(id) {
      const node = this.$refs.veTree.getNode(id);
      if (node) {
        node.loaded = false;
        node.expand();
      }
    },
    nodeClickHandler(data) {
      this.chooseId = data.deviceId;
      if (this.clickEvent) this.clickEvent(data);
    }
  },
};
</script>

<style scoped>
.custom-tree-node .el-radio__label {
  padding-left: 4px !important;
}
</style>
