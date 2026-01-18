<template>
  <div class="department-tree-panel">
    <el-input
      placeholder="请输入部门名称"
      v-model="filterText"
      prefix-icon="el-icon-search"
      size="small"
      class="tree-search"
      clearable
    ></el-input>
    <el-tree
      class="department-tree"
      :data="treeData"
      :props="defaultProps"
      :filter-node-method="filterNode"
      ref="tree"
      node-key="id"
      :expand-on-click-node="false"
      :highlight-current="true"
      @node-click="handleNodeClick"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span class="tree-label">{{ node.label }}</span>
      </span>
    </el-tree>
  </div>
</template>

<script>
export default {
  name: 'DepartmentTreePanel',
  data() {
    return {
      filterText: '',
      treeData: [
        {
          id: 1,
          label: 'XXX科技',
          children: [
            {
              id: 2,
              label: '深圳总公司',
              children: [
                { id: 3, label: '研发部门' },
                { id: 4, label: '市场部门' },
                { id: 5, label: '测试部门' },
                { id: 6, label: '财务部门' },
                { id: 7, label: '运维部门' }
              ]
            },
            {
              id: 8,
              label: '长沙分公司',
              children: [
                { id: 9, label: '市场部门' },
                { id: 10, label: '财务部门' }
              ]
            }
          ]
        }
      ],
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val)
    }
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
    handleNodeClick(data) {
      this.$emit('node-click', data)
    }
  }
}
</script>

<style scoped>
.department-tree-panel {
  flex: 1;
  overflow-y: auto;
}

.tree-search {
  margin-bottom: 15px;
}

.department-tree {
  background: transparent;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.tree-label {
  margin-left: 5px;
}
</style>
