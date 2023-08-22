import { AbstractBatchRenderer, BatchGeometry, ExtensionType } from '@pixi/core';
import type { BatchTextureArray, IBatchableElement, Renderer, ViewableBuffer } from '@pixi/core';
import { premultiplyBlendMode, premultiplyTint } from '@pixi/utils';

import { BLEND_MODES } from '@pixi/constants';
import { BlendModesShaderGenerator } from './shader-generator';

const vert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;
uniform float intensity;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void) 
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vColor = aColor * tint;
    vColor.a *= (mod(aColor[0] * 255.0, 2.0) * -1.0 * intensity) + 1.0;
}
`;

const frag = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[%count%];

void main(void)
{
    vec4 color;

    %forloop%

    gl_FragColor.rgb = color.rgb * vColor.rgb;
    gl_FragColor.a = color.a * vColor.a;
}
`;

/**
 * BlendModesBatchRenderer plugin for PixiJS
 *
 * Emulates BLEND_MODES.ADD using BLEND_MODES.NORMAL
 * and batches sprites with these blend modes into a single draw call
 *
 * Notice: any blend mode other than NORMAL and ADD will break the batch
 */
export class BlendModesBatchRenderer extends AbstractBatchRenderer
{
    /**
     * set name to 'batch' to override default batch renderer
     */
    static extension =
        {
            name : 'batchBlendModes',
            type : ExtensionType.RendererPlugin
        };

    /**
     * 0 - no effect
     * 1 - full effect
     */
    static intensity = 1;

    constructor(renderer: Renderer)
    {
        super(renderer);

        this.shaderGenerator = new BlendModesShaderGenerator(vert, frag);

        this.geometryClass = BatchGeometry;

        this.vertexSize = 6;
    }

    packInterleavedGeometry(element: IBatchableElement, attributeBuffer: ViewableBuffer, indexBuffer: Uint16Array,
        aIndex: number, iIndex: number): void
    {
        const {
            uint32View,
            float32View
        } = attributeBuffer;

        const packedVertices = aIndex / this.vertexSize;
        const uvs = element.uvs;
        const indicies = element.indices;
        const vertexData = element.vertexData;
        const textureId = element._texture.baseTexture._batchLocation;
        const alpha = Math.min(element.worldAlpha, 1.0);

        let argb = (alpha < 1.0 &&
                element._texture.baseTexture.alphaMode) ?
            premultiplyTint(element._tintRGB, alpha) :
            element._tintRGB + (alpha * 255 << 24);

        argb = argb & 0xfffffffe;

        if (element.blendMode === BLEND_MODES.ADD)
            argb |= 1;

        for (let i = 0; i < vertexData.length; i += 2)
        {
            float32View[aIndex++] = vertexData[i];
            float32View[aIndex++] = vertexData[i + 1];
            float32View[aIndex++] = uvs[i];
            float32View[aIndex++] = uvs[i + 1];
            uint32View[aIndex++] = argb;
            float32View[aIndex++] = textureId;
        }

        for (let i = 0; i < indicies.length; i++)
            indexBuffer[iIndex++] = packedVertices + indicies[i];
    }

    buildDrawCalls(texArray: BatchTextureArray, start: number, finish: number): void
    {
        const {
            _bufferedElements: elements,
            _attributeBuffer,
            _indexBuffer,
            vertexSize
        } = this;

        const drawCalls = AbstractBatchRenderer._drawCallPool;

        let dcIndex = this._dcIndex;
        let aIndex = this._aIndex;
        let iIndex = this._iIndex;
        let drawCall = drawCalls[dcIndex];

        drawCall.start = this._iIndex;
        drawCall.texArray = texArray;

        for (let i = start; i < finish; ++i)
        {
            const sprite = elements[i];
            const tex = sprite._texture.baseTexture;

            let spriteBlendMode = premultiplyBlendMode[tex.alphaMode ? 1 : 0][sprite.blendMode];

            if (spriteBlendMode === BLEND_MODES.ADD && tex.alphaMode)
                spriteBlendMode = BLEND_MODES.NORMAL;

            // @ts-ignore
            elements[i] = null;

            if (start < i && drawCall.blend !== spriteBlendMode)
            {
                drawCall.size = iIndex - drawCall.start;
                start = i;
                drawCall = drawCalls[++dcIndex];
                drawCall.texArray = texArray;
                drawCall.start = iIndex;
            }

            this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex);

            aIndex += sprite.vertexData.length / 2 * vertexSize;
            iIndex += sprite.indices.length;

            drawCall.blend = spriteBlendMode;
        }

        if (start < finish)
        {
            drawCall.size = iIndex - drawCall.start;
            ++dcIndex;
        }

        this._dcIndex = dcIndex;
        this._aIndex = aIndex;
        this._iIndex = iIndex;
    }
}
