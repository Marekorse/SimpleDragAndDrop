/** ----- Interfaces ----- **/
interface SimpleDragAndDropInterface {
    options: SDDOptionsInterface;
    init(): void;
    clearEventListeners(): void;
    onDragStart(event: MouseEvent | TouchEvent, clientX: number, clientY: number): void;
    onDragMove(event: MouseEvent | TouchEvent, target: EventTarget | null, clientX: number, clientY: number): void;
    onDragEnd(): void;
    replacePreviewElementWithDraggedElement(previewElement: HTMLElement, draggedElement: HTMLElement, draggedElementOriginalStyle: string): void;
    checksElementsUpdates(previewElList: HTMLElement, previewElOriginalList: HTMLElement, previewElement: HTMLElement, draggedElement: HTMLElement, draggedElementOriginalIndex: number): void;
    placeElementToList(draggedElement: HTMLElement, y: number, list: HTMLElement): void;
    replaceElement(clientY: number, target: HTMLElement, draggedElement: HTMLElement): void;
    createDraggedElement(list: HTMLElement, target: HTMLElement, x: number, y: number): HTMLElement;
    createPreviewElement(list: HTMLElement, referenceElement: HTMLElement): HTMLElement;
    resetDraggingState(): void;
    updateDraggedElPosition(draggedEl: HTMLElement, x: number, y: number): void;
    searchList(listId: string): HTMLElement | null;
    searchListItems(list: HTMLElement): NodeListOf<HTMLElement> | null;
    savePreviewElPosition(previewEl: HTMLElement): void;
}
interface SDDOptionsInterface {
    animationDuration?: number;
    draggedElementStyle?: Partial<CSSStyleDeclaration>;
    draggedElementClass?: string;
    previewElementStyle?: Partial<CSSStyleDeclaration>;
    previewElementClass?: string;
}
interface EmitterInterface {
    on(eventName: string, listener: (data: any) => void): void;
    emit(eventName: string, data: any): void;
}

declare class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
    readonly options: SDDOptionsInterface;
    readonly animationDuration: number;
    readonly draggedElementStyle: Partial<CSSStyleDeclaration> | null;
    readonly draggedElementClass: string;
    readonly previewElementStyle: Partial<CSSStyleDeclaration> | null;
    readonly previewElementClass: string;
    private draggedElement;
    private draggedElementOriginalIndex;
    private draggedElementPosition;
    private originalStyle;
    private previewElement;
    private previewElementList;
    private previewElementOriginalList;
    private enteredTarget;
    private readonly draggedElementAttribute;
    private readonly previewElementAttribute;
    private readonly previewElementOriginalListAttribute;
    private readonly previewElementListSharedAttribute;
    private readonly previewElementDestinationPositionAttribute;
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
    constructor(options: SDDOptionsInterface);
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
    onDragStart(event: MouseEvent | TouchEvent, clientX: number, clientY: number): void;
    /**
     * Basic Function for determining whether and where the dragged element should be placed
     *
     * @param event
     * @param target
     * @param x
     * @param y
     */
    onDragMove(event: MouseEvent | TouchEvent, target: EventTarget | HTMLElement | null, x: number, y: number): void;
    /**
     * Checks whether the positions of the items have been changed and fire "updated" event
     *
     */
    onDragEnd: () => void;
    /**
     * Replace preview element with dragged element
     *
     * @param previewElement
     * @param draggedElement
     * @param draggedElementOriginalStyle
     */
    replacePreviewElementWithDraggedElement: (previewElement: HTMLElement, draggedElement: HTMLElement, draggedElementOriginalStyle: string) => void;
    /**
     * Checks if elements positions have changed, and dispatches an event if a modification is detected.
     *
     * @param previewElList
     * @param previewElOriginalList
     * @param previewElement
     * @param draggedElement
     * @param draggedElementOriginalIndex
     */
    checksElementsUpdates: (previewElList: HTMLElement, previewElOriginalList: HTMLElement, previewElement: HTMLElement, draggedElement: HTMLElement, draggedElementOriginalIndex: number) => void;
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
     * @param list
     * @param target
     * @param x
     * @param y
     */
    createDraggedElement: (list: HTMLElement, target: HTMLElement, x: number, y: number) => HTMLElement;
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
     * Search List items Element
     *
     * @param list
     */
    searchListItems: (list: HTMLElement) => NodeListOf<HTMLElement> | null;
    /**
     * Save current position for preview element
     *
     * @param previewElement
     */
    savePreviewElPosition: (previewElement: HTMLElement) => void;
}

export { SimpleDragAndDrop };
