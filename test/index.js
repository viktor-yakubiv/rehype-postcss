import assert from 'assert'
import path from 'path'
import { rehype } from 'rehype'

import autoprefixer from 'autoprefixer'
import postcss from '../index.js'

const defaultOptions = {
  plugins: [
    autoprefixer({ overrideBrowserslist: ['ie >= 10'] })
  ],

  options: {
    from: 'src/index.html',
    to: 'dist/index.html',
  },
}

describe('rehype-postcss', () => {
  const run = (file, options) => rehype()
    .data({ settings: { fragment: true } })
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

    await assert.rejects(() => run(source))

    try {
      await run(source, {
        options: { from: sourceFileName },
      })
    } catch (error) {
      const logMessage = 'Error does not report source file name'
      assert(error.message.includes(sourceFileName), logMessage)
    }
  })
})
