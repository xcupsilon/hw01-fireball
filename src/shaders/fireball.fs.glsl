precision mediump float;

uniform vec3 uColor;
uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;
varying float vElevation;
varying vec3 vPos;
varying vec3 vNor;
varying vec3 vCamNor;

// A simple pseudo-random function based on the dot product.
float rand(vec3 n) {
    const vec3 randomVec = vec3(12.9898, 78.233, 54.53);
    const float randomConst = 43758.5453;
    return fract(sin(dot(n, randomVec)) * randomConst);
}

// Compute 3D Perlin noise value at point p.
float perlin(vec3 p) {
    // Determine grid cell and relative position
    vec3 cell = floor(p);
    vec3 pos = fract(p);
    
    // Compute smooth step curve for interpolation
    vec3 fadeCurve = pos * pos * (3.0 - 2.0 * pos);

    // Directly interpolate using random values for each corner of the cube
    float l0 = mix(
        mix(rand(cell), rand(cell + vec3(1.0, 0.0, 0.0)), fadeCurve.x),
        mix(rand(cell + vec3(0.0, 1.0, 0.0)), rand(cell + vec3(1.0, 1.0, 0.0)), fadeCurve.x),
        fadeCurve.y
    );
    float l1 = mix(
        mix(rand(cell + vec3(0.0, 0.0, 1.0)), rand(cell + vec3(1.0, 0.0, 1.0)), fadeCurve.x),
        mix(rand(cell + vec3(0.0, 1.0, 1.0)), rand(cell + vec3(1.0, 1.0, 1.0)), fadeCurve.x),
        fadeCurve.y
    );

    // Final interpolation along the z-axis
    float result = mix(l0, l1, fadeCurve.z);
    
    // Enhance contrast of the result
    return result * result * (3.0 - 2.0 * result);
}

// Fractional Brownian Motion combining multiple octaves of Perlin noise.
float PerlinFBM(vec3 p, int octaves) {
    float totalValue = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    // Loop over octaves to accumulate noise values
    for (int i = 0; i < octaves; i++) {
        totalValue += amplitude * perlin(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return totalValue;
}

void main()
{
    vec2 matcapUV = vec2(vCamNor.x * 0.5 + 0.5, vCamNor.y * 0.5 + 0.5); // mapping normal to uv 

    // sample from texture
    vec4 textureColor = texture2D(uTexture, matcapUV);

    // compute the luminance based on the matcap texture
    float luminance = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
    float bias = 0.6; // adjusts from 0.2 to 0.8
    float weight = luminance * 0.8 + bias;  

    // todo: modify color based on parameters
    vec3 finalColor = mix(uColor.rgb, textureColor.rgb, weight);
    gl_FragColor = vec4(finalColor, 1.0);
}