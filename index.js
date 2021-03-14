const { DH_NOT_SUITABLE_GENERATOR } = require("node:constants");

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

// fiber tree
// 各要素に1つのファイバーがあり、各ファイバーが作業単位

const createDom = (fiber) => {
  // TODO create dom nodes
  // typeがTEXT_ELEMENTだったら、textNodeを返す
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  // nodeValue, id, class
  const isProperty = key => key !== 'children'

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
      console.log(name)
      logger(fiber.props)
      logger(fiber.props[name])
    })

  return dom
}

const commitRoot = () => {
  // add nodes to dom
  commitWork(wipRoot.child)
  wipRoot = null
}

const commitWork = (fiber) => {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

/**
 * render 関数でルートファイバーを作成し、それを次のユニットオブワークに設定
 * 残りの作業は performUnitOfWork 関数で行われ、各ファイバーに対して 3 つのことを行う
 * 1. 要素をDOMに追加する
 * 2. 要素のchildrenのファイバーを作成する
 * 3. 次のユニットオブワークを選択する
 */
const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null

const workLoop = (deadline) => {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requertIdleCallback(workLoop)

// TODO：これが難しい！
const performUnitOfWork = (nextUnitOfWork) => {
  // 要素をDOMに追加する
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // 要素のchildrenのファイバーを作成する
  const element = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  // 次のユニットオブワークを選択する
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
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