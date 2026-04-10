// 改进的随机函数
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
vec4 transition(vec2 uv) {
    vec4 color = getFromColor(uv);
    float intensity = progress; // 使用progress控制效果强度
    bool isSnow = false; // true为雪，false为雨
    
    // 粒子参数
    float particleSize = isSnow ? 0.03 : 0.02; // 更大的粒子尺寸
    float fallSpeed = isSnow ? 0.7 : 2.0;     // 下落速度
    float density = 0.5 * intensity;          // 粒子密度
    
    float particleEffect = 0.0;
    int particleCount = int(15.0 * density);  // 适当数量的粒子
    
    for (int i = 0; i < particleCount; i++) {
        // 使用粒子索引和progress创建稳定的随机位置
        float fi = float(i);
        vec2 particlePos = vec2(
            rand(vec2(fi, 0.0)), // x位置随机但稳定
            mod(rand(vec2(0.0, fi)) - intensity * fallSpeed, 1.0) // y位置随时间下落
        );
        
        // 雪花的飘动效果
        if (isSnow) {
            particlePos.x += sin(intensity * 10.0 + fi * 5.0) * 0.1;
        }
        
        // 计算粒子影响
        float dist = distance(uv, particlePos);
        if (dist < particleSize) {
            float strength = 1.0 - smoothstep(0.0, particleSize, dist);
            particleEffect = max(particleEffect, strength);
        }
    }
    
    // 应用效果
    if (isSnow) {
        // 雪效果 - 添加白色覆盖
        return mix(color, vec4(1.0), particleEffect * 0.9);
    } else {
        // 雨效果 - 变暗并添加光泽
        vec4 rainColor = vec4(0.8, 0.8, 1.0, 1.0);
        return mix(color * 0.8, rainColor, particleEffect);
    }
}