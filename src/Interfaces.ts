/** ----- Interfaces ----- **/

export interface SimpleDragAndDropInterface {
  options: SDDOptionsInterface;

  init(): void;

  clearEventListeners(): void;

  onDragStart(event: PointerEvent, clientX: number, clientY: number): void;

  onDragMove(event: PointerEvent, clientX: number, clientY: number): void;

  onDragEnd(): void;

  replacePreviewElementWithDraggedElement(previewElement: HTMLElement, draggedElement: HTMLElement,draggedElementOriginalStyle:string): void;

  checksElementsUpdates(previewElList: HTMLElement, previewElOriginalList: HTMLElement, previewElement: HTMLElement, draggedElement: HTMLElement, draggedElementOriginalIndex: number): void;

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
  animationDuration?: number;
  draggedElementStyle?: Partial<CSSStyleDeclaration>;
  draggedElementClass?: string;
  previewElementStyle?: Partial<CSSStyleDeclaration>;
  previewElementClass?: string;
  dragThreshold?: number;
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

export interface EmitterInterface {
  on(eventName: string, listener: (data: any) => void): void;

  emit(eventName: string, data: any): void;
}

export interface EmitterEventInterface {
  [key: string]: ((data: any) => void)[];
}
