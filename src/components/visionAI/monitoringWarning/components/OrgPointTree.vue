<template>
  <div id="MonitorOrgPointTree">
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
      :default-expanded-keys="defaultExpandedKeys"
      @node-click="nodeClickHandler">
      <template v-slot:default="{ node, data }">
        <span class="custom-tree-node">
          <span
            v-if="node.data.type === 0 && chooseId !== node.data.id"
            style="color: #409EFF"
            class="iconfont icon-bianzubeifen3"
          />
          <span
            v-if="node.data.type === 0 && chooseId === node.data.id"
            style="color: #c60135;"
            class="iconfont icon-bianzubeifen3"
          />
          <span
            v-if="node.data.type === 1 && node.data.status === 'ON'"
            style="color: #409EFF"
            class="iconfont icon-shexiangtou2"
          />
          <span
            v-if="node.data.type === 1 && node.data.status !== 'ON'"
            style="color: #808181"
            class="iconfont icon-shexiangtou2"
          />
          <span style="padding-left: 1px" :title="node.data.name">{{ node.label }}</span>
        </span>
      </template>
    </vue-easy-tree>
  </div>
</template>

<script>
import VueEasyTree from '@wchbrad/vue-easy-tree';
import { realtimeMonitorAPI } from '../../../service/VisionAIService.js';

export default {
  name: 'OrgPointTree',
  components: { VueEasyTree },
  props: ['clickEvent', 'hasChannel', 'treeHeight'],
  data() {
    return {
      props: { label: 'name' },
      chooseId: '',
      treeData: [],
      defaultExpandedKeys: ['org-root'],
    };
  },
  computed: {
    effectiveTreeHeight() {
      if (this.treeHeight === 'auto') return undefined;
      return this.treeHeight || '78vh';
    },
  },
  methods: {
    async loadNode(node, resolve) {
      try {
        const params = { hasChannel: this.hasChannel !== false };
        if (node.level > 0 && node.data && node.data.id) {
          params.parent = node.data.id;
        }
        if (node.data && node.data.type === 1) {
          resolve([]);
          return;
        }
        if (node.data && node.data.leaf && node.data.type !== 0) {
          resolve([]);
          return;
        }
        const response = await realtimeMonitorAPI.getRegionTree(params);
        const list = (response.data && response.data.data) || [];
        resolve(list);
      } catch (error) {
        console.error('加载组织点位树失败:', error);
        this.$message.error('加载组织点位树失败');
        resolve([]);
      }
    },
    reset() {
      this.$forceUpdate();
    },
    refresh(id) {
      const node = this.$refs.veTree.getNode(id);
      if (node) {
        node.loaded = false;
        node.expand();
      }
    },
    nodeClickHandler(data) {
      this.chooseId = data.type === 0 ? data.id : data.deviceId;
      if (this.clickEvent) this.clickEvent(data);
    },
  },
};
</script>

<style scoped>
.custom-tree-node .el-radio__label {
  padding-left: 4px !important;
}
</style>
