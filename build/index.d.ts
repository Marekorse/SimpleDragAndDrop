declare module '@marekorse/simple-drag-and-drop/AutoScroller' {
  export interface AutoScrollerInterface {
      speed?: number;
      threshold?: number;
      shouldEnableAutoScroller(x: number, y: number): void;
      getLastScrollableElementOnAxis(axis: string, direction: string, currentEl: HTMLElement, actualScrollAction: number): void;
      isScrollable(axis: string, element: HTMLElement): boolean;
      isScrolledToEnd(axis: string, direction: string, element: HTMLElement): boolean;
      isFullyVisibleOnAxis(axis: string, el: HTMLElement, parentEl: HTMLElement): boolean;
      startScroller(axis: string, direction: String, scrollableElement: HTMLElement, distance: number): void;
      stopScroller(): void;
  }
  /**
   *
   * Auto scroller.
   *
   * Extension that ensures smooth scrolling of the screen and elements while dragging the element.
   *
   */
  export default class AutoScroller implements AutoScrollerInterface {
      private readonly scrollToPositionThreshold;
      private readonly scrollSpeed;
      private startTime;
      private scrollAnimationState;
      private actualScrollAction;
      /**
       * Constructor
       *
       * @param speed
       * @param threshold
       */
      constructor(speed?: number, threshold?: number);
      /**
       * Check if auto-scrolling is required based on the current position and thresholds,
       * and trigger the auto-scroller if necessary.
       *
       * @param x
       * @param y
       */
      shouldEnableAutoScroller(x: number, y: number): void;
      getLastScrollableElementOnAxis(axis: string, direction: string, currentEl: HTMLElement, actualScrollAction: number): void;
      scrollElement(axis: string, direction: string, el: HTMLElement, actualScrollAction: number): void;
      isScrollable(axis: string, element: HTMLElement): boolean;
      isScrolledToEnd: (axis: string, direction: string, element: HTMLElement) => boolean;
      /**
       * calculate distance and start scrolling
       *
       * @param axis
       * @param direction
       * @param scrollableElement
       * @param distance
       */
      startScroller(axis: string, direction: String, scrollableElement: HTMLElement, distance?: number): void;
      isFullyVisibleOnAxis(axis: string, el: HTMLElement, parentEl: HTMLElement): boolean;
      /**
       * Get first fully visible element on selected axis
       */
      getFirstFullyVisibleElementOnAxis(axis: string, el: HTMLElement): HTMLElement;
      /**
       * stop scroller
       */
      stopScroller(): void;
  }

}
declare module '@marekorse/simple-drag-and-drop/ElementsAnimator' {
  import { ElementsAnimatorInterface } from '@marekorse/simple-drag-and-drop/Interfaces';
  export class ElementsAnimator implements ElementsAnimatorInterface {
      readonly animationDuration: number;
      readonly oldPositionAttribute: string;
      readonly animationAttribute: string;
      readonly isMovedAttribute: string;
      readonly ignoreAttribute: string;
      /**
       * Constructor
       *
       * @param animationDuration
       * @param oldPositionAttribute
       * @param animationAttribute
       * @param isMovedAttribute
       * @param ignoreAttribute
       */
      constructor(animationDuration?: number, ignoreAttribute?: string, animationAttribute?: string, isMovedAttribute?: string, oldPositionAttribute?: string);
      /**
       * Check if the element is moving
       *
       * @param el
       */
      isMoved(...el: HTMLElement[]): boolean;
      /**
       * Reset element animations
       *
       * @param target
       */
      removeAnimation: (target: HTMLElement) => void;
      /**
       * save the current position of the element
       *
       * @param el
       * @param position
       */
      saveElementPosition: (el: HTMLElement, position: {
          x: number;
          y: number;
          w: number;
          h: number;
      }) => HTMLElement;
      /**
       * move element to saved position
       *
       * @param el
       */
      moveToSavedPosition: (el: HTMLElement) => void;
      /**
       * start animation
       *
       * @param el
       * @param x
       * @param y
       * @param after
       */
      animate: (el: HTMLElement, x?: number, y?: number, after?: () => void) => void;
      /**
       * Animate elements
       *
       * @param elements
       * @param movement
       */
      animateElementsMovement: (elements: HTMLElement[], movement: () => void) => void;
  }

}
declare module '@marekorse/simple-drag-and-drop/Emitter' {
  import { EmitterInterface } from '@marekorse/simple-drag-and-drop/Interfaces';
  export const createEmitter: () => EmitterInterface;

}
declare module '@marekorse/simple-drag-and-drop/Helpers' {
  /** ----- Helper functions ----- **/
  /**
   * Searches for the first HTML element that meets a specified condition.
   *
   * The search is upwards
   *
   * @param el
   * @param condition
   */
  export const searchParentElement: (el: EventTarget, condition: (el: HTMLElement) => boolean) => HTMLElement | null;
  /**
   * Get html element child nodes.
   *
   * @param el
   */
  export const getHtmlChildNodes: (el: HTMLElement) => HTMLElement[];
  /**
   * Create an array containing a sequence of numbers between start and end
   *
   * @param start
   * @param end
   */
  export const createRangeFromIndexes: (start: number, end: number) => number[];
  /**
   * Get elements array from indexes
   *
   * @param elements
   * @param start
   * @param end
   */
  export const getElementsFromIndexes: (elements: HTMLElement[], start: number, end: number) => HTMLElement[];
  /**
   * Get element index in parent node
   *
   * @param parentEl
   * @param el
   */
  export const getChildIndex: (parentEl: HTMLElement, el: HTMLElement) => number;
  /**
   * Get element bounding client rect
   *
   * @param target
   */
  export const getActualPosition: (target: HTMLElement) => {
      x: number;
      y: number;
      w: number;
      h: number;
  };
  /**
   * Add multiple classes to element
   *
   * @param element
   * @param classString
   */
  export const addMultipleClasses: (element: HTMLElement, classString: string) => void;
  /**
   * Remove multiple classes to element
   *
   * @param element
   * @param classString
   */
  export const removeMultipleClasses: (element: HTMLElement, classString: string) => void;

}
declare module '@marekorse/simple-drag-and-drop/Interfaces' {
  /** ----- Interfaces ----- **/
  export interface SimpleDragAndDropInterface {
      options: SDDOptionsInterface;
      init(): void;
      clearEventListeners(): void;
      onDragStart(event: MouseEvent | TouchEvent, clientX: number, clientY: number): void;
      onDragMove(event: MouseEvent | TouchEvent, target: EventTarget | null, clientX: number, clientY: number): void;
      onDragEnd(): void;
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
      previewElement?: HTMLElement;
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
      saveElementPosition(el: HTMLElement, position: {
          x: number;
          y: number;
          w: number;
          h: number;
      }): HTMLElement;
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

}
declare module '@marekorse/simple-drag-and-drop/SimpleDragAndDrop' {
  import { SDDOptionsInterface, SimpleDragAndDropInterface, EmitterInterface } from '@marekorse/simple-drag-and-drop/Interfaces';
  export class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
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
      private readonly listActionBtnAttribute;
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
       * calculation of where the element should be placed in the list
       *
       * @param previewEl
       * @param y
       * @param list
       */
      placeElementToList: (previewEl: HTMLElement, y: number, list: HTMLElement) => void;
      /**
       *  Placing the dragged element in the list based on direction and position
       *
       * @param clientY
       * @param listItem
       * @param previewEl
       */
      replaceElement: (clientY: number, listItem: HTMLElement, previewEl: HTMLElement) => void;
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
       * @param draggedEl
       * @param x
       * @param y
       */
      updateDraggedElPosition: (draggedEl: HTMLElement, x: number, y: number) => void;
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
       * @param previewEl
       */
      savePreviewElPosition: (previewEl: HTMLElement) => void;
  }

}
declare module '@marekorse/simple-drag-and-drop' {
  import main = require('@marekorse/simple-drag-and-drop/index');
  export = main;
}