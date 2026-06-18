<template>
  <div id="MonitorRegionTree">
    <div>
      <vue-easy-tree
        class="flow-tree"
        ref="veTree"
        node-key="treeId"
        :height="effectiveTreeHeight"
        :indent="16"
        lazy
        style="padding: 0 0 2rem 16px"
        :load="loadNode"
        :data="treeData"
        :props="props"
        :default-expanded-keys="['']"
        @node-click="nodeClickHandler">
        <template class="custom-tree-node" v-slot:default="{ node, data }">
        <span class="custom-tree-node" >
          <i
            v-if="node.data.type === 0"
            class="el-icon-caret-right tree-arrow"
            :class="{ expanded: node.expanded }"
            @click.stop="toggleNode(node)"
          ></i>
          <span v-else class="tree-arrow-space"></span>
          <span v-if="node.data.deviceId !=='' && showCode" :title="node.data.deviceId">{{ node.label }}（编号：{{ node.data.deviceId }}）</span>
          <span v-if="node.data.deviceId ==='' || !showCode" :title="node.data.deviceId">{{ node.label }}</span>
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
  name: 'MonitorRegionTree',
  components: { VueEasyTree },
  props: ['clickEvent', 'hasChannel', 'treeHeight'],
  data() {
    return {
      props: {
        label: "name",
        isLeaf: "leaf"
      },
      showCode: false,
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
            leaf: false,
            type: 0
          }]);
        } else if (String(node.data.deviceId != null ? node.data.deviceId : '').length <= 8) {
          if (node.data.leaf) {
            resolve([]);
            return;
          }
          const response = await realtimeMonitorAPI.getRegionTree({
            parent: node.data.id,
            hasChannel: this.hasChannel
          });
          resolve((response.data && response.data.data) || []);
        } else {
          resolve([]);
        }
      } catch (error) {
        console.error('加载区划树失败:', error);
        this.$message.error('加载区划树失败');
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
      if (this.clickEvent) {
        this.clickEvent(data);
      }
    },
    toggleNode: function (node) {
      if (!node) return;
      if (node.expanded && typeof node.collapse === "function") {
        node.collapse();
        return;
      }
      if (!node.expanded && typeof node.expand === "function") {
        node.expand();
      }
    }
  },
};
</script>

<style scoped>
/deep/ .el-tree-node__expand-icon {
  display: none !important;
}

.tree-arrow,
.tree-arrow-space {
  width: 12px;
  min-width: 12px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 16px;
}

.tree-arrow {
  cursor: pointer;
  color: rgba(51, 51, 51, 0.8);
  font-size: 14px;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
}

.custom-tree-node .el-radio__label {
  padding-left: 4px !important;
}
</style>
