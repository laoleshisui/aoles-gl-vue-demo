/**
 * 自定义资源注册示例
 *
 * 这个文件展示了如何在测试项目中注册自定义字体和转场特效
 */

import { registerFont, registerTransition } from '@aoles-gl/vue'
import { getTransitionPath, TRANSITIONS } from '@aoles-gl/effects'
import type { Engine } from '@aoles-gl/vue'

/**
 * 注册自定义字体示例
 * 注意：registerFont 需要传入 engine 参数
 */
export function setupCustomFonts(engine: Engine) {
  registerFont({
    value: 'Roboto',
    label: 'FontMap.Label.Roboto',
    data: { path: '/fonts/Roboto-Regular.ttf' }
  }, engine)

  registerFont({
    value: 'OpenSans',
    label: 'FontMap.Label.OpenSans',
    data: { path: '/fonts/OpenSans-Regular.ttf' }
  }, engine)
}

/**
 * 注册自定义转场特效示例（需要 engine，WASM 已初始化时立即加载 shader）
 *
 * 注意：这里使用 @aoles-gl/effects 包中的效果作为示例
 * 实际使用中，你可以创建自己的 GLSL 文件并注册
 */
export function setupCustomTransitions(engine: Engine) {
  // 使用 effects 包中的 book_flip 作为自定义效果示例
  registerTransition({
    value: 'CustomBookFlip',
    label: 'TransitionMap.Label.CustomBookFlip',
    data: {
      name: 'TransitionMap.Label.CustomBookFlip',
      controller_key: 'transition_key_custom_book_flip',
      transition_duration_ts: 15,
      path: getTransitionPath(TRANSITIONS.BOOK_FLIP),
      uniforms: []
    }
  }, engine)

  // 使用 effects 包中的 cube 作为自定义效果示例
  registerTransition({
    value: 'CustomCube',
    label: 'TransitionMap.Label.CustomCube',
    data: {
      name: 'TransitionMap.Label.CustomCube',
      controller_key: 'transition_key_custom_cube',
      transition_duration_ts: 15,
      path: getTransitionPath(TRANSITIONS.CUBE),
      uniforms: []
    }
  }, engine)
}
