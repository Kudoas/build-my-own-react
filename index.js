const logger = (obj) => (
  console.log(JSON.stringify(obj, undefined, 1))
)

const createElement = (type, props, ...children) => {
  return {
    type, // HTMLタグか文字列(TEXT_ELEMENT)
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}

const createTextElement = (text) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

const render = (element, container) => {
  // TODO create dom nodes
  // typeがTEXT_ELEMENTだったら、textNodeを返す
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  // nodeValue, id, class
  const isProperty = key => key !== 'children'

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
      console.log(name)
      logger(element.props)
      logger(element.props[name])
    })

  element.props.children.forEach(child => {
    render(child, dom)
  })
  container.appendChild(dom)
}

const Didact = {
  createElement,
  render,
}

/** @jsx Didact.createElement */
// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// )

const element = Didact.createElement(
  'div',
  { id: 'foo' },
  Didact.createElement('a', null, 'bar'),
  Didact.createElement('b')
)

logger(element)

const container = document.getElementById('root')
Didact.render(element, container);