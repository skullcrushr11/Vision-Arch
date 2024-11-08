import { MeshStandardMaterial } from "three"

export class MeshReflectorMaterial extends MeshStandardMaterial {
  _tDepth = { value: null }
  _distortionMap = { value: null }
  _tDiffuse = { value: null }
  _tDiffuseBlur = { value: null }
  _textureMatrix = { value: null }
  _hasBlur = { value: false }
  _mirror = { value: 0.0 }
  _mixBlur = { value: 0.0 }
  _blurStrength = { value: 0.5 }
  _minDepthThreshold = { value: 0.9 }
  _maxDepthThreshold = { value: 1 }
  _depthScale = { value: 0 }
  _depthToBlurRatioBias = { value: 0.25 }
  _distortion = { value: 1 }
  _mixContrast = { value: 1.0 }

  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    console.log(this._hasBlur)
    if (!shader.defines?.USE_UV) {
      shader.defines.USE_UV = ""
    }
    shader.uniforms.hasBlur = this._hasBlur
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDepth = this._tDepth
    shader.uniforms.distortionMap = this._distortionMap
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.uniforms.mixBlur = this._mixBlur
    shader.uniforms.mixStrength = this._blurStrength
    shader.uniforms.minDepthThreshold = this._minDepthThreshold
    shader.uniforms.maxDepthThreshold = this._maxDepthThreshold
    shader.uniforms.depthScale = this._depthScale
    shader.uniforms.depthToBlurRatioBias = this._depthToBlurRatioBias
    shader.uniforms.distortion = this._distortion
    shader.uniforms.mixContrast = this._mixContrast
    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;
      ${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
      my_vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`
    )
    shader.fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseBlur;
        uniform sampler2D tDepth;
        uniform sampler2D distortionMap;
        uniform float distortion;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float mixContrast;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec4 my_vUv;
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>

    float distortionFactor = 0.0;
    #ifdef USE_DISTORTION
      distortionFactor = texture2D(distortionMap, vUv).r * distortion;
    #endif

    vec4 new_vUv = my_vUv;
    new_vUv.x += distortionFactor;
    new_vUv.y += distortionFactor;

    vec4 base = texture2DProj(tDiffuse, new_vUv);
    vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);

    vec4 merge = base;

    #ifdef USE_NORMALMAP
      vec2 normal_uv = vec2(0.0);
      vec4 normalColor = texture2D(normalMap, vUv * normalScale);
      vec3 my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );
      vec3 coord = new_vUv.xyz / new_vUv.w;
      normal_uv = coord.xy + coord.z * my_normal.xz * 0.05;
      vec4 base_normal = texture2D(tDiffuse, normal_uv);
      vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);
      merge = base_normal;
      blur = blur_normal;
    #endif

    float depthFactor = 0.0001;
    float blurFactor = 0.0;

    #ifdef USE_DEPTH
      vec4 depth = texture2DProj(tDepth, new_vUv);
      depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
      depthFactor *= depthScale;
      depthFactor = max(0.0001, min(1.0, depthFactor));

      #ifdef USE_BLUR
        blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
        merge = merge * min(1.0, depthFactor + 0.5);
      #else
        merge = merge * depthFactor;
      #endif

    #endif

    float reflectorRoughnessFactor = roughness;
    #ifdef USE_ROUGHNESSMAP
      vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
      reflectorRoughnessFactor *= reflectorTexelRoughness.g;
    #endif

    #ifdef USE_BLUR
      blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
      merge = mix(merge, blur, blurFactor);
    #endif

    vec4 newMerge = vec4(0.0, 0.0, 0.0, 1.0);
    newMerge.r = (merge.r - 0.5) * mixContrast + 0.5;
    newMerge.g = (merge.g - 0.5) * mixContrast + 0.5;
    newMerge.b = (merge.b - 0.5) * mixContrast + 0.5;

    diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);
    `
    )
  }
  get tDiffuse() {
    return this._tDiffuse ? this._tDiffuse.value : null;
}
set tDiffuse(v) {
    this._tDiffuse = { value: v };
}

get tDepth() {
    return this._tDepth ? this._tDepth.value : null;
}
set tDepth(v) {
    this._tDepth = { value: v };
}

get distortionMap() {
    return this._distortionMap ? this._distortionMap.value : null;
}
set distortionMap(v) {
    this._distortionMap = { value: v };
}

get tDiffuseBlur() {
    return this._tDiffuseBlur ? this._tDiffuseBlur.value : null;
}
set tDiffuseBlur(v) {
    this._tDiffuseBlur = { value: v };
}

get textureMatrix() {
    return this._textureMatrix ? this._textureMatrix.value : null;
}
set textureMatrix(v) {
    this._textureMatrix = { value: v };
}

get hasBlur() {
    return this._hasBlur ? this._hasBlur.value : null;
}
set hasBlur(v) {
    this._hasBlur = { value: v };
}

get mirror() {
    return this._mirror ? this._mirror.value : null;
}
set mirror(v) {
    this._mirror = { value: v };
}

get mixBlur() {
    return this._mixBlur ? this._mixBlur.value : null;
}
set mixBlur(v) {
    this._mixBlur = { value: v };
}

get mixStrength() {
    return this._blurStrength ? this._blurStrength.value : null;
}
set mixStrength(v) {
    this._blurStrength = { value: v };
}

get minDepthThreshold() {
    return this._minDepthThreshold ? this._minDepthThreshold.value : null;
}
set minDepthThreshold(v) {
    this._minDepthThreshold = { value: v };
}

get maxDepthThreshold() {
    return this._maxDepthThreshold ? this._maxDepthThreshold.value : null;
}
set maxDepthThreshold(v) {
    this._maxDepthThreshold = { value: v };
}

get depthScale() {
    return this._depthScale ? this._depthScale.value : null;
}
set depthScale(v) {
    this._depthScale = { value: v };
}

get depthToBlurRatioBias() {
    return this._depthToBlurRatioBias ? this._depthToBlurRatioBias.value : null;
}
set depthToBlurRatioBias(v) {
    this._depthToBlurRatioBias = { value: v };
}

get distortion() {
    return this._distortion ? this._distortion.value : null;
}
set distortion(v) {
    this._distortion = { value: v };
}

get mixContrast() {
    return this._mixContrast ? this._mixContrast.value : null;
}
set mixContrast(v) {
    this._mixContrast = { value: v };
}

}
