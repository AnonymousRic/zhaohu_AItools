/**
 * 用户界面相关常量
 */

// 颜色常量
const COLORS = {
  PRIMARY: '#1976D2',
  SECONDARY: '#19D2AA',
  SUCCESS: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FF9800',
  INFO: '#2196F3',
  LIGHT: '#F5F5F5',
  DARK: '#212121',
  GRAY: '#9E9E9E',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  TRANSPARENT: 'transparent'
};

// 字体大小常量
const FONT_SIZES = {
  EXTRA_SMALL: '22rpx',
  SMALL: '26rpx',
  NORMAL: '30rpx',
  MEDIUM: '34rpx',
  LARGE: '40rpx',
  EXTRA_LARGE: '48rpx',
  HUGE: '60rpx'
};

// 间距常量
const SPACING = {
  EXTRA_SMALL: '8rpx',
  SMALL: '16rpx',
  NORMAL: '24rpx',
  MEDIUM: '32rpx',
  LARGE: '48rpx',
  EXTRA_LARGE: '64rpx',
  HUGE: '96rpx'
};

// 边框常量
const BORDERS = {
  NONE: 'none',
  THIN: '1rpx solid',
  MEDIUM: '2rpx solid',
  THICK: '4rpx solid',
  DASHED: '2rpx dashed',
  DOTTED: '2rpx dotted',
  RADIUS: {
    SMALL: '4rpx',
    NORMAL: '8rpx',
    MEDIUM: '16rpx',
    LARGE: '24rpx',
    PILL: '9999rpx',
    CIRCLE: '50%'
  }
};

// 阴影常量
const SHADOWS = {
  NONE: 'none',
  SMALL: '0 2rpx 4rpx rgba(0, 0, 0, 0.1)',
  NORMAL: '0 4rpx 8rpx rgba(0, 0, 0, 0.1)',
  MEDIUM: '0 8rpx 16rpx rgba(0, 0, 0, 0.1)',
  LARGE: '0 16rpx 24rpx rgba(0, 0, 0, 0.1)',
  EXTRA_LARGE: '0 24rpx 32rpx rgba(0, 0, 0, 0.1)',
  INNER: 'inset 0 2rpx 4rpx rgba(0, 0, 0, 0.1)'
};

// 文本样式常量
const TEXT_STYLES = {
  NORMAL: 'normal',
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  LINETHROUGH: 'line-through'
};

// 布局常量
const LAYOUTS = {
  FLEX_COLUMN: 'column',
  FLEX_ROW: 'row',
  JUSTIFY_START: 'flex-start',
  JUSTIFY_CENTER: 'center',
  JUSTIFY_END: 'flex-end',
  JUSTIFY_BETWEEN: 'space-between',
  JUSTIFY_AROUND: 'space-around',
  ALIGN_START: 'flex-start',
  ALIGN_CENTER: 'center',
  ALIGN_END: 'flex-end',
  ALIGN_STRETCH: 'stretch'
};

// 动画常量
const ANIMATIONS = {
  DURATION: {
    EXTRA_FAST: 100,
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 1000
  },
  EASE: {
    LINEAR: 'linear',
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out'
  }
};

// 工具图标常量
const TOOL_ICONS = {
  FIND_PROJECT: '/assets/icons/tools/find-project.png',
  FIND_VENUE: '/assets/icons/tools/find-venue.png',
  RELOC_EVAL: '/assets/icons/tools/reloc-eval.png',
  INDUSTRY_ANALYSIS: '/assets/icons/tools/industry-analysis.png'
};

module.exports = {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDERS,
  SHADOWS,
  TEXT_STYLES,
  LAYOUTS,
  ANIMATIONS,
  TOOL_ICONS
}; 