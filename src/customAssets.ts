/**
 * 自定义资源注册示例
 *
 * 这个文件展示了如何在测试项目中注册自定义字体和转场特效
 */

import { registerFont, registerTransition } from 'aoles-gl-vue'
import type { Engine } from 'aoles-gl-vue'

/**
 * 注册自定义字体示例（不需要 engine，只是往列表里加）
 */
export function setupCustomFonts() {
  registerFont({
    value: 'Roboto',
    label: 'FontMap.Label.Roboto',
    data: { path: '/fonts/Roboto-Regular.ttf' }
  })

  registerFont({
    value: 'OpenSans',
    label: 'FontMap.Label.OpenSans',
    data: { path: '/fonts/OpenSans-Regular.ttf' }
  })
}

/**
 * 注册自定义转场特效示例（需要 engine，WASM 已初始化时立即加载 shader）
 */
export function setupCustomTransitions(engine: Engine) {
  registerTransition({
    value: 'CustomFade',
    label: 'TransitionMap.Label.CustomFade',
    data: {
      name: 'TransitionMap.Label.CustomFade',
      controller_key: 'transition_key_custom_fade',
      transition_duration_ts: 15,
      path: '/glsl/video/transition/custom_fade.glsl',
      uniforms: []
    }
  }, engine)

  registerTransition({
    value: 'CustomBlur',
    label: 'TransitionMap.Label.CustomBlur',
    data: {
      name: 'TransitionMap.Label.CustomBlur',
      controller_key: 'transition_key_custom_blur',
      transition_duration_ts: 15,
      path: '/glsl/video/transition/custom_blur.glsl',
      uniforms: [
        {
          name: 'BlurAmount',
          type: 'float',
          value: 5.0,
          min: 0.0,
          max: 20.0,
          step: 0.5,
          label: 'TransitionMap.CustomBlur.Uniforms.BlurAmount.Label',
          description: 'TransitionMap.CustomBlur.Uniforms.BlurAmount.Description'
        }
      ]
    }
  }, engine)
}
