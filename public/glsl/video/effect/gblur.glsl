uniform float sigma;         // 模糊程度控制参数 (0.0-1.0)
uniform vec2 direction;      // 模糊方向 (1.0,0.0)或(0.0,1.0)

vec4 gaussianBlur(sampler2D tex, vec2 uv, vec2 dir, float intensity) {
    vec2 resolution = vec2(wFrom, hFrom);

    // 计算标准差值 (0.5-10.0)
    float realSigma = 0.5 + intensity * 9.5;
    
    // 计算优化后的偏移位置 (基于Sigma预计算)
    float offset1 = 1.485 * realSigma;
    float offset2 = 3.465 * realSigma;
    float offset3 = 5.000 * realSigma;
    
    // 计算优化权重 (基于高斯分布公式预计算)
    float weight0 = 1.0/(2.0 * 3.1415926535*realSigma*realSigma);
    float weight1 = exp(-1.0/(2.0*realSigma*realSigma)) * weight0;
    float weight2 = exp(-4.0/(2.0*realSigma*realSigma)) * weight0;
    float weight3 = exp(-9.0/(2.0*realSigma*realSigma)) * weight0;
    
    // 归一化权重
    float total = weight0 + 2.0*(weight1 + weight2 + weight3);
    weight0 /= total;
    weight1 /= total;
    weight2 /= total;
    weight3 /= total;
    
    // 计算单步偏移
    vec2 singleStepOffset = dir * intensity / resolution;
    
    // 累加高斯采样值
    vec4 sum = texture2D(tex, uv) * weight0;
    sum += texture2D(tex, uv + singleStepOffset * offset1) * weight1;
    sum += texture2D(tex, uv - singleStepOffset * offset1) * weight1;
    sum += texture2D(tex, uv + singleStepOffset * offset2) * weight2;
    sum += texture2D(tex, uv - singleStepOffset * offset2) * weight2;
    sum += texture2D(tex, uv + singleStepOffset * offset3) * weight3;
    sum += texture2D(tex, uv - singleStepOffset * offset3) * weight3;
    
    return sum;
}

vec4 transition(vec2 uv) {
    // 基于进度控制模糊强度
    float blurIntensity = smoothstep(0.0, 1.0, progress);
    
    // 应用高斯模糊效果
    vec4 blurredColor = gaussianBlur(from, uv, direction, blurIntensity);
    
    // 应用简单的淡入淡出转场效果
    vec4 originalColor = texture2D(from, uv);
    
    // 当进度<0.5时：淡出到模糊图像
    // 当进度>0.5时：淡入回原始图像
    if(progress < 0.5) {
        float fade = smoothstep(0.0, 0.5, progress);
        return mix(originalColor, blurredColor, fade);
    } else {
        float fade = smoothstep(0.5, 1.0, progress);
        return mix(blurredColor, originalColor, fade);
    }
}