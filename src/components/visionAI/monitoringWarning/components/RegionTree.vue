<template>
  <div id="MonitorRegionTree">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :load="loadNode"
      lazy
      node-key="treeId"
      :default-expand-keys="['']"
      :expand-on-click-node="false"
      @node-click="nodeClickHandler"
      class="flow-tree"
      :style="{ height: treeHeight || '78vh', padding: '0 0 2rem 0.5rem' }"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span v-if="data.type === 0 && chooseId !== data.deviceId" style="color: #409EFF" class="iconfont icon-bianzubeifen3"></span>
          <span v-if="data.type === 0 && chooseId === data.deviceId" style="color: #c60135;" class="iconfont icon-bianzubeifen3"></span>
          <span v-if="data.type === 1 && data.status === 'ON'" style="color: #409EFF" class="iconfont icon-shexiangtou2"></span>
          <span v-if="data.type === 1 && data.status !== 'ON'" style="color: #808181" class="iconfont icon-shexiangtou2"></span>
          <span style="padding-left: 1px" v-if="data.deviceId !== '' && showCode" :title="data.deviceId">{{ data.name }}（编号：{{ data.deviceId }}）</span>
          <span style="padding-left: 1px" v-if="data.deviceId === '' || !showCode" :title="data.deviceId">{{ data.name }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import centerAPI from '@/api/center'

export default {
  name: 'MonitorRegionTree',
  data() {
    return {
      treeProps: {
        label: 'name',
        children: 'children',
        isLeaf: (data) => data.leaf || data.deviceId?.length > 8
      },
      showCode: false,
      chooseId: '',
      treeData: [{
        treeId: '',
        deviceId: '',
        name: '根资源组',
        isLeaf: false,
        type: 0
      }]
    }
  },
  props: ['clickEvent', 'hasChannel', 'treeHeight'],
  methods: {
    loadNode: async function (node, resolve) {
      try {
        // 根节点已初始化，直接返回
        if (node.level === 0) {
          return
        }

        // 如果是叶子节点，返回空数组
        if (node.data.leaf || (node.data.deviceId && node.data.deviceId.length > 8)) {
          resolve([])
          return
        }

        // 使用专用的实时监控API
        const response = await centerAPI.realtimeMonitor.getRegionTree({
          parent: node.data.id,
          hasChannel: this.hasChannel
        })

        // 解包后端响应: response.data = {code: 0, msg: "成功", data: [...]}
        const treeData = (response.data && response.data.data) || []
        resolve(treeData)
      } catch (error) {
        console.error('加载区划树失败:', error)
        ElMessage.error('加载区划树失败')
        resolve([])
      }
    },
    reset: function () {
      this.$forceUpdate()
    },
    refreshNode: function (node) {
      node.loaded = false
      node.expand()
    },
    refresh: function (id) {
      const tree = this.$refs.treeRef
      if (tree) {
        const node = tree.getNode(id)
        if (node) {
          node.loaded = false
          node.expand()
        }
      }
    },
    nodeClickHandler: function (data, node) {
      this.chooseId = data.deviceId
      if (this.clickEvent) {
        this.clickEvent(data)
      }
    }
  }
}
</script>

<style scoped>
.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
}

.flow-tree {
  background-color: transparent;
}
</style>

