/** ----- Interfaces ----- **/
interface SimpleDragAndDropInterface {
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
interface SDDOptionsInterface {
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
export declare class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
  readonly options: SDDOptionsInterface;
  readonly root: HTMLElement;
  readonly applyMove: (payload: DropPayload) => void;
  readonly animationDuration: number;
  readonly draggedElementStyle: Partial<CSSStyleDeclaration> | null;
  readonly draggedElementClass: string;
  readonly previewElementStyle: Partial<CSSStyleDeclaration> | null;
  readonly previewElementClass: string;
  readonly dragThreshold: number;
  readonly touchDelay: number;
  readonly mouseDelay: number;
  private pendingDragStart;
  private activePointerId;
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
  private readonly handlePointerDown;
  private readonly handlePointerMove;
  private readonly handlePointerEnd;
  private readonly handlePointerCancel;
  private readonly handleKeyDown;
  private readonly preventDefault;
  private readonly preventDefaultUnlessTouchDelay;
  private readonly preventDefaultWhileDragging;
  on: (event: string, listener: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  /**
   * Constructor
   *
   * @param options
   */
  constructor(options: SDDOptionsInterface);
  init: () => void;
  /**
   * Add document listeners for the time of one drag (the pointer can leave root while dragging)
   *
   * touchmove is added on pointerdown, which comes before touchstart, so the browser knows it can block scrolling.
   */
  addDocumentListeners: () => void;
  /**
   * Remove document listeners added for one drag
   */
  removeDocumentListeners: () => void;
  /**
   * Cancel a drag that has not started yet (waiting for threshold or touch delay)
   */
  cancelPendingDrag: () => void;
  /**
   * Cancel the drag without a drop - the DOM is restored to the state before dragging
   *
   * applyMove is not called and the 'drop' event is not emitted.
   * Works also while the copy flies to the drop position.
   */
  cancelDrag: () => void;
  /**
   * Remove all event listeners(for SPA), a running drag is cancelled.
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
   * End of dragging - the dragged copy flies to the preview position, then finishDrop is called
   *
   * @param event pointerup, when omitted the drag is ended regardless of the pointer
   */
  onDragEnd: (event?: PointerEvent) => void;
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
   * Search List Element inside root
   *
   * @param listId
   */
  searchList: (listId: string) => HTMLElement | null;
  /**
   * Search List Element of list item
   *
   * Searches only the item ancestors, falls back to the whole root when the item is outside its list.
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
export type { DropPayload, DropPosition, SDDOptionsInterface };