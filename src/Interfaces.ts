/** ----- Interfaces ----- **/

export interface SimpleDragAndDropInterface {
    /** start listening for drags on root, called by the constructor */
    init(): void;

    /** stop listening for drags, a running drag is cancelled and all event listeners are removed */
    destroy(): void;

    /** cancel a running drag without a drop */
    cancelDrag(): void;

    on: EmitterInterface['on'];
}

export interface SDDOptionsInterface {
    root: string;
    animationDuration?: number;
    draggedElementStyle?: Partial<CSSStyleDeclaration>;
    draggedElementClass?: string;
    previewElementStyle?: Partial<CSSStyleDeclaration>;
    previewElementClass?: string;
    dragThreshold?: number;
    /**
     * Touch only: how long (ms) the finger must be held on an item before it can be dragged.
     * Moving the finger earlier scrolls the page instead. 0 = drag starts immediately (scrolling over items is not possible).
     */
    touchDelay?: number;
    /**
     * Mouse and pen: how long (ms) the button must be held on an item before it can be dragged.
     * Moving the pointer earlier cancels the drag. 0 = drag starts immediately.
     */
    mouseDelay?: number;
    /** auto scroll speed in px per second, default 500 */
    autoScrollSpeed?: number;
    /** distance in px from the edge of the viewport or a scrollable container where auto scroll starts, default 50 */
    autoScrollThreshold?: number;
    applyMove?: (payload: DropPayload) => void;
}

export interface DropPosition {
    list: HTMLElement;
    listId: string;
    index: number;
}

export interface DropPayload {
    item: HTMLElement;
    from: DropPosition;
    to: DropPosition & {
        parent: HTMLElement;
        before: Node | null;
    };
}

/** element position and size in the viewport */
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface ElementsAnimatorInterface {
    animationDuration: number;
    animationAttribute: string;
    isMovedAttribute: string;
    ignoreAttribute: string;

    isMoved(...el: HTMLElement[]): boolean;

    removeAnimation(target: HTMLElement): void;

    isInViewport(position: Rect): boolean;

    animate(el: HTMLElement, x: number, y: number, after?: () => void): void;

    animateElementsMovement(elements: HTMLElement[], movement: () => void): void;
}

export type Axis = 'x' | 'y';
export type Direction = 'f' | 'b';

export interface ScrollTarget {
    axis: Axis;
    direction: Direction;
    element: Element;
}

export interface AutoScrollerInterface {
    speed?: number;
    threshold?: number;

    shouldEnableAutoScroller(x: number, y: number, el?: Element | null): void;

    getViewportScrollTarget(x: number, y: number, el: Element): ScrollTarget | null;

    getContainerScrollTarget(x: number, y: number, el: Element): ScrollTarget | null;

    isRootElement(element: Element): boolean;

    isScrollable(axis: Axis, element: Element): boolean;

    isScrolledToEnd(axis: Axis, direction: Direction, element: Element): boolean;

    startScroller(axis: Axis, direction: Direction, scrollableElement: Element, distance: number): void;

    stopScroller(): void;
}

export interface EmitterInterface {
    on(eventName: string, listener: (data: any) => void): void;

    emit(eventName: string, data: any): void;

    clear(): void;
}

export interface EmitterEventInterface {
    [key: string]: ((data: any) => void)[];
}
