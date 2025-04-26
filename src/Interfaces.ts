/** ----- Interfaces ----- **/

export interface SimpleDragAndDropInterface {
  options: SDDOptionsInterface;

  init(): void;

  clearEventListeners(): void;

  onDragStart(event: MouseEvent | TouchEvent, clientX: number, clientY: number): void;

  onDragMove(event: MouseEvent | TouchEvent, target: EventTarget | null, clientX: number, clientY: number): void;

  onDragEnd(): void;

  replacePreviewElementWithDraggedElement(previewElement: HTMLElement, draggedElement: HTMLElement): void;

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

export interface SDDOptionsInterface {
  animationDuration?: number;
  draggedElementStyle?: Partial<CSSStyleDeclaration>;
  draggedElementClass?: string;
  previewElementStyle?: Partial<CSSStyleDeclaration>;
  previewElementClass?: string;
}

export interface ElementsAnimatorInterface {
  animationDuration: number;
  oldPositionAttribute: string;
  animationAttribute: string;
  isMovedAttribute: string;
  ignoreAttribute: string;

  isMoved(...el: HTMLElement[]): boolean;

  removeAnimation(target: HTMLElement): void;

  saveElementPosition(el: HTMLElement, position: { x: number; y: number; w: number; h: number }): HTMLElement;

  moveToSavedPosition(el: HTMLElement): void;

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
