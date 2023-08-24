# BlendModesBatchRenderer plugin for PixiJS

 Emulates BLEND_MODES.ADD using BLEND_MODES.NORMAL and batches sprites with these blend modes into a single draw call
 
 ### Notice:
 unless ```BlendModesBatchRenderer.forceAddBlend``` is set to ```true``` (default is ```false```) any blend mode other than BLEND_MODES.NORMAL and BLEND_MODES.ADD will break the batch.

 If ```BlendModesBatchRenderer.forceAddBlend = true``` then all other blend modes except BLEND_MODES.NORMAL will be treated as BLEND_MODES.ADD

---
### Installation

```js
npm install --save-dev @enea-entertainment/pixi-blend-modes-batch
```

[![NPM](https://nodei.co/npm/@enea-entertainment/pixi-blend-modes-batch.png?compact=true)](https://nodei.co/npm/@enea-entertainment/pixi-blend-modes-batch/)

PixiJS v7: npm version ```^1.0.1```

PixiJS v6: npm version ```^0.5.0```

---
### Build

PixiJS v7: clone ```master``` branch

PixiJS v6: clone ```v6``` branch

```js
npm i
npm run build
```


---
### Usage

Import the plugin and register it before initializing PixiJS:
```js
import { BlendModesBatchRenderer } from '@enea-entertainment/pixi-blend-modes-batch';
import { extensions } from 'pixi.js';

extensions.add(BlendModesBatchRenderer);
```

Create a scene and these 2 sprites will be rendered in single draw call:
```js

const sprite1 = new Sprite('myTexture');

// tell pixi to use BlendModesBatchRenderer
sprite1.pluginName = BlendModesBatchRenderer.extension.name;
// this is really not needed as NORMAL mode is default
sprite1.blendMode = BLEND_MODES.NORMAL;

const sprite2 = new Sprite('myOtherTexture');

// tell pixi to use BlendModesBatchRenderer
sprite2.pluginName = BlendModesBatchRenderer.extension.name;
sprite2.blendMode = BLEND_MODES.ADD;
```

Instead of setting `pluginName` property you can use helper method `convertToBlendModesBatch`

```js
const sprite1 = new Sprite('myTexture');
const sprite2 = new Sprite('myOtherTexture');

// tell pixi to use BlendModesBatchRenderer
sprite1.convertToBlendModesBatch();
sprite2.convertToBlendModesBatch();
```

To convert whole subtree use `convertSubtreeToBlendModesBatch`

```js
import { Application } from 'pixi.js';

const app = new Application();

// add some sprites to app.stage

app.stage.convertSubtreeToBlendModesBatch();
```

To control the `intensity` of 'additive blend' set the static property on `BlendModesBatchRenderer` before initializing the plugin:

```js
BlendModesBatchRenderer.intensity = 0.75;
```
where 0 is no effect, 1 is full effect.

---

You can also override default Pixi's BatchRenderer:
```js
import { BlendModesBatchRenderer } from '@enea-entertainment/pixi-blend-modes-batch';
import { BatchRenderer, extensions } from 'pixi.js';

extensions.remove(BatchRenderer);

BlendModesBatchRenderer.extension.name = 'batch';

extensions.add(BlendModesBatchRenderer);

// init PixiJS

const sprite1 = new Sprite('myTexture');
const sprite2 = new Sprite('myOtherTexture');

sprite2.blendMode = BLEND_MODES.ADD;
```

From now on, all scene elements that used the default Pixi `batch` will use `BlendModesBatchRenderer`. Even newly created ones, so you don't have to set or convert anything.

---

Inspired by [pixi-heaven](https://github.com/pixijs/pixi-heaven)

---
## License

MIT, see [LICENSE](LICENSE) for details.