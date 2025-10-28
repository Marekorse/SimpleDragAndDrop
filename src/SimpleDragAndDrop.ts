//TODO:: Multi drag
//TODO:: Locknutie OSY
//TODO:: Skus viac typov animacii
//TODO:: Ak si trufas sprav dalsiu verziu SDD kde bude tahat elementy v gride nie v listoch :)

import AutoScroller from './AutoScroller';
import {ElementsAnimator} from './ElementsAnimator';
import {createEmitter} from './Emitter';
import {
    addMultipleClasses,
    getActualPosition,
    getElementsFromIndexes,
    removeMultipleClasses,
    searchParentElement
} from './Helpers';
import {EmitterInterface, SDDOptionsInterface, SimpleDragAndDropInterface} from './Interfaces';

export class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
    public readonly options!: SDDOptionsInterface;
    public readonly animationDuration: number;
    public readonly draggedElementStyle: Partial<CSSStyleDeclaration> | null;
    public readonly draggedElementClass: string;
    public readonly previewElementStyle: Partial<CSSStyleDeclaration> | null;
    public readonly previewElementClass: string;

    private draggedElement: HTMLElement | null;
    private draggedElementOriginalIndex: number | null;
    private draggedElementPosition: {
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
        directionY: number;
        directionX: number;
    };
    private originalStyle: string;
    private previewElement: HTMLElement | null;
    private previewElementList: HTMLElement | null;
    private previewElementOriginalList: HTMLElement | null;
    private enteredTarget: HTMLElement | null;

    private readonly draggedElementAttribute: string;
    private readonly previewElementAttribute: string;
    private readonly previewElementOriginalListAttribute: string;
    private readonly previewElementListSharedAttribute: string;
    private readonly previewElementDestinationPositionAttribute: string;
    private readonly listSharedAttribute: string;
    private readonly listAttribute: string;
    private readonly listHasActionBtnAttribute: string;
    private readonly listItemActionBtnAttribute: string;
    private readonly listDragDisabledAttribute: string;
    private readonly listDropDisabledAttribute: string;
    private readonly listItemAttribute: string;
    private readonly listIdAttribute: string;
    private readonly autoScroller: AutoScroller;
    private readonly ignoreElementAttribute: string;
    private readonly elementsAnimator: ElementsAnimator;
    private elementsWithListeners: any[];

    on!: (event: string, listener: (...args: any[]) => void) => void;
    emit!: (event: string, ...args: any[]) => void;

    /**
     * Constructor
     *
     * @param options
     */
    constructor(options: SDDOptionsInterface) {
        //PARAMS
        this.animationDuration = options.animationDuration ?? 150;
        this.previewElementStyle = options.previewElementStyle ?? null;
        this.previewElementClass = options.previewElementClass ?? '';
        this.draggedElementStyle = options.draggedElementStyle ?? null;
        this.draggedElementClass = options.draggedElementClass ?? '';
        this.previewElement = null;
        this.previewElementList = null;
        this.previewElementOriginalList = null;

        //STATE
        this.draggedElement = null;
        this.draggedElementOriginalIndex = null;
        this.draggedElementPosition = {
            x: 0,
            y: 0,
            offsetX: 0,
            offsetY: 0,
            directionY: 0,
            directionX: 0
        };

        this.originalStyle = '';
        this.enteredTarget = null;

        //DATA ATTRIBUTES
        this.draggedElementAttribute = 'data-dragging';
        this.previewElementAttribute = 'data-preview';
        this.previewElementOriginalListAttribute = 'data-prev-orig-list';
        this.previewElementListSharedAttribute = 'data-prev-list-shared';
        this.previewElementDestinationPositionAttribute = 'data-prev-destination-position';
        this.listSharedAttribute = 'data-list-shared';
        this.listAttribute = 'data-list';
        this.listHasActionBtnAttribute = 'data-list-has-action-btn';
        this.listDragDisabledAttribute = 'data-list-drag-disabled';
        this.listDropDisabledAttribute = 'data-list-drop-disabled';
        this.listItemAttribute = 'data-list-item';
        this.listIdAttribute = 'data-list-id';
        this.listItemActionBtnAttribute = 'data-list-item-action-btn';

        //AUTO SCROLLER
        this.autoScroller = new AutoScroller(500, 50);

        //ELEMENTS ANIMATOR
        this.ignoreElementAttribute = 'data-el-ignore';
        this.elementsAnimator = new ElementsAnimator(this.animationDuration, this.ignoreElementAttribute);

        //EVENTS
        Object.assign(this, createEmitter());
        this.elementsWithListeners = [];

        this.init();
    }

    /**
     * Initialization
     *
     * Setup all attributes for HTML elements and event listeners.
     */
    init = (): void => {
        //CREATE EVENT LISTENERS
        const onDragStart = (e: MouseEvent) => this.onDragStart(e, e.clientX, e.clientY);
        document.addEventListener('mousedown', onDragStart);

        const onTouchStart = (e: TouchEvent) => this.onDragStart(e, e.touches[0].clientX, e.touches[0].clientY);
        document.addEventListener('touchstart', onTouchStart, {
            passive: false
        });

        const onDragEnd = () => this.onDragEnd();
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchend', onDragEnd);

        const onDragMove = (e: MouseEvent) => this.onDragMove(e, e.target, e.clientX, e.clientY);
        document.addEventListener('mousemove', onDragMove, {
            passive: false
        });

        const onTouchMove = (e: TouchEvent) =>
            this.onDragMove(e, document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY), e.touches[0].clientX, e.touches[0].clientY);
        document.addEventListener('touchmove', onTouchMove, {
            passive: false
        });

        //SAVE LISTENERS REFERENCE TO VARIABLE
        this.elementsWithListeners.push({
            el: document,
            events: {
                mousedown: onDragStart,
                touchstart: onTouchStart,

                mouseup: onDragEnd,
                touchend: onDragEnd,

                mousemove: onDragMove,
                onTouchmove: onTouchMove
            }
        });
    };

    /**
     * Remove all event listeners(for SPA).
     */
    clearEventListeners = (): void => {
        this.elementsWithListeners.forEach((listener) => {
            for (const [key, value] of Object.entries(listener.events)) {
                listener.el.removeEventListener(key, value);
            }
        });
    };

    /**
     * Validate dragged item and Setup base attributes for dragged item
     *
     * @param event
     * @param clientX
     * @param clientY
     */
    onDragStart(event: MouseEvent | TouchEvent, clientX: number, clientY: number): void {
        const target = event.target;

        //left mouse
        if (event instanceof MouseEvent && event.button !== 0) {
            return;
        }

        if (!this.draggedElement && target instanceof HTMLElement) {
            const listItem: HTMLElement | null = searchParentElement(
                target,
                (el) => el.hasAttribute(this.listItemAttribute) && el.hasAttribute(this.listIdAttribute)
            );

            const list: HTMLElement | null = this.searchList(String(listItem?.getAttribute(this.listIdAttribute)));


            if (listItem && list) {
                const actionBtnElement = list.hasAttribute(this.listHasActionBtnAttribute)
                    ? searchParentElement(target, (el) => el.hasAttribute(this.listItemActionBtnAttribute), listItem)
                    : null;

                if (!this.elementsAnimator.isMoved(listItem) && !list.hasAttribute(this.listDragDisabledAttribute) && listItem.parentElement && (!list.hasAttribute(this.listHasActionBtnAttribute) || actionBtnElement)) {

                    event.preventDefault();

                    this.previewElement = this.createPreviewElement(list, listItem);
                    this.draggedElement = this.createDraggedElement(list, listItem, clientX, clientY);
                    listItem.parentElement.insertBefore(this.previewElement, listItem);
                    this.savePreviewElPosition(this.previewElement);
                    document.body.appendChild(this.draggedElement);
                    this.enteredTarget = this.previewElement;
                    this.emit('dragStart', listItem);
                }
            }
        }
    }

    /**
     * Basic Function for determining whether and where the dragged element should be placed
     *
     * @param event
     * @param target
     * @param x
     * @param y
     */
    onDragMove(event: MouseEvent | TouchEvent, target: EventTarget | HTMLElement | null, x: number, y: number) {
        const draggedElement = this.draggedElement as HTMLElement;
        const previewElement = this.previewElement as HTMLElement;

        if (target && draggedElement && previewElement) {
            event.preventDefault();
            this.updateDraggedElPosition(draggedElement, x, y);

            const item = searchParentElement(
                target,
                (el) =>
                    el.hasAttribute(this.listItemAttribute) || el.hasAttribute(this.listAttribute) || el.hasAttribute(this.previewElementAttribute)
            );


            if (item && item !== previewElement && !this.elementsAnimator.isMoved(item, previewElement)) {
                //SIMULATION OF DRAGENTER EVENT
                const dragEnter = previewElement !== item && this.enteredTarget !== item;

                this.enteredTarget = item;
                const list = item.hasAttribute(this.listAttribute) ? item : this.searchList(String(item.getAttribute(this.listIdAttribute)))!;
                const isShared = previewElement.getAttribute(this.previewElementListSharedAttribute) === list.getAttribute(this.listSharedAttribute);
                const dropDisabled = list.hasAttribute(this.listDropDisabledAttribute);

                if (!dropDisabled && isShared) {
                    //DRAGENTER
                    if (dragEnter) {
                        if (item.hasAttribute(this.listAttribute)) {
                            this.placeElementToList(previewElement, y, item);
                        } else {
                            this.replaceElement(y, item, previewElement);
                        }
                        this.enteredTarget = previewElement;

                        this.emit('dragEnter', item);
                    } else {
                        //DRAGOVER
                        const {directionY, y: draggedY} = this.draggedElementPosition;

                        if (!item.hasAttribute(this.listAttribute) && ((directionY === 1 && y < draggedY) || (directionY === -1 && y > draggedY))) {
                            this.replaceElement(y, item, previewElement);
                        }
                    }
                }
            }

            if (this.draggedElementPosition.x !== x) {
                Object.assign(this.draggedElementPosition, {
                    x: x,
                    directionX: x > this.draggedElementPosition.x ? 1 : -1
                });
            }

            if (this.draggedElementPosition.y !== y) {
                Object.assign(this.draggedElementPosition, {
                    y: y,
                    directionY: y > this.draggedElementPosition.y ? 1 : -1
                });
            }

            this.draggedElementPosition.x = x;
            this.draggedElementPosition.y = y;

            this.emit('dragOver', item);
            this.autoScroller.shouldEnableAutoScroller(x, y);
        }
    }

    /**
     * Checks whether the positions of the items have been changed and fire "updated" event
     *
     */
    onDragEnd = (): void => {
        this.autoScroller.stopScroller();

        const draggedElement = this.draggedElement as HTMLElement;
        const previewElement = this.previewElement as HTMLElement;
        const previewElList = this.previewElementList as HTMLElement;
        const previewElOriginalList = this.previewElementOriginalList as HTMLElement;
        const draggedElementOriginalIndex = this.draggedElementOriginalIndex as number;
        const draggedElementOriginalStyle = this.originalStyle as string;

        if (draggedElement && previewElement) {
            const computedStyle = window.getComputedStyle(previewElement);

            if (this.animationDuration !== 0) {
                const previewElPosition = String(previewElement.getAttribute(this.previewElementDestinationPositionAttribute));
                const position = previewElPosition ? JSON.parse(previewElPosition) : getActualPosition(previewElement);
                const marginLeft = parseFloat(computedStyle.marginLeft);
                const marginTop = parseFloat(computedStyle.marginTop);

                this.elementsAnimator.animate(draggedElement, position.x - marginLeft, position.y - marginTop, () => {
                    this.replacePreviewElementWithDraggedElement(previewElement, draggedElement, draggedElementOriginalStyle);
                    this.checksElementsUpdates(previewElList, previewElOriginalList, previewElement, draggedElement, draggedElementOriginalIndex);
                });
            } else {
                this.replacePreviewElementWithDraggedElement(previewElement, draggedElement, draggedElementOriginalStyle);
                this.checksElementsUpdates(previewElList, previewElOriginalList, previewElement, draggedElement, draggedElementOriginalIndex);
            }

            this.resetDraggingState();
            this.emit('dragEnd');
        }
    };

    /**
     * Replace preview element with dragged element
     *
     * @param previewElement
     * @param draggedElement
     * @param draggedElementOriginalStyle
     */
    replacePreviewElementWithDraggedElement = (previewElement: HTMLElement, draggedElement: HTMLElement, draggedElementOriginalStyle: string): void => {
        previewElement.replaceWith(draggedElement);
        draggedElement.setAttribute(this.listIdAttribute, String(previewElement.getAttribute(this.listIdAttribute)));

        if (this.draggedElementClass) {
            removeMultipleClasses(draggedElement, this.draggedElementClass);
        }

        draggedElement.style.cssText = draggedElementOriginalStyle;
    };

    /**
     * Checks if elements positions have changed, and dispatches an event if a modification is detected.
     *
     * @param previewElList
     * @param previewElOriginalList
     * @param previewElement
     * @param draggedElement
     * @param draggedElementOriginalIndex
     */
    checksElementsUpdates = (
        previewElList: HTMLElement,
        previewElOriginalList: HTMLElement,
        previewElement: HTMLElement,
        draggedElement: HTMLElement,
        draggedElementOriginalIndex: number
    ): void => {
        const listItems = Array.from(this.searchListItems(previewElList) as NodeList);
        const draggedElIndex = listItems.indexOf(draggedElement);

        const updatedList: Array<any> = [];

        if (previewElList.getAttribute(this.listAttribute) !== previewElement.getAttribute(this.previewElementOriginalListAttribute)) {
            const previewElOriginalListItems = Array.from(this.searchListItems(previewElOriginalList) as NodeList);
            const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList);

            updatedList.push(previewElOriginalListItems, previewElListItems);

        } else if (draggedElIndex !== draggedElementOriginalIndex) {
            const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList);

            updatedList.push(previewElListItems);
        }

        // FIRE EVENT
        if (updatedList.length > 0) {
            this.emit('itemsUpdated', updatedList);
        }
    };

    /**
     * calculation of where the element should be placed in the list
     *
     * @param previewElement
     * @param y
     * @param list
     */
    placeElementToList = (previewElement: HTMLElement, y: number, list: HTMLElement): void => {
        const listItems = Array.from(this.searchListItems(list) as NodeList) as HTMLElement[];
        const previewElList = this.previewElementList as HTMLElement;
        const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList) as HTMLElement[];
        const previewElIndex = previewElListItems.indexOf(previewElement);
        const previewElElementsForAnimation = getElementsFromIndexes(previewElListItems, previewElIndex, previewElListItems.length - 1);

        if (listItems.length === 0) {
            this.elementsAnimator.animateElementsMovement(previewElElementsForAnimation, () => {
                list.insertBefore(previewElement, null);
                this.savePreviewElPosition(previewElement);
            });

            previewElement.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
            this.previewElementList = list;

            return;
        }

        const lastElementPosition = getActualPosition(listItems[listItems.length - 1]);

        if (y > lastElementPosition.y + lastElementPosition.h) {
            this.elementsAnimator.animateElementsMovement(previewElElementsForAnimation, () => {
                list.appendChild(previewElement);
                this.savePreviewElPosition(previewElement);
            });

            previewElement.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
            this.previewElementList = list;

            return;
        }
    };

    /**
     *  Placing the dragged element in the list based on direction and position
     *
     * @param clientY
     * @param listItem
     * @param previewElement
     */
    replaceElement = (clientY: number, listItem: HTMLElement, previewElement: HTMLElement): void => {
        const listItemParentEl = listItem.parentNode as HTMLElement;
        const list = this.searchList(String(listItem.getAttribute(this.listIdAttribute))) as HTMLElement;
        const listItems = Array.from(this.searchListItems(list) as NodeList) as HTMLElement[];
        const listItemIndex = listItems.indexOf(listItem);
        const previewElList = this.previewElementList as HTMLElement;
        const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList) as HTMLElement[];
        const previewElIndex = previewElListItems.indexOf(previewElement);

        //ELEMENT FROM ANOTHER LIST DOES NOT REQUIRE CALCULATION
        if (previewElList.getAttribute(this.listAttribute) !== list.getAttribute(this.listAttribute)) {
            const previewElElementsForAnimation = getElementsFromIndexes(previewElListItems, previewElIndex, previewElListItems.length - 1);
            const elementsForAnimation = getElementsFromIndexes(listItems, listItemIndex, listItems.length - 1);
            const AllElementForAnimation = previewElElementsForAnimation.concat(elementsForAnimation);

            this.elementsAnimator.animateElementsMovement(AllElementForAnimation, () => {
                listItemParentEl.insertBefore(previewElement, listItem);
                this.savePreviewElPosition(previewElement);
            });

            this.previewElementList = list;
            previewElement.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
            return;
        }

        //CALCULATE CENTER POINT OF ELEMENT
        const listItemRect = listItem.getBoundingClientRect();
        const ListItemCenterPoint = listItemRect.y + listItemRect.height / 2;
        const elementsForAnimation = getElementsFromIndexes(listItems, previewElIndex, listItemIndex);

        if (clientY > ListItemCenterPoint) {
            if (listItemIndex > Number(previewElIndex)) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex].nextElementSibling);
                    this.savePreviewElPosition(previewElement);
                });
            } else {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex]);
                    this.savePreviewElPosition(previewElement);
                });
            }
        } else if (clientY < ListItemCenterPoint) {
            if (listItemIndex < Number(previewElIndex)) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex]);
                    this.savePreviewElPosition(previewElement);
                });
            } else if (listItemIndex >= 0 && listItemIndex < listItems.length) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex].nextElementSibling);
                    this.savePreviewElPosition(previewElement);
                });
            }
        }

        previewElement.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
        this.previewElementList = list;
    };

    /**
     * Create dragged element
     *
     * @param list
     * @param target
     * @param x
     * @param y
     */
    createDraggedElement = (list: HTMLElement, target: HTMLElement, x: number, y: number): HTMLElement => {
        window.getSelection()?.removeAllRanges();

        const draggedElement = target;
        const computedStyle = window.getComputedStyle(draggedElement as HTMLElement);
        const marginLeft = parseFloat(computedStyle.marginLeft);
        const marginTop = parseFloat(computedStyle.marginTop);
        const listStyleType = computedStyle.getPropertyValue('list-style-type');

        //calculate offset
        const targetRect = draggedElement.getBoundingClientRect();
        Object.assign(this.draggedElementPosition, {
            x: x,
            y: y,
            offsetX: x - targetRect.x + marginLeft,
            offsetY: y - targetRect.y + marginTop
        });

        const listItems = Array.from(this.searchListItems(list) as NodeList);
        this.draggedElementOriginalIndex = listItems.indexOf(target);

        //set data attributes
        draggedElement.setAttribute(this.draggedElementAttribute, '');
        draggedElement.setAttribute(this.ignoreElementAttribute, '');

        //save original attributes
        this.originalStyle = draggedElement.style.cssText;

        //set style attributes
        const rect: DOMRect = draggedElement.getBoundingClientRect();
        draggedElement.style.setProperty('width', `${rect.width}px`, 'important');
        draggedElement.style.setProperty('height', `${rect.height}px`, 'important');
        draggedElement.style.setProperty('z-index', '999999', 'important');

        if (listStyleType) {
            draggedElement.style.listStyleType = listStyleType;
        }

        //apply custom styles
        if (this.draggedElementStyle) {
            for (const [key, value] of Object.entries(this.draggedElementStyle)) {
                if (draggedElement.style.hasOwnProperty(key)) {
                    draggedElement.style.setProperty(key, value as string);
                }
            }
        }

        //apply custom classes
        if (this.draggedElementClass) {
            addMultipleClasses(draggedElement, this.draggedElementClass);
        }

        //Required style attributes
        draggedElement.style.position = 'fixed';
        draggedElement.style.touchAction = 'none';
        draggedElement.style.pointerEvents = 'none';
        draggedElement.style.left = String(0);
        draggedElement.style.top = String(0);
        draggedElement.style.transform = `translate(${x - this.draggedElementPosition.offsetX}px, ${y - this.draggedElementPosition.offsetY}px)`;

        return draggedElement;
    };

    /**
     * Create placeholder element
     *
     */
    createPreviewElement = (list: HTMLElement, referenceElement: HTMLElement): HTMLElement => {
        const el = document.createElement('div');
        el.className = referenceElement.className;

        //set data attributes
        const listId = String(referenceElement.getAttribute(this.listIdAttribute));
        const shared = String(list.getAttribute(this.listSharedAttribute));

        el.setAttribute(this.previewElementOriginalListAttribute, listId);
        el.setAttribute(this.listIdAttribute, listId);
        el.setAttribute(this.previewElementListSharedAttribute, shared);
        el.setAttribute(this.previewElementAttribute, '');

        this.previewElementList = list;
        this.previewElementOriginalList = list;

        const sourceStyles = getComputedStyle(referenceElement);
        const sizeProperties = [
            'width',
            'height',
            'min-width',
            'min-height',
            'max-width',
            'max-height',
            'padding-top',
            'padding-right',
            'padding-bottom',
            'padding-left',
            'margin-top',
            'margin-right',
            'margin-bottom',
            'margin-left',
            'box-sizing'
        ];

        for (const prop of sizeProperties) {
            el.style.setProperty(prop, sourceStyles.getPropertyValue(prop));
        }

        //apply custom classes
        if (this.previewElementClass) {
            addMultipleClasses(el, this.previewElementClass);
        }

        //apply custom styles
        if (this.previewElementStyle) {
            for (const [key, value] of Object.entries(this.previewElementStyle)) {
                if (el.style.hasOwnProperty(key)) {
                    el.style.setProperty(key, value as string);
                }
            }
        }

        return el;
    };

    /**
     * Reset Dragged item attributes
     *
     */
    resetDraggingState = (): void => {
        this.draggedElement?.removeAttribute(this.draggedElementAttribute);
        this.draggedElement?.removeAttribute(this.ignoreElementAttribute);
        this.draggedElement = null;
        this.draggedElementOriginalIndex = null;

        this.enteredTarget = null;
        this.originalStyle = '';

        this.previewElement = null;
        this.previewElementList = null;
        this.previewElementOriginalList = null;

        this.draggedElementPosition = {
            x: 0,
            y: 0,
            offsetX: 0,
            offsetY: 0,
            directionY: 0,
            directionX: 0
        };
    };

    /**
     * Update position for dragged element.
     *
     * @param draggedElement
     * @param x
     * @param y
     */
    updateDraggedElPosition = (draggedElement: HTMLElement, x: number, y: number): void => {
        draggedElement.style.transform = `translate(${x - this.draggedElementPosition.offsetX}px, ${y - this.draggedElementPosition.offsetY}px)`;
    };

    /**
     * Search List Element
     *
     * @param listId
     */
    searchList = (listId: string): HTMLElement | null => {
        return document.querySelector(`[${this.listAttribute}="${listId}"]`);
    };

    /**
     * Search List items Element
     *
     * @param list
     */
    searchListItems = (list: HTMLElement): NodeListOf<HTMLElement> | null => {
        return list.querySelectorAll(`[${this.listItemAttribute}],[${this.previewElementAttribute}]`);
    };

    /**
     * Save current position for preview element
     *
     * @param previewElement
     */
    savePreviewElPosition = (previewElement: HTMLElement): void => {
        previewElement.setAttribute(this.previewElementDestinationPositionAttribute, JSON.stringify(getActualPosition(previewElement)));
    };
}
