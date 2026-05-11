<template>
	<div class="media-server-manager management-page-container">
		<!-- 节点统计卡片 -->
		<div class="management-stats-cards">
			<div class="management-stat-card">
				<div class="stat-content">
					<div class="stat-icon online">
						<i class="el-icon-monitor"></i>
					</div>
					<div class="stat-info">
						<div class="stat-number">{{ stats.online }}</div>
						<div class="stat-label">在线节点</div>
					</div>
				</div>
			</div>
			<div class="management-stat-card">
				<div class="stat-content">
					<div class="stat-icon offline">
						<i class="el-icon-warning-outline"></i>
					</div>
					<div class="stat-info">
						<div class="stat-number">{{ stats.offline }}</div>
						<div class="stat-label">离线节点</div>
					</div>
				</div>
			</div>
			<div class="management-stat-card">
				<div class="stat-content">
					<div class="stat-icon total">
						<i class="el-icon-office-building"></i>
					</div>
					<div class="stat-info">
						<div class="stat-number">{{ stats.total }}</div>
						<div class="stat-label">节点总数</div>
					</div>
				</div>
			</div>
			<div class="management-stat-card">
				<div class="stat-content">
					<div class="stat-icon default">
						<i class="el-icon-star-off"></i>
					</div>
					<div class="stat-info">
						<div class="stat-number">{{ stats.default }}</div>
						<div class="stat-label">默认节点</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 节点列表 -->
		<el-card class="server-list-card management-table-card" shadow="never">
			<div slot="header" class="card-header">
				<div class="header-left-group">
					<span class="card-title">节点列表</span>
				</div>
				<div class="card-actions">
					<el-button type="primary" size="mini" icon="el-icon-plus" @click="add">添加节点</el-button>
					<el-button type="success" size="mini" icon="el-icon-refresh" @click="initData">刷新</el-button>
				</div>
			</div>

			<div class="server-grid" v-loading="loading" element-loading-text="加载节点列表中...">
				<el-card 
					v-for="item in mediaServerList" 
					:key="item.id"
					shadow="hover" 
					:body-style="{ padding: '0px'}" 
					class="server-card">
					
					<!-- 节点类型图标 -->
					<div class="server-type-section">
						<div v-if="item.type === 'zlm'" class="card-img-zlm"></div>
						<div v-if="item.type === 'abl'" class="card-img-abl"></div>
					</div>
					
					<!-- 节点信息 -->
					<div class="server-info">
						<div class="server-header">
							<h4 class="server-name">{{ item.id }}</h4>
							<div class="server-actions">
								<el-button 
									v-if="!item.defaultServer" 
									icon="el-icon-edit" 
									size="mini"
									type="text" 
									@click="edit(item)">编辑</el-button>
								<el-button 
									v-if="item.defaultServer" 
									icon="el-icon-view" 
									size="mini"
									type="text" 
									@click="edit(item)">查看</el-button>
								<el-button 
									v-if="!item.defaultServer" 
									icon="el-icon-delete" 
									size="mini"
									type="text" 
									@click="del(item)">移除</el-button>
							</div>
						</div>
						
						<div class="server-details">
							<div class="detail-row">
								<span class="detail-label">IP地址:</span>
								<span class="detail-value">{{ item.ip }}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">创建时间:</span>
								<span class="detail-value">{{ item.createTime }}</span>
							</div>
						</div>
					</div>
					
					<!-- 状态标识 -->
					<div class="server-badges">
						<el-badge 
							v-if="item.status" 
							value="在线" 
							class="status-badge online" 
							type="success">
						</el-badge>
						<el-badge 
							v-if="!item.status" 
							value="离线" 
							class="status-badge offline" 
							type="info">
						</el-badge>
						<el-badge 
							v-if="item.defaultServer" 
							value="默认" 
							class="default-badge" 
							type="warning">
						</el-badge>
					</div>
				</el-card>
				
				<!-- 空状态 -->
				<div v-if="!loading && mediaServerList.length === 0" class="empty-state">
					<div class="empty-icon">
						<i class="el-icon-box"></i>
					</div>
					<div class="empty-text">暂无节点数据</div>
					<el-button type="primary" icon="el-icon-plus" @click="add">添加第一个节点</el-button>
				</div>
			</div>

			<!-- 分页 -->
			<div class="pagination-container">
				<el-pagination
					background
					@size-change="handleSizeChange"
					@current-change="currentChange"
					:current-page.sync="currentPage"
					:page-size="count"
					:page-sizes="[15, 25, 35, 50]"
					layout="total, sizes, prev, pager, next"
					:total="total">
				</el-pagination>
			</div>
		</el-card>

		<!-- 编辑弹窗 -->
		<mediaServerEdit ref="mediaServerEdit"></mediaServerEdit>
	</div>
</template>

<script>
import Vue from 'vue'
import MediaServer from './service/MediaServer'
import mediaServerEdit from './dialogs/MediaServerEdit'

