import assert from 'assert'
import path from 'path'

// Unified
import { unified } from 'unified'
import parser from 'rehype-parse'
import compiler from 'rehype-stringify'

// PostCSS
import autoprefixer from 'autoprefixer'
import modules from 'postcss-modules'
import postcss from '../index.js'

const defaultOptions = {
  plugins: [
    autoprefixer({ overrideBrowserslist: ['ie >= 10'] }),
  ],

  options: {
    from: 'src/index.html',
    to: 'dist/index.html',
  },
}

describe('rehype-postcss', () => {
  const run = (file, options) => unified()
    .use(parser, { fragment: true })
    .use(compiler)
    .use(postcss, options)
    .process(file)
    .then(result => result.value)

  const test = async (source, expected, options = defaultOptions) => {
    const received = await run(source, options)
    assert.equal(received, expected)
  }

  it('throws when no plugins passed and no config found', async () => {
    await assert.rejects(() => run(''))
  })

  it('detects a config when no plugins passed', async () => {
    const cwdBackup = process.cwd
    process.cwd = () => path.dirname(import.meta.url.slice('file://'.length))
    await assert.doesNotReject(() => run(''))
    process.cwd = cwdBackup
  })

  it('processes style element\'s content', async () => {
    const source = '<style>a {display: flex;}</style>'
    const expected = '<style>a {display: -ms-flexbox;display: flex;}</style>'
    await test(source, expected)
  })

  it('does not break on empty style element', async () => {
    const source = '<style></style>'
    await test(source, source)
  })

  it('processes style attributes', async () => {
    const source = '<div style="display: flex;"></div>'
    const expected = '<div style="display: -ms-flexbox;display: flex;"></div>'
    await test(source, expected)
  })

  it('does not break on empty style attributes', async () => {
    const source = '<div style></div>'
    const expected = '<div style=""></div>'
    await test(source, expected)
  })

  it('includes the file name in the syntax error', async () => {
    const source = '<style>.test { color: red</style>'
    const sourceFileName = 'test.html'

    const options = {
      plugins: [autoprefixer()],
      options: { from: sourceFileName },
    }

    await assert.rejects(() => run(source, options))

    try {
      await run(source, options)
    } catch (error) {
      const logMessage = 'Error does not report source file name'
      assert(error.message.includes(sourceFileName), logMessage)
    }
  })

  it('exports raw result into `node.data.postcss`', async () => {
    const source = '<style>.scoped { color: #000 }</style>'

    const sourceTree = await unified()
      .use(parser, { fragment: true })
      .parse(source)

    const resultTree = await unified()
      .use(postcss, defaultOptions)
      .run(sourceTree)

    const receivedNode = resultTree.children[0]
    const received = receivedNode.data

    assert(received.postcss != null,
      'The <style> node\'s data does not have `postcss`')

    assert(received.postcss?.processor != null,
      'The <style> node\'s data.postcss has unexpected content')
  })

  it('exports tokens into `node.data.exports`', async () => {
    const source = '<style>.scoped { color: #000 }</style>'

    const sourceTree = await unified()
      .use(parser, { fragment: true })
      .parse(source)

    const resultTree = await unified()
      .use(postcss, { plugins: [modules({ getJSON: () => {} })]})
      .run(sourceTree)

    const receivedNode = resultTree.children[0]
    const received = receivedNode.data

    assert('exports' in received,
      'The <style> node\'s data does not have `exports`')
    assert('postcss-modules' in received?.exports,
      'The <style> node does not have include exported data from the plugin')
    assert('scoped' in received?.exports?.['postcss-modules'],
      'The <style> node does not have .scoped class name exported')
  })

  it('allows user to pass custom testing function', async () => {
    const test = node =>
      (node.type == 'element') &&
      ((node.properties.type || 'test/css') == 'text/css')

    const source = `
      <style>a {display: flex;}</style>
      <style type="text/css">a {display: flex;}</style>
      <style type="text/scss">a {display: flex;}</style>
    `
    const expected = `
      <style>a {display: -ms-flexbox;display: flex;}</style>
      <style type="text/css">a {display: -ms-flexbox;display: flex;}</style>
      <style type="text/scss">a {display: flex;}</style>
    `
    await test(source, expected, { test })
  })
})
