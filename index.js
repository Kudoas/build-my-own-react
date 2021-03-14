const { DEFAULT_EXTENSIONS } = require("@babel/core");
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

const isEvent = key => key.startsWith('on')
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
const updateDom = (dom, prevProps, nextProps) => {
  // Remove old or changed event listners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => {
      !(key in nextProps) || isNew(prevProps, nextProps)(key)
    })
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // Remove old properties 
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ''
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

const commitRoot = () => {
  // add nodes to dom
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

const commitWork = (fiber) => {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === 'UPDATE' &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.prosp,
      fiber.props
    )
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom)
  }

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
    },
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null

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
  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

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

const reconcileChildren = (wipFiber, elements) => {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber = null

    // compare oldFiber to element
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }
    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }
    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = 'DELETE'
      deletions.push(oldFiber)
    }
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