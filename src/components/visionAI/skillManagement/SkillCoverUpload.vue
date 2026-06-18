<template>
  <el-form-item :label="label">
    <div class="skill-cover-upload">
      <el-upload
        class="cover-uploader"
        action="#"
        :show-file-list="false"
        :auto-upload="false"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        :on-change="onChange">
        <div v-if="previewUrl" class="cover-preview">
          <img :src="previewUrl" class="cover-img" alt="技能封面" />
          <div class="cover-overlay">
            <i class="el-icon-camera"></i>
            <span>更换封面</span>
          </div>
        </div>
        <div v-else class="cover-placeholder">
          <i class="el-icon-plus"></i>
          <span>上传封面</span>
        </div>
      </el-upload>
      <div class="cover-tip">{{ tip }}</div>
    </div>
  </el-form-item>
</template>

<script>
export default {
  name: 'SkillCoverUpload',
  props: {
    previewUrl: { type: String, default: '' },
    label: { type: String, default: '技能封面' },
    tip: { type: String, default: '支持 JPG、PNG、WEBP，建议 16:9，单张不超过 5MB' },
    maxSizeMb: { type: Number, default: 5 },
    acceptTypes: {
      type: Array,
      default: () => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }
  },
  methods: {
    onChange(file) {
      const raw = file && file.raw
      if (!raw) return
      if (!this.acceptTypes.includes(raw.type)) {
        this.$message.error('图片格式不支持，请重新选择')
        return
      }
      if (raw.size > this.maxSizeMb * 1024 * 1024) {
        this.$message.error(`图片大小不能超过 ${this.maxSizeMb}MB`)
        return
      }
      this.$emit('change', raw)
    }
  }
}
</script>

<style scoped>
.skill-cover-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cover-uploader >>> .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  width: 200px;
  height: 112px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.cover-uploader >>> .el-upload:hover {
  border-color: #409eff;
}
.cover-preview {
  position: relative;
  width: 200px;
  height: 112px;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}
.cover-preview:hover .cover-overlay {
  opacity: 1;
}
.cover-overlay i {
  font-size: 18px;
  margin-bottom: 4px;
}
.cover-placeholder {
  width: 200px;
  height: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  font-size: 12px;
  gap: 6px;
}
.cover-placeholder i {
  font-size: 22px;
}
.cover-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
