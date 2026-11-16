/** ----- Helper functions ----- **/

/**
 * Searches for the first HTML element that meets a specified condition.
 *
 * The search is upwards
 *
 * @param el
 * @param condition
 * @param stopAt
 */
export const searchParentElement = (el: EventTarget, condition: (el: HTMLElement) => boolean, stopAt?: HTMLElement): HTMLElement | null => {
    let currentTarget: any = el;

    while (currentTarget) {
        if (currentTarget instanceof Element) {
            if (currentTarget instanceof HTMLElement && condition(currentTarget)) {
                return currentTarget;
            }
            if (stopAt && currentTarget === stopAt) {
                break;
            }
            currentTarget = currentTarget.parentElement;
        } else {
            break;
        }
    }

    return null;
};

/**
 * Get elements array from indexes
 *
 * @param elements
 * @param start
 * @param end
 */
export const getElementsFromIndexes = (elements: HTMLElement[], start: number, end: number): HTMLElement[] => {
    if (start > end) {
        [start, end] = [end, start];
    }

    return elements.slice(start, end + 1);
};

/**
 * Get element bounding client rect
 *
 * @param target
 */
export const getActualPosition = (target: HTMLElement): { x: number; y: number; w: number; h: number } => {
    const position = target.getBoundingClientRect();
    return { x: position.left, y: position.top, w: position.width, h: position.height };
};

/**
 * Add multiple classes to element
 *
 * @param element
 * @param classString
 */
export const addMultipleClasses = (element: HTMLElement, classString: string): void => {
    const classes = classString.split(/\s+/).filter(Boolean);
    element.classList.add(...classes);
};

/**
 * Apply inline styles to element
 *
 * Supports camelCase keys (backgroundColor) as well as kebab-case keys and custom properties (background-color, --my-var)
 *
 * @param element
 * @param styles
 */
export const applyStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void => {
    for (const [key, value] of Object.entries(styles)) {
        if (typeof value !== 'string' && typeof value !== 'number') {
            continue;
        }

        if (key.includes('-')) {
            element.style.setProperty(key, String(value));
        } else if (key in element.style) {
            (element.style as any)[key] = String(value);
        }
    }
};

/**
 * Get element layout position without the in-progress transform animation
 *
 * The transition always ends at translate(0), so this is the position where the element will end up.
 *
 * @param target
 */
export const getLayoutPosition = (target: HTMLElement): { x: number; y: number } => {
    const rect = target.getBoundingClientRect();
    const transform = getComputedStyle(target).transform;
    const matrix = transform && transform !== 'none' ? new DOMMatrix(transform) : null;

    return { x: rect.left - (matrix?.m41 ?? 0), y: rect.top - (matrix?.m42 ?? 0) };
};