export default {
	name: 'MediaServerManager',
	components: {
		mediaServerEdit
	},
	data() {
		return {
			mediaServerObj: new MediaServer(),
			mediaServerList: [], //设备列表
			winHeight: window.innerHeight - 200,
			updateLooper: false,
			currentPage: 1,
			count: 15,
			num: this.getNumberByWidth(),
			total: 0,
			loading: false, // 添加loading状态
		};
	},
	computed: {
		Vue() {
			return Vue
		},
		stats() {
			return {
				online: this.mediaServerList.filter(item => item.status).length,
				offline: this.mediaServerList.filter(item => !item.status).length,
				total: this.total,
				default: this.mediaServerList.filter(item => item.defaultServer).length
			};
		}
	},
	mounted() {
		this.initData();
		// 延长刷新间隔至 5 秒，减少网络开销
		this.updateLooper = setInterval(this.getServerListSilently, 5000);
	},
	destroyed() {
		if (this.updateLooper) {
			clearInterval(this.updateLooper);
		}
	},
	methods: {
		initData: function() {
			this.getServerList()
		},
		currentChange: function(val){
			this.currentPage = val;
			this.getServerList();
		},
		handleSizeChange: function(val){
			this.count = val;
			this.getServerList();
		},
		/**
		 * 静默刷新列表，不显示全局 Loading
		 */
		getServerListSilently: function() {
			const params = {
				page: this.currentPage,
				count: this.count
			};
			this.mediaServerObj.getMediaServerList(params, (data) => {
				if (data && data.list) {
					this.mediaServerList = data.list;
					this.total = data.total;
				} else if (Array.isArray(data)) {
					this.mediaServerList = data;
					this.total = data.length;
				}
			}).catch(err => {
				console.warn("静默刷新节点列表失败:", err);
			});
		},
		getServerList: function(){
			// 如果已经在加载中，则不再重复触发
			if (this.loading) return;
			
			this.loading = true;
			
			const params = {
				page: this.currentPage,
				count: this.count
			};
			
			this.mediaServerObj.getMediaServerList(params, (data)=>{
				if (data && data.list) {
					this.mediaServerList = data.list;
					this.total = data.total;
				} else if (Array.isArray(data)) {
					// 兼容非分页返回格式
					this.mediaServerList = data;
					this.total = data.length;
				} else {
					this.mediaServerList = [];
					this.total = 0;
				}
			}).catch((err) => {
				this.$message.error(err.message || "获取节点列表失败");
				this.mediaServerList = [];
				this.total = 0;
			}).finally(() => {
				this.loading = false;
			});
		},
		add: function (){
			this.$refs.mediaServerEdit.openDialog(null, this.initData)
		},
		edit: function (row){
			this.$refs.mediaServerEdit.openDialog(row, this.initData)
		},
		del: function (row){
			this.$confirm('确认删除此节点？', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.mediaServerObj.delete(row.id, (data)=>{
					if (data.code === 0) {
						this.$message({
							type: 'success',
							message: '删除成功!'
						});
						this.initData();
					}
				})

			}).catch(() => {
			});
		},
		getNumberByWidth(){
			let candidateNums = [1, 2, 3, 4, 6, 8, 12, 24]
			let clientWidth = window.innerWidth - 30;
			let interval = 20;
			let itemWidth = 360;
			let num = (clientWidth + interval)/(itemWidth + interval)
			let result = Math.ceil(24/num);
			let resultVal = 24;
			for (let i = 0; i < candidateNums.length; i++) {
				let value = candidateNums[i]
				if (i + 1 >= candidateNums.length) {
					return  24;
				}
				if (value <= result && candidateNums[i + 1] > result ) {
					return  value;
				}
			}

			return resultVal;
		},
		dateFormat: function(/** timestamp=0 **/) {
			var ts = arguments[0] || 0;
			var t,y,m,d,h,i,s;
			t = ts ? new Date(ts*1000) : new Date();
			y = t.getFullYear();
			m = t.getMonth()+1;
			d = t.getDate();
			h = t.getHours();
			i = t.getMinutes();
			s = t.getSeconds();
			// 可根据需要在这里定义时间格式
			return y+'-'+(m<10?'0'+m:m)+'-'+(d<10?'0'+d:d)+' '+(h<10?'0'+h:h)+':'+(i<10?'0'+i:i)+':'+(s<10?'0'+s:s);
		}

	}
};
</script>

<style scoped>
/* 页面主容器 */
.media-server-manager {
	height: auto;
	min-height: auto;
	padding: 0;
	background: transparent;
	display: flex;
	flex-direction: column;
}

/* 列表卡片布局优化 */
.management-table-card {
	flex: none;
}

.management-table-card >>> .el-card__body {
	padding: 20px !important;
}

/* 头部样式由 common-style.css 统一处理 */

/* 空状态样式优化 */
.empty-state {
	padding: 80px 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fff;
	border-radius: 8px;
}

.empty-icon {
	font-size: 80px;
	color: #E4E7ED;
	margin-bottom: 20px;
}

.empty-text {
	font-size: 16px;
	color: #909399;
	margin-bottom: 30px;
}

.empty-state .el-button--primary {
	padding: 12px 30px;
	font-size: 14px;
	border-radius: 8px;
}

/* 分页容器 */
.pagination-container {
	margin-top: 24px;
	display: flex;
	justify-content: flex-end;
}
</style>
