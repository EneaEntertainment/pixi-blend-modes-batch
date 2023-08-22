import { BatchShaderGenerator, Program, Shader, UniformGroup } from '@pixi/core';

import { BlendModesBatchRenderer } from './blend-modes-batch';
import { Matrix } from '@pixi/math';

export class BlendModesShaderGenerator extends BatchShaderGenerator
{
    generateShader(maxTextures: number): Shader
    {
        if (!this.programCache[maxTextures])
        {
            const sampleValues = new Int32Array(maxTextures);

            for (let i = 0; i < maxTextures; i++)
                sampleValues[i] = i;

            this.defaultGroupCache[maxTextures] = UniformGroup.from({ uSamplers: sampleValues }, true);

            let fragmentSrc = this.fragTemplate;

            fragmentSrc = fragmentSrc.replace(/%count%/gi, `${maxTextures}`);
            fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures));

            this.programCache[maxTextures] = new Program(this.vertexSrc, fragmentSrc);
        }

        const uniforms =
            {
                tint              : new Float32Array([1, 1, 1, 1]),
                intensity         : BlendModesBatchRenderer.intensity,
                translationMatrix : new Matrix(),
                default           : this.defaultGroupCache[maxTextures]
            };

        return new Shader(this.programCache[maxTextures], uniforms);
    }
}
