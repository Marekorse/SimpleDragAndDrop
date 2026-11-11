/** ----- Interfaces ----- **/
interface SimpleDragAndDropInterface {
    options: SDDOptionsInterface;
    init(): void;
    clearEventListeners(): void;
    onDragStart(event: PointerEvent, clientX: number, clientY: number): void;
    onDragMove(event: PointerEvent, clientX: number, clientY: number): void;
    onDragEnd(): void;
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
interface SDDOptionsInterface {
    animationDuration?: number;
    draggedElementStyle?: Partial<CSSStyleDeclaration>;
    draggedElementClass?: string;
    previewElementStyle?: Partial<CSSStyleDeclaration>;
    previewElementClass?: string;
    dragThreshold?: number;
    /**
     * Moves the dropped item to its new place. Called only when the position changed, before the 'drop' event.
     * Default: inserts the item in the DOM (to.parent.insertBefore(item, to.before)).
     * In a framework update your data instead and let the framework move the element.
     */
    applyMove?: (payload: DropPayload) => void;
}
interface DropPosition {
    list: HTMLElement;
    listId: string;
    index: number;
}
interface DropPayload {
    item: HTMLElement;
    from: DropPosition;
    to: DropPosition & {
        parent: HTMLElement;
        before: Node | null;
    };
}
interface EmitterInterface {
    on(eventName: string, listener: (data: any) => void): void;
    emit(eventName: string, data: any): void;
}

declare class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
    readonly options: SDDOptionsInterface;
    readonly applyMove: (payload: DropPayload) => void;
    readonly animationDuration: number;
    readonly draggedElementStyle: Partial<CSSStyleDeclaration> | null;
    readonly draggedElementClass: string;
    readonly previewElementStyle: Partial<CSSStyleDeclaration> | null;
    readonly previewElementClass: string;
    readonly dragThreshold: number;
    private pendingDragStart;
    private draggedElement;
    private draggedElementOriginalIndex;
    private draggedElementPosition;
    private sourceElement;
    private readonly sourceElementOriginalDisplay;
    private previewElement;
    private previewElementList;
    private previewElementOriginalList;
    private enteredTarget;
    private readonly draggedElementAttribute;
    private readonly sourceElementAttribute;
    private readonly previewElementAttribute;
    private readonly previewElementOriginalListAttribute;
    private readonly previewElementListSharedAttribute;
    private readonly listSharedAttribute;
    private readonly listAttribute;
    private readonly listHasActionBtnAttribute;
    private readonly listItemActionBtnAttribute;
    private readonly listDragDisabledAttribute;
    private readonly listDropDisabledAttribute;
    private readonly listItemAttribute;
    private readonly listIdAttribute;
    private readonly autoScroller;
    private readonly ignoreElementAttribute;
    private readonly elementsAnimator;
    private elementsWithListeners;
    on: (event: string, listener: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
    /**
     * Constructor
     *
     * @param options
     */
    constructor(options?: SDDOptionsInterface);
    /**
     * Initialization
     *
     * Setup all attributes for HTML elements and event listeners.
     */
    init: () => void;
    /**
     * Remove all event listeners(for SPA).
     */
    clearEventListeners: () => void;
    /**
     * Validate dragged item and Setup base attributes for dragged item
     *
     * @param event
     * @param clientX
     * @param clientY
     */
    onDragStart(event: PointerEvent, clientX: number, clientY: number): void;
    /**
     * Basic Function for determining whether and where the dragged element should be placed
     *
     * @param event
     * @param x
     * @param y
     */
    onDragMove(event: PointerEvent, x: number, y: number): void;
    /**
     * Checks whether the positions of the items have been changed and fire "updated" event
     *
     */
    onDragEnd: () => void;
    /**
     * Hide the original list item while its copy is dragged, its inline display is saved
     *
     * @param sourceElement
     */
    hideSourceElement: (sourceElement: HTMLElement) => void;
    /**
     * Show the original list item again with its original inline display
     *
     * @param sourceElement
     */
    showSourceElement: (sourceElement: HTMLElement) => void;
    /**
     * End of drop - called when the dragged copy reached the preview position
     *
     * Calculates the drop position, restores the DOM to the state before dragging
     * (removes the copy and the preview, shows the original), moves the original via applyMove
     * when the position changed and emits the 'drop' event.
     *
     * @param previewElement
     * @param draggedElement dragged copy
     * @param sourceElement hidden original
     * @param previewElList list where the item was dropped
     * @param previewElOriginalList list where the item was dragged from
     * @param draggedElementOriginalIndex
     */
    finishDrop: (previewElement: HTMLElement, draggedElement: HTMLElement, sourceElement: HTMLElement, previewElList: HTMLElement, previewElOriginalList: HTMLElement, draggedElementOriginalIndex: number) => DropPayload;
    /**
     * Default applyMove - inserts the dropped item in the DOM (vanilla JS)
     *
     * @param payload
     */
    defaultApplyMove: (payload: DropPayload) => void;
    /**
     * calculation of where the element should be placed in the list
     *
     * @param previewElement
     * @param y
     * @param list
     */
    placeElementToList: (previewElement: HTMLElement, y: number, list: HTMLElement) => void;
    /**
     *  Placing the dragged element in the list based on direction and position
     *
     * @param clientY
     * @param listItem
     * @param previewElement
     */
    replaceElement: (clientY: number, listItem: HTMLElement, previewElement: HTMLElement) => void;
    /**
     * Create dragged element
     *
     * The dragged element is a copy of the target, all measurements are taken on the target.
     *
     * @param list
     * @param target
     * @param x
     * @param y
     */
    createDraggedElement: (list: HTMLElement, target: HTMLElement, x: number, y: number) => HTMLElement;
    /**
     * Create a visual copy of the list item for dragging
     *
     * @param target
     */
    createDraggedCopy: (target: HTMLElement) => HTMLElement;
    /**
     * Create placeholder element
     *
     */
    createPreviewElement: (list: HTMLElement, referenceElement: HTMLElement) => HTMLElement;
    /**
     * Reset Dragged item attributes
     *
     */
    resetDraggingState: () => void;
    /**
     * Update position for dragged element.
     *
     * @param draggedElement
     * @param x
     * @param y
     */
    updateDraggedElPosition: (draggedElement: HTMLElement, x: number, y: number) => void;
    /**
     * Search List Element
     *
     * @param listId
     */
    searchList: (listId: string) => HTMLElement | null;
    /**
     * Search List Element of list item
     *
     * Searches only the item ancestors, falls back to the whole document when the item is outside its list.
     *
     * @param listItem
     */
    searchListOfItem: (listItem: HTMLElement) => HTMLElement | null;
    /**
     * Search List items Element
     *
     * Only items belonging to the list (by list id), items of nested lists are excluded.
     * The hidden original of the dragged item is excluded as well.
     *
     * @param list
     */
    searchListItems: (list: HTMLElement) => NodeListOf<HTMLElement> | null;
}

export { type DropPayload, type DropPosition, type SDDOptionsInterface, SimpleDragAndDrop };
