uniform vec2 uFrequency;
uniform float uTime;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNor;
varying vec3 vPos;
varying vec3 vCamNor;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += sin(modelPosition.x + uTime) * 0.5;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
    vNor = normal;
    // compute the camera normal in world space
    vCamNor = normalize(mat3(viewMatrix) * normal);
}