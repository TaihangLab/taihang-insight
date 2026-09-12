<template>
  <div ref="container" class="zlm-rtc-player">
    <video
      ref="videoEl"
      class="zlm-rtc-video"
      autoplay
      muted
      playsinline
      @dblclick="toggleFullscreen"
    />
    <div v-if="!playing && videoUrl" class="zlm-rtc-loading">
      <i class="el-icon-loading"></i>
      <span>正在拉流...</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'zlmRtcPlayer',
  props: {
    videoUrl: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      playing: false,
      retryTimer: null,
      retryCount: 0,
      sessionId: 0,
      watchdog: null
    }
  },
  watch: {
    videoUrl: {
      handler(val) {
        this.$nextTick(() => this.play(val))
      },
      immediate: true
    }
  },
  beforeDestroy() {
    this.close()
  },
  methods: {
    play(url) {
      const sid = ++this.sessionId
      this.teardown()
      if (!url) return
      const ZLMRTCClient = window.ZLMRTCClient
      if (!ZLMRTCClient || !ZLMRTCClient.Endpoint) {
        this.$emit('error', { reason: 'ZLMRTCClient missing' })
        return
      }
      const videoEl = this.$refs.videoEl
      if (!videoEl) {
        this.$nextTick(() => {
          if (sid === this.sessionId) this.play(url)
        })
        return
      }
      videoEl.muted = true
      videoEl.playsInline = true
      this.endpoint = new ZLMRTCClient.Endpoint({
        element: videoEl,
        debug: false,
        zlmsdpUrl: url,
        simulcast: false,
        useCamera: false,
        audioEnable: true,
        videoEnable: true,
        recvOnly: true,
        usedatachannel: false
      })
      this.bindEvents(url, sid)
      this.watchdog = setTimeout(() => {
        if (sid !== this.sessionId) return
        if (!this.playing) this.$emit('error', { reason: 'timeout' })
      }, 8000)
    },
    bindEvents(url, sid) {
      const Events = window.ZLMRTCClient.Events
      this.endpoint.on(Events.WEBRTC_ON_REMOTE_STREAMS, () => {
        if (sid !== this.sessionId) return
        this.retryCount = 0
        this.playing = true
        const videoEl = this.$refs.videoEl
        if (videoEl && videoEl.play) {
          const playPromise = videoEl.play()
          if (playPromise && playPromise.catch) playPromise.catch(() => {})
        }
      })
      this.endpoint.on(Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, (e) => {
        if (sid !== this.sessionId) return
        const msg = (e && e.msg) || ''
        if (e && e.code === -400 && /流不存在/.test(msg) && this.retryCount < 2) {
          this.retryCount += 1
          this.retryTimer = setTimeout(() => {
            if (sid === this.sessionId) this.play(url)
          }, 400)
          return
        }
        this.$emit('error', { reason: 'offer-answer', detail: e })
      })
      this.endpoint.on(Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state) => {
        if (sid !== this.sessionId) return
        if (state === 'failed') {
          this.$emit('error', { reason: 'ice-failed' })
        }
      })
      const pc = this.endpoint.pc
      if (pc && pc.addEventListener) {
        pc.addEventListener('iceconnectionstatechange', () => {
          if (sid !== this.sessionId) return
          if (pc.iceConnectionState === 'failed') {
            this.$emit('error', { reason: 'ice-failed' })
          }
        })
      }
    },
    teardown() {
      this.playing = false
      if (this.watchdog) {
        clearTimeout(this.watchdog)
        this.watchdog = null
      }
      if (this.retryTimer) {
        clearTimeout(this.retryTimer)
        this.retryTimer = null
      }
      if (this.endpoint) {
        try {
          this.endpoint.close()
        } catch (e) {}
        this.endpoint = null
      }
      const videoEl = this.$refs.videoEl
      if (videoEl) {
        videoEl.srcObject = null
      }
    },
    close() {
      this.sessionId += 1
      this.teardown()
    },
    screenshot() {
      const videoEl = this.$refs.videoEl
      if (!videoEl || !videoEl.videoWidth) return
      const canvas = document.createElement('canvas')
      canvas.width = videoEl.videoWidth
      canvas.height = videoEl.videoHeight
      canvas.getContext('2d').drawImage(videoEl, 0, 0)
      this.$emit('screenshot', canvas.toDataURL('image/png'))
    },
    toggleFullscreen() {
      const el = this.$refs.container
      if (!el) return
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else if (el.requestFullscreen) {
        el.requestFullscreen()
      }
    }
  }
}
</script>

<style scoped>
.zlm-rtc-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}
.zlm-rtc-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.zlm-rtc-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
  z-index: 2;
}
.zlm-rtc-loading i {
  font-size: 32px;
}
.zlm-rtc-loading span {
  font-size: 13px;
}
</style>
