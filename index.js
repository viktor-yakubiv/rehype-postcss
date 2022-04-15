import postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import { visitParents as visit } from 'unist-util-visit-parents'


const attach = ({
  plugins = [],
  options: userOptions = {},
  context: configContext,
} = {}) => {
  const transform = async (tree, file) => {
    const fileUrl = file.path ?? file.history[file.history.length - 1]
    let options = {
      map: false,
      from: fileUrl,
    }

    if (plugins.length === 0) {
      try {
        const config = await postcssrc(configContext)

        plugins = config.plugins
        Object.assign(options, config.options)
      } catch (error) {
        if (error.message.startsWith('No PostCSS Config found in:')) {
          const url = error.message.slice(error.message.indexOf(':') + 2)
          const message = `No plugins passed and no config found at: ${url}`
          throw new Error(message)
        } else {
          throw error
        }
      }
    }

    Object.assign(options, userOptions)

    const cssProcessor = postcss(plugins)
    const process = css => cssProcessor.process(css, options)
    const updates = []

    const elementTest = node =>
      (node.type == 'element') &&
      ((node.tagName == 'style') && (node.children.length > 0))

    const attributeTest = node => node.properties?.style

    const elementVisitor = node => {
      const promise = process(node.children[0].value)
        .then(result => {
          node.children[0].value = result.css
          return result
        })

      updates.push(promise)
    }

    const attributeVisitor = node => {
      const promise = process(node.properties.style)
        .then(result => {
          node.properties.style = result.css
          return result
        })

      updates.push(promise)
    }

    visit(tree, elementTest, elementVisitor)
    visit(tree, attributeTest, attributeVisitor)

    await Promise.all(updates)
  }

  return transform
}

export default attach
