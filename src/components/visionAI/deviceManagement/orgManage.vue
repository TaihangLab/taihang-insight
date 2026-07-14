<template>
  <div class="asset-page org-manage-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--org">
            <i class="el-icon-office-building" />
          </div>
          <h2 class="asset-page-title">组织管理</h2>
        </div>
        <p class="asset-page-desc">维护设备与点位的组织归属，实时监控左侧组织树与此处同步</p>
      </div>
      <div class="asset-page-header__actions">
        <el-button type="primary" icon="el-icon-plus" size="small" :disabled="!selectedOrgId" @click="openCreate">
          新建子组织
        </el-button>
        <el-button icon="el-icon-edit" size="small" :disabled="!selectedOrgId" @click="openEdit">编辑</el-button>
        <el-button
          type="danger"
          icon="el-icon-delete"
          size="small"
          plain
          :disabled="!selectedOrgId || selectedOrgId === 'org-root'"
          @click="handleDelete"
        >
          删除
        </el-button>
      </div>
    </div>

    <div class="asset-layout">
      <aside class="asset-sidebar">
        <div class="asset-sidebar__head">
          <span><i class="el-icon-s-grid" />组织列表</span>
          <el-button type="text" icon="el-icon-refresh" class="refresh-btn" @click="loadTree" />
        </div>
        <div class="asset-sidebar__body">
          <div v-if="!orgTree.length" v-loading="treeLoading" class="asset-sidebar__empty">
            <template v-if="!treeLoading">
              <i class="el-icon-office-building" />
              暂无组织数据
            </template>
          </div>
          <el-tree
            v-else
            :data="orgTree"
            node-key="id"
            :props="{ label: 'title', children: 'children' }"
            highlight-current
            default-expand-all
            @node-click="onSelectOrg"
          />
        </div>
      </aside>

      <main class="asset-detail-panel">
        <div v-if="orgDetail" class="asset-detail-card">
          <div class="detail-card-head">
            <div class="detail-avatar">
              <i class="el-icon-folder-opened" />
            </div>
            <div>
              <h3 class="detail-name">{{ orgDetail.name }}</h3>
              <p class="detail-id">ID: {{ orgDetail.id }}</p>
            </div>
          </div>
          <el-descriptions :column="2" border size="medium" class="detail-desc">
            <el-descriptions-item label="组织名称">{{ orgDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="上级组织">{{ orgDetail.parentName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="组织 ID">{{ orgDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ orgDetail.createdAt || '-' }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ orgDetail.description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="asset-empty-wrap">
          <asset-empty-state
            icon="el-icon-office-building"
            title="请选择组织"
            description="从左侧组织树选择节点，查看详情或新建子组织"
          />
        </div>
      </main>
    </div>

    <el-dialog
      :title="dialogMode === 'create' ? '新建组织' : '编辑组织'"
      :visible.sync="dialogVisible"
      width="480px"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="组织名称" required>
          <el-input v-model="form.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="上级组织" required>
          <el-select v-model="form.parentId" placeholder="请选择上级组织" style="width:100%">
            <el-option v-for="o in parentOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import './asset-page.css';
import { assetAPI } from '../../service/AssetService.js';
import AssetEmptyState from './AssetEmptyState.vue';

export default {
  name: 'OrgManage',
  components: { AssetEmptyState },
  data() {
    return {
      treeLoading: false,
      submitting: false,
      orgTree: [],
      selectedOrgId: '',
      orgDetail: null,
      dialogVisible: false,
      dialogMode: 'create',
      parentOptions: [],
      form: {
        name: '',
        parentId: 'org-root',
        description: '',
      },
    };
  },
  mounted() {
    this.loadTree();
  },
  methods: {
    async loadTree() {
      this.treeLoading = true;
      try {
        const orgs = await assetAPI.fetchOrganizations();
        this.orgTree = Array.isArray(orgs) ? orgs : [];
        if (!this.selectedOrgId && this.orgTree[0]) {
          this.onSelectOrg(this.orgTree[0]);
        } else if (this.selectedOrgId) {
          await this.loadDetail(this.selectedOrgId);
        }
      } catch (e) {
        this.$message.error(e.message || '加载组织树失败');
      } finally {
        this.treeLoading = false;
      }
    },
    async onSelectOrg(node) {
      this.selectedOrgId = node.id || node.key;
      await this.loadDetail(this.selectedOrgId);
    },
    async loadDetail(orgId) {
      try {
        this.orgDetail = await assetAPI.fetchOrganizationDetail(orgId);
      } catch (e) {
        this.orgDetail = null;
      }
    },
    async loadParentOptions(excludeId) {
      try {
        this.parentOptions = await assetAPI.fetchOrganizationParentOptions(excludeId);
      } catch (e) {
        this.parentOptions = [];
      }
    },
    openCreate() {
      this.dialogMode = 'create';
      this.form = {
        name: '',
        parentId: this.selectedOrgId || 'org-root',
        description: '',
      };
      this.loadParentOptions();
      this.dialogVisible = true;
    },
    openEdit() {
      if (!this.orgDetail) return;
      this.dialogMode = 'edit';
      this.form = {
        name: this.orgDetail.name,
        parentId: this.orgDetail.parentId || 'org-root',
        description: this.orgDetail.description === '-' ? '' : (this.orgDetail.description || ''),
      };
      this.loadParentOptions(this.orgDetail.id);
      this.dialogVisible = true;
    },
    async submitForm() {
      if (!this.form.name.trim()) {
        this.$message.warning('请填写组织名称');
        return;
      }
      this.submitting = true;
      try {
        if (this.dialogMode === 'create') {
          await assetAPI.createOrganization({
            name: this.form.name.trim(),
            parentId: this.form.parentId,
            description: this.form.description,
          });
          this.$message.success('组织已创建');
        } else {
          await assetAPI.updateOrganization(this.selectedOrgId, {
            name: this.form.name.trim(),
            description: this.form.description,
          });
          this.$message.success('组织已更新');
        }
        this.dialogVisible = false;
        await this.loadTree();
      } catch (e) {
        this.$message.error(e.message || '保存失败');
      } finally {
        this.submitting = false;
      }
    },
    handleDelete() {
      this.$confirm(`确定删除组织「${this.orgDetail && this.orgDetail.name}」？`, '提示', { type: 'warning' })
        .then(async () => {
          await assetAPI.deleteOrganization(this.selectedOrgId);
          this.$message.success('已删除');
          this.selectedOrgId = '';
          this.orgDetail = null;
          await this.loadTree();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.refresh-btn {
  padding: 0;
  font-size: 16px;
}

.detail-card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.detail-avatar {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.25);
}

.detail-name {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-id {
  margin: 0;
  font-size: 12px;
  color: #909399;
  font-family: Consolas, Monaco, monospace;
}

.detail-desc {
  margin-top: 8px;
}
</style>
