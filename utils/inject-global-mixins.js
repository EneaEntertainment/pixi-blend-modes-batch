import prepend from 'prepend';

const str = `// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./global.d.ts" />\n`;

prepend('_dist/index.d.ts', str, (error) =>
{
    if (error)
        console.error(error.message);
});
