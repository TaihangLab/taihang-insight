/**
 * 设备配置页表格高度：撑满主内容区剩余高度，表体内部滚动
 */
export default {
  data() {
    return {
      assetTableHeight: 240,
    };
  },
  mounted() {
    this.updateAssetTableHeight();
    this._onAssetTableResize = () => this.updateAssetTableHeight();
    window.addEventListener('resize', this._onAssetTableResize);
  },
  beforeDestroy() {
    if (this._onAssetTableResize) {
      window.removeEventListener('resize', this._onAssetTableResize);
    }
  },
  methods: {
    updateAssetTableHeight() {
      this.$nextTick(() => {
        const wrap = this.$refs.assetTableWrap;
        if (!wrap) return;
        const pag = wrap.querySelector('.asset-pagination, .pagination-wrapper');
        let pagH = 0;
        if (pag && pag.offsetParent !== null) {
          pagH = pag.offsetHeight + 16;
        }
        this.assetTableHeight = Math.max(160, wrap.clientHeight - pagH);
      });
    },
  },
};
