/**
 * 自定义资源注册示例
 *
 * 这个文件展示了如何在测试项目中注册自定义字体和转场特效
 */

import { registerFont, registerTransition } from 'aoles-gl-vue'

/**
 * 注册自定义字体示例
 */
export function setupCustomFonts() {
  // 注册单个自定义字体
  registerFont({
    value: 'Roboto',
    label: 'FontMap.Label.Roboto',
    data: {
      path: '/fonts/Roboto-Regular.ttf'
    }
  })

  // 注册更多字体
  registerFont({
    value: 'OpenSans',
    label: 'FontMap.Label.OpenSans',
    data: {
      path: '/fonts/OpenSans-Regular.ttf'
    }
  })
}

/**
 * 注册自定义转场特效示例
 */
export function setupCustomTransitions() {
  // 注册简单的转场特效
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
  })

  // 注册带参数的转场特效
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
  })
}

/**
 * 如果需要在 main.ts 中使用，取消下面的注释：
 *
 * // main.ts
 * import { setupCustomFonts, setupCustomTransitions } from './customAssets'
 *
 * // 在 configAssetPath 之后调用
 * configAssetPath({ basePath: '...' })
 * setupCustomFonts()
 * setupCustomTransitions()
 */
