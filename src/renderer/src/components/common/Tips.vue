<template>
  <div ref="triggerRef" class="tips-container" @mouseenter="showTips" @mouseleave="hideTips">
    <!-- 触发元素 -->
    <slot></slot>

    <!-- Tips内容 -->
    <Teleport to="body" :disabled="!useTeleport">
      <div
        v-show="isVisible"
        ref="tipsRef"
        class="tips-content"
        :class="[computedPosition, { 'tips-active': isVisible }]"
        :style="tipsStyle"
      >
        <slot name="content"></slot>
      </div>
    </Teleport>
  </div>
</template>

<script>
export default {
  name: 'Tips',
  props: {
    // 默认期望的显示位置
    position: {
      type: String,
      default: 'auto',
      validator: (value) => ['auto', 'top', 'right', 'bottom', 'left'].includes(value)
    },
    // 触发方式：hover, click
    trigger: {
      type: String,
      default: 'hover',
      validator: (value) => ['hover', 'click'].includes(value)
    },
    // 延迟显示时间（毫秒）
    delay: {
      type: Number,
      default: 0
    },
    // 是否使用传送门，可能在某些情况下需要禁用
    useTeleport: {
      type: Boolean,
      default: true
    },
    // 额外的偏移量（像素）
    offset: {
      type: Number,
      default: 12
    },
    // 是否应用自动定位
    autoPlacement: {
      type: Boolean,
      default: false
    },
    // zIndex
    zIndex: {
      type: Number,
      default: 1000
    }
  },

  data() {
    return {
      isVisible: false,
      computedPosition: this.position,
      tipsStyle: {
        zIndex: this.zIndex
      },
      showTimer: null,
      hideTimer: null
    }
  },

  methods: {
    // 显示Tips
    showTips() {
      if (this.trigger !== 'hover') return

      clearTimeout(this.hideTimer)

      if (this.delay > 0) {
        this.showTimer = setTimeout(() => {
          this.isVisible = true
          this.$nextTick(() => {
            this.updatePosition()
          })
        }, this.delay)
      } else {
        this.isVisible = true
        this.$nextTick(() => {
          this.updatePosition()
        })
      }
    },

    // 隐藏Tips
    hideTips() {
      if (this.trigger !== 'hover') return

      clearTimeout(this.showTimer)

      this.hideTimer = setTimeout(() => {
        this.isVisible = false
      }, 50)
    },

    // 切换Tips显示状态
    toggleTips() {
      if (this.trigger !== 'click') return

      this.isVisible = !this.isVisible
      if (this.isVisible) {
        this.$nextTick(() => {
          this.updatePosition()
        })
      }
    },

    // 更新位置
    updatePosition() {
      if (!this.isVisible || !this.$refs.tipsRef || !this.$refs.triggerRef) return

      const triggerEl = this.$refs.triggerRef
      const tipsEl = this.$refs.tipsRef

      // 获取触发元素的尺寸和位置
      const triggerRect = triggerEl.getBoundingClientRect()

      // 获取Tips元素的尺寸
      const tipsRect = tipsEl.getBoundingClientRect()

      // 获取视口尺寸
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // 重置Tips样式
      this.tipsStyle = {
        zIndex: this.zIndex,
        position: 'fixed'
      }

      // 如果不需要自动调整位置，直接使用指定位置
      if (!this.autoPlacement) {
        this.computedPosition = this.position === 'auto' ? 'top' : this.position
        this.updatePositionStyle(triggerRect, tipsRect)
        return
      }

      // 根据视口空间自动确定最佳显示位置
      const spaceTop = triggerRect.top
      const spaceBottom = viewportHeight - triggerRect.bottom
      const spaceLeft = triggerRect.left
      const spaceRight = viewportWidth - triggerRect.right

      // 确定主要方向
      let primaryPosition = this.position

      if (primaryPosition === 'auto') {
        // 根据可用空间自动判断位置
        const spaces = [
          { position: 'bottom', space: spaceBottom },
          { position: 'top', space: spaceTop },
          { position: 'right', space: spaceRight },
          { position: 'left', space: spaceLeft }
        ]

        // 按可用空间排序
        spaces.sort((a, b) => b.space - a.space)

        // 选择空间最大的方向
        primaryPosition = spaces[0].position
      }

      // 根据选择的方向和尺寸检查是否需要调整
      switch (primaryPosition) {
        case 'top':
          if (spaceTop < tipsRect.height && spaceBottom > tipsRect.height) {
            primaryPosition = 'bottom'
          }
          break
        case 'bottom':
          if (spaceBottom < tipsRect.height && spaceTop > tipsRect.height) {
            primaryPosition = 'top'
          }
          break
        case 'left':
          if (spaceLeft < tipsRect.width && spaceRight > tipsRect.width) {
            primaryPosition = 'right'
          }
          break
        case 'right':
          if (spaceRight < tipsRect.width && spaceLeft > tipsRect.width) {
            primaryPosition = 'left'
          }
          break
      }

      this.computedPosition = primaryPosition
      this.updatePositionStyle(triggerRect, tipsRect)
    },

    // 根据位置更新样式
    updatePositionStyle(triggerRect, tipsRect) {
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const scrollX = window.scrollX || document.documentElement.scrollLeft

      switch (this.computedPosition) {
        case 'top':
          this.tipsStyle.left = `${triggerRect.left + triggerRect.width / 2 - tipsRect.width / 2 + scrollX}px`
          this.tipsStyle.top = `${triggerRect.top - tipsRect.height - this.offset + scrollY}px`
          break
        case 'bottom':
          this.tipsStyle.left = `${triggerRect.left + triggerRect.width / 2 - tipsRect.width / 2 + scrollX}px`
          this.tipsStyle.top = `${triggerRect.bottom + this.offset + scrollY}px`
          break
        case 'left':
          this.tipsStyle.left = `${triggerRect.left - tipsRect.width - this.offset + scrollX}px`
          this.tipsStyle.top = `${triggerRect.top + triggerRect.height / 2 - tipsRect.height / 2 + scrollY}px`
          break
        case 'right':
          this.tipsStyle.left = `${triggerRect.right + this.offset + scrollX}px`
          this.tipsStyle.top = `${triggerRect.top + triggerRect.height / 2 - tipsRect.height / 2 + scrollY}px`
          break
      }
    }
  },

  mounted() {
    // 添加全局点击事件监听器（对于 click 触发模式）
    if (this.trigger === 'click') {
      this.$refs.triggerRef.addEventListener('click', this.toggleTips)
      document.addEventListener('click', (e) => {
        if (
          this.isVisible &&
          !this.$refs.tipsRef.contains(e.target) &&
          !this.$refs.triggerRef.contains(e.target)
        ) {
          this.isVisible = false
        }
      })
    }

    // 添加窗口大小变化事件监听器
    window.addEventListener('resize', this.updatePosition)
    window.addEventListener('scroll', this.updatePosition, true)
  },

  beforeUnmount() {
    // 清除计时器
    clearTimeout(this.showTimer)
    clearTimeout(this.hideTimer)

    // 移除事件监听器
    if (this.trigger === 'click' && this.$refs.triggerRef) {
      this.$refs.triggerRef.removeEventListener('click', this.toggleTips)
    }

    window.removeEventListener('resize', this.updatePosition)
    window.removeEventListener('scroll', this.updatePosition, true)
  }
}
</script>

<style scoped>
.tips-container {
  width: fit-content;
  display: inline-block;
  position: relative;
}

.tips-content {
  position: fixed;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: auto;
  pointer-events: none;
}

.tips-content.tips-active {
  opacity: 1;
  visibility: visible;
}

/* 箭头样式 */
.tips-content::after {
  content: '';
  position: absolute;
  border-width: 5px;
  border-style: solid;
}

.tips-content.top::after {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.tips-content.right::after {
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
}

.tips-content.bottom::after {
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-color: transparent transparent rgba(0, 0, 0, 0.8) transparent;
}

.tips-content.left::after {
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-color: transparent transparent transparent rgba(0, 0, 0, 0.8);
}
</style>
