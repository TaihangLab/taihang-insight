<template>
  <div id="MonitorRegionTree">
    <div>
      <vue-easy-tree
        class="flow-tree"
        ref="veTree"
        node-key="treeId"
        :height="treeHeight?treeHeight:'78vh'"
        :indent="16"
        lazy
        style="padding: 0 0 2rem 16px"
        :load="loadNode"
        :data="treeData"
        :props="props"
        :default-expanded-keys="['']"
        @node-click="nodeClickHandler"
      >
        <template class="custom-tree-node" v-slot:default="{ node, data }">
        <span class="custom-tree-node" >
          <i
            v-if="node.data.type === 0"
            class="el-icon-caret-right tree-arrow"
            :class="{ expanded: node.expanded }"
            @click.stop="toggleNode(node)"
          ></i>
          <span v-else class="tree-arrow-space"></span>
          <!-- 移除了摄像头的 iconfont 标签，仅保留文字 -->
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
  components: {
    VueEasyTree
  },
  data() {
    return {
      props: {
        label: "name",
        isLeaf: "leaf"
      },
      showCode: false,
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
            leaf: false,
            type: 0
          }]);
        } else if (node.data.deviceId.length <= 8) {
          if (node.data.leaf) {
            resolve([]);
            return;
          }
          
          // 使用专用的实时监控API
          // 注意：RegionController没有query参数
          const response = await realtimeMonitorAPI.getRegionTree({
            parent: node.data.id,
            hasChannel: this.hasChannel
          });
          
          // 解包后端响应: response.data = {code: 0, msg: "成功", data: [...]}
          const treeData = (response.data && response.data.data) || [];
          resolve(treeData);
        } else {
          resolve([]);
        }
      } catch (error) {
        console.error('加载区划树失败:', error);
        this.$message.error('加载区划树失败');
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
}
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

