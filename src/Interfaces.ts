/** ----- Interfaces ----- **/

export interface SimpleDragAndDropInterface {
    options: SDDOptionsInterface;

    init(): void;

    clearEventListeners(): void;

    addDocumentListeners(): void;

    removeDocumentListeners(): void;

    cancelPendingDrag(): void;

    cancelDrag(): void;

    onDragStart(event: PointerEvent, clientX: number, clientY: number): void;

    onDragMove(event: PointerEvent, clientX: number, clientY: number): void;

    onDragEnd(event?: PointerEvent): void;

    finishDrop(previewElement: HTMLElement, draggedElement: HTMLElement, sourceElement: HTMLElement, previewElList: HTMLElement, previewElOriginalList: HTMLElement, draggedElementOriginalIndex: number): DropPayload;


    createDraggedCopy(target: HTMLElement): HTMLElement;

    hideSourceElement(sourceElement: HTMLElement): void;

    showSourceElement(sourceElement: HTMLElement): void;

    defaultApplyMove(payload: DropPayload): void;

    placeElementToList(draggedElement: HTMLElement, y: number, list: HTMLElement): void;

    replaceElement(clientY: number, target: HTMLElement, draggedElement: HTMLElement): void;

    createDraggedElement(list: HTMLElement, target: HTMLElement, x: number, y: number): HTMLElement;

    createPreviewElement(list: HTMLElement, referenceElement: HTMLElement): HTMLElement;

    resetDraggingState(): void;

    updateDraggedElPosition(draggedEl: HTMLElement, x: number, y: number): void;

    searchList(listId: string): HTMLElement | null;

    searchListOfItem(listItem: HTMLElement): HTMLElement | null;

    searchListItems(list: HTMLElement): NodeListOf<HTMLElement> | null;
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

export interface ElementsAnimatorInterface {
    animationDuration: number;
    animationAttribute: string;
    isMovedAttribute: string;
    ignoreAttribute: string;

    isMoved(...el: HTMLElement[]): boolean;

    removeAnimation(target: HTMLElement): void;

    isInViewport(position: { x: number; y: number; w: number; h: number }): boolean;

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
}

export interface EmitterEventInterface {
    [key: string]: ((data: any) => void)[];
}
