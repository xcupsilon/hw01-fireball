uniform vec3 uColor;
uniform float uTime;
uniform sampler2D uTexture;

// uniform vector for noise inputs
uniform vec3 uNoiseParams;

varying vec2 vUv;
varying float vElevation;
varying vec3 vPos;
varying vec3 vNor;
varying vec3 vCamNor;

// Modified perlin noise from 2D perlin used in miniminecraft in 460
vec3 noise3D(vec3 p) {
    return 2.0 * fract(sin(dot(p, vec3(127.1, 311.7, 513.3))) *
                       43758.5453) - vec3(1.0);
}

float surflect(vec3 P, vec3 gridPoint) {
    float distX = abs(P.x - gridPoint.x);
    float distY = abs(P.y - gridPoint.y);
    float distZ = abs(P.z - gridPoint.z);

    float tX = 1.0 - 6.0 * pow(distX, 5.0) 
                   + 15.0 * pow(distX, 4.0) 
                   - 10.0 * pow(distX, 3.0);
    float tY = 1.0 - 6.0 * pow(distY, 5.0) 
                   + 15.0 * pow(distY, 4.0) 
                   - 10.0 * pow(distY, 3.0);
    float tZ = 1.0 - 6.0 * pow(distZ, 5.0) 
                   + 15.0 * pow(distZ, 4.0) 
                   - 10.0 * pow(distZ, 3.0); // z component

    // calculate for the 3D gradient vector
    vec3 gradient = 2.0 * noise3D(gridPoint) - vec3(1.0);
    float height = dot(P - gridPoint, gradient);
    return height * tX * tY * tZ;
}

float perlinNoise(vec3 uvw) {
    float surflectSum = 0.0; // storing the sum of gradients

    // iterate over the 8 corners of the unit cube
    for (int dx = 0; dx <= 1; dx++) {
        for (int dy = 0; dy <= 1; dy++) {
            for (int dz = 0; dz <= 1; dz++) {
                // sample the gradient vector at each corner
                surflectSum += surflect(uvw, floor(uvw) + vec3(float(dx), float(dy), float(dz)));
            }
        }
    }

    return surflectSum;
}

// Fractional Brownian Motion combining multiple octaves of Perlin noise.
float fbm(vec3 P, int octaves, float amplitude, float frequency) {
    float total = 0.0;
    float maxAmplitude = 0.0;
    float a = amplitude;
    float f = frequency;

    for (int i = 0; i < octaves; i++) {
        total += perlinNoise(P * f) * a;
        maxAmplitude += a;

        a *= amplitude;
        f *= frequency;
    }

    return total / maxAmplitude;
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
    // vec3 finalColor = mix(uColor.rgb, textureColor.rgb, weight); 
    float patternedNoise = sin(20.0 * fbm(vPos, int(uNoiseParams.x), uNoiseParams.y, uNoiseParams.z));
    float gradientNoise = fbm(vPos, int(uNoiseParams.x), uNoiseParams.y, uNoiseParams.z);

    vec3 gradient = vec3(gradientNoise);

    vec3 finalColor = mix(textureColor.rgb, vec3(patternedNoise), 0.2 * sin(uTime) + 0.5 * gradientNoise);
    gl_FragColor = vec4(finalColor, 1.0);
}