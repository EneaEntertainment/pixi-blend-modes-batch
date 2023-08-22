import { BlendModesBatchRenderer } from './blend-modes-batch';
import { DisplayObject } from '@pixi/display';
import { TilingSprite } from '@pixi/sprite-tiling';

DisplayObject.prototype.convertToBlendModesBatch = function convertToBlendModesBatch()
{
    const thisAny = this as any;

    if (thisAny.pluginName && !(thisAny instanceof TilingSprite))
        thisAny.pluginName = BlendModesBatchRenderer.extension.name;
    else if (thisAny.shader?.pluginName)
        thisAny.shader.pluginName = BlendModesBatchRenderer.extension.name;
};

DisplayObject.prototype.convertSubtreeToBlendModesBatch = function convertSubtreeToBlendModesBatch()
{
    this.convertToBlendModesBatch();

    const children = (this as any).children;

    if (typeof children !== 'undefined')
    {
        for (let i = 0; i < children.length; i++)
            children[i].convertSubtreeToBlendModesBatch();
    }
};
