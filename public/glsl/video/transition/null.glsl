
vec4 transition(vec2 p) {
  if (progress < -1000.0) {
    return vec4(progress);
  }
  return getFromColor(p);
}