# rehype-postcss

**[rehype][]** plugin to process `<style>` nodes
and elements containing a `style` attribute
with [PostCSS][postcss].

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(rehypePostCSS[, options])`](#unifieduserehypepostcss-options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [License](#license)

## What is this?

This package is a [unified][] ([rehype][]) plugin
to process `<style>` nodes and elements with a `style` attribute
using [PostCSS][postcss].

**unified** is a project that transforms content
with abstract syntax trees (ASTs).
**rehype** adds support for HTML to unified.
**hast** is the HTML AST that rehype uses.
This is a rehype plugin that runs PostCSS on `<style>` elements
and other elements that have a `style` attribute.

## When should I use this?

In most cases running [PostCSS][postcss] with [postcss-html][] syntax
through CLI or with your build tool should be enough.

When it's not,
this plugin helps you run PostCSS through nodes contextually,
run on fragments etc.

Specifically, the plugin was written to apply [CSS Modules][css-modules]
in context of the parent element
what would not be possible to do in another way.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).
In Node.js (version 12.20+, 14.14+, or 16.0+), install with [npm][]:

```sh
npm install rehype-postcss
```

In Deno with [`esm.sh`][esmsh]:

```js
import rehypePostCSS from 'https://esm.sh/rehype-postcss@0.1'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import rehypePostCSS from 'https://esm.sh/rehype-postcss@6?bundle'
</script>
```

## Use

Say we have the following file `example.html`:

```html
<style>
  a {
    display: flex;
  }
</style>
```

And our module `example.js` looks as follows:

```js
import { read } from 'to-vfile'
import { rehype } from 'rehype'
import rehypePostCSS from 'rehype-postcss'

const file = await rehype()
  .data('settings', { fragment: true })
  .use(rehypePostCSS, {
    plugins: [
      autoprefixer({ overrideBrowserslist: ['ie >= 10'] }),
    ],
  })
  .process(await read('example.html'))

console.log(String(file))
```

Now, running `node example.js` yields:

```html
<style>
  a {
    display: -ms-flexbox;
    display: flex;
  }
</style>
```

## API

This package exports no identifiers.
The default export is `rehypePostCSS`.

### `unified().use(rehypePostCSS[, options])`

Runs PostCSS.

##### `options`

Configuration (optional).

###### `options.plugins`

A list of plugins to run with the PostCSS processor.
This list is passed directly;
the whole process can be imagined simply
like in the [example][postcss-deno-example].

> 👉 **Note**:
> If `options.plugins` is not passed
> or is an empty array,
> the plugin would look for a [PostCSS config][postcss-load-config]
> in the current working directory.
>
> If such a config could not be found,
> an error is thrown.

###### `options.options`

[Processor options][postcss-process-options].
The object would complement defaults and passed
to the [process][postcss-process] call.

The initial default options are:

```js
{
  from: 'path of the source file',
  map: false,
}
```

> 👉 **Note**:
> Source maps (`map` option) are turned off by default.
>
> If you are going to use source maps, turn it on
> as well as pass `to` option
> to let the processor rewrite URLs properly.
> When the `from` option can be discovered from the `file`,
> there is no way to know
> where the result is going to be saved.

## Types

This package is not typed with [TypeScript][].
It can be though if you send a PR or when I have some extra time.

## Compatibility

The project should be compatible with Node.js 12.20+, 14.14+, and 16.0+
but the compatibility is not tested.

## Related

This plugin was inspired by [posthtml-postcss][].

## License

[MIT][license] © [Viktor Yakubiv][author]

<!-- Definitions -->

[npm]: https://docs.npmjs.com/cli/install

[esmsh]: https://esm.sh

[license]: ./LICENSE

[author]: https://yakubiv.com

[typescript]: https://www.typescriptlang.org

[unified]: https://github.com/unifiedjs/unified

[rehype]: https://github.com/rehypejs/rehype

[hast-util-is-element]: https://github.com/syntax-tree/hast-util-is-element

[postcss]: https://github.com/postcss/postcss

[postcss-html]: https://github.com/ota-meshi/postcss-html

[postcss-load-config]: https://github.com/postcss/postcss-load-config

[css-modules]: https://github.com/css-modules/css-modules

[postcss-deno-example]: https://github.com/postcss/postcss#deno

[postcss-process]: https://postcss.org/api/#processor-process

[postcss-process-options]: https://postcss.org/api/#processoptions

[posthtml-postcss]: https://github.com/posthtml/posthtml-postcss
