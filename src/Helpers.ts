/** ----- Helper functions ----- **/

/**
 * Searches for the first HTML element that meets a specified condition.
 *
 * The search is upwards
 *
 * @param el
 * @param condition
 */
export const searchParentElement = (el: EventTarget, condition: (el: HTMLElement) => boolean): HTMLElement | null => {
    let currentTarget: any = el

    while (currentTarget) {
        if (currentTarget instanceof HTMLElement && condition(currentTarget)) {
            return currentTarget
        }

        currentTarget = (currentTarget as HTMLElement).parentElement
    }

    return null
}

/**
 * Get html element child nodes.
 *
 * @param el
 */
export const getHtmlChildNodes = (el: HTMLElement): HTMLElement[] => {
    const nodes: HTMLElement[] = []

    el.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && child instanceof HTMLElement) {
            nodes.push(child)
        }
    })

    return nodes
}

/**
 * Create an array containing a sequence of numbers between start and end
 *
 * @param start
 * @param end
 */
export const createRangeFromIndexes = (start: number, end: number) => {
    if (start > end) {
        ;[start, end] = [end, start]
    }

    let rangeArray = []

    for (let i = start; i <= end; i++) {
        rangeArray.push(i)
    }

    return rangeArray
}

/**
 * Get elements array from indexes
 *
 * @param elements
 * @param start
 * @param end
 */
export const getElementsFromIndexes = (elements: HTMLElement[], start: number, end: number): HTMLElement[] => {
    if (start > end) {
        ;[start, end] = [end, start]
    }

    return elements.slice(start, end + 1)
}

/**
 * Get element index in parent node
 *
 * @param parentEl
 * @param el
 */
export const getChildIndex = (parentEl: HTMLElement, el: HTMLElement) => {
    const list = getHtmlChildNodes(parentEl)
    const parentArray = Array.prototype.slice.call(list)
    return parentArray.indexOf(el)
}

/**
 * Get element bounding client rect
 *
 * @param target
 */
export const getActualPosition = (target: HTMLElement): { x: number; y: number; w: number; h: number } => {
    const position = target.getBoundingClientRect()
    return { x: position.left, y: position.top, w: position.width, h: position.height }
}

/**
 * Add multiple classes to element
 *
 * @param element
 * @param classString
 */
export const addMultipleClasses = (element: HTMLElement, classString: string): void => {
    const classes = classString.split(/\s+/).filter(Boolean)
    element.classList.add(...classes)
}

/**
 * Remove multiple classes to element
 *
 * @param element
 * @param classString
 */
export const removeMultipleClasses = (element: HTMLElement, classString: string): void => {
    const classes = classString.split(/\s+/).filter(Boolean)
    element.classList.remove(...classes)
}
