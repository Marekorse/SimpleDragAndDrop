//TODO:: Multi drag
//TODO:: Locknutie OSY
//TODO:: Skus viac typov animacii
//TODO:: Ak si trufas sprav dalsiu verziu SDD kde bude tahat elementy v gride nie v listoch :)

import AutoScroller from './AutoScroller';
import {ElementsAnimator} from './ElementsAnimator';
import {createEmitter} from './Emitter';
import {
    addMultipleClasses,
    applyStyles,
    getActualPosition,
    getElementsFromIndexes,
    getLayoutPosition,
    searchParentElement
} from './Helpers';

import {
    DropPayload,
    EmitterInterface,
    SDDOptionsInterface,
    SimpleDragAndDropInterface
} from './Interfaces';

export type {DropPayload, DropPosition, SDDOptionsInterface} from './Interfaces';

export class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
    public readonly options!: SDDOptionsInterface;
    public readonly root: HTMLElement;
    public readonly applyMove: (payload: DropPayload) => void;
    public readonly animationDuration: number;
    public readonly draggedElementStyle: Partial<CSSStyleDeclaration> | null;
    public readonly draggedElementClass: string;
    public readonly previewElementStyle: Partial<CSSStyleDeclaration> | null;
    public readonly previewElementClass: string;
    public readonly dragThreshold: number;
    public readonly touchDelay: number;
    public readonly mouseDelay: number;
    private pendingDragStart: {
        listItem: HTMLElement;
        list: HTMLElement;
        x: number;
        y: number;
        /** running touch delay, null = the item can be dragged */
        delayTimer: number | null;
    } | null;
    private activePointerId: number | null;
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
    private sourceElement: HTMLElement | null;
    private readonly sourceElementOriginalDisplay = new WeakMap<HTMLElement, { value: string; priority: string }>();
    private previewElement: HTMLElement | null;
    private previewElementList: HTMLElement | null;
    private previewElementOriginalList: HTMLElement | null;
    private enteredTarget: HTMLElement | null;

    private readonly draggedElementAttribute: string;
    private readonly sourceElementAttribute: string;
    private readonly previewElementAttribute: string;
    private readonly previewElementOriginalListAttribute: string;
    private readonly previewElementListSharedAttribute: string;
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

    //EVENT LISTENERS - stored, so the same references can be removed
    private readonly handlePointerDown = (e: PointerEvent): void => this.onDragStart(e, e.clientX, e.clientY);
    private readonly handlePointerMove = (e: PointerEvent): void => this.onDragMove(e, e.clientX, e.clientY);
    private readonly handlePointerEnd = (e: PointerEvent): void => this.onDragEnd(e);
    private readonly preventDefault = (e: Event): void => e.preventDefault();
    private readonly preventDefaultUnlessTouchDelay = (e: Event): void => {
        //during the touch delay the page can scroll, scrolling cancels the pending drag (pointercancel)
        if (this.draggedElement || this.pendingDragStart?.delayTimer === null) {
            e.preventDefault();
        }
    };
    private readonly preventDefaultWhileDragging = (e: Event): void => {
        //text selection inside a list item is allowed until the drag really starts
        if (this.draggedElement) {
            e.preventDefault();
        }
    };

    on!: (event: string, listener: (...args: any[]) => void) => void;
    emit!: (event: string, ...args: any[]) => void;

    /**
     * Constructor
     *
     * @param options
     */
    constructor(options: SDDOptionsInterface) {
        const root = document.getElementById(options.root);

        if (!root) {
            throw new Error(`[SimpleDragAndDrop] root element with id "${options.root}" was not found.`);
        }

        this.root = root;

        //PARAMS
        this.applyMove = options.applyMove ?? this.defaultApplyMove;
        this.animationDuration = options.animationDuration ?? 150;
        this.previewElementStyle = options.previewElementStyle ?? null;
        this.previewElementClass = options.previewElementClass ?? '';
        this.draggedElementStyle = options.draggedElementStyle ?? null;
        this.draggedElementClass = options.draggedElementClass ?? '';
        this.dragThreshold = options.dragThreshold ?? 5;
        this.touchDelay = options.touchDelay ?? 200;
        this.mouseDelay = options.mouseDelay ?? 0;
        this.previewElement = null;
        this.previewElementList = null;
        this.previewElementOriginalList = null;

        //STATE
        this.pendingDragStart = null;
        this.activePointerId = null;
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

        this.sourceElement = null;
        this.enteredTarget = null;

        //DATA ATTRIBUTES
        this.draggedElementAttribute = 'data-dragging';
        this.sourceElementAttribute = 'data-drag-source';
        this.previewElementAttribute = 'data-preview';
        this.previewElementOriginalListAttribute = 'data-prev-orig-list';
        this.previewElementListSharedAttribute = 'data-prev-list-shared';
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

        this.init();
    }

    init = (): void => {
        this.root.addEventListener('pointerdown', this.handlePointerDown);
    };

    /**
     * Add document listeners for the time of one drag (the pointer can leave root while dragging)
     *
     * touchmove is added on pointerdown, which comes before touchstart, so the browser knows it can block scrolling.
     */
    addDocumentListeners = (): void => {
        document.addEventListener('pointermove', this.handlePointerMove, {passive: false});
        document.addEventListener('pointerup', this.handlePointerEnd);
        document.addEventListener('pointercancel', this.handlePointerEnd);
        document.addEventListener('touchmove', this.preventDefaultUnlessTouchDelay, {passive: false});
        document.addEventListener('dragstart', this.preventDefault);
        document.addEventListener('selectstart', this.preventDefaultWhileDragging);
        //long press on touch devices opens the context menu
        document.addEventListener('contextmenu', this.preventDefault);
    };

    /**
     * Remove document listeners added for one drag
     */
    removeDocumentListeners = (): void => {
        document.removeEventListener('pointermove', this.handlePointerMove);
        document.removeEventListener('pointerup', this.handlePointerEnd);
        document.removeEventListener('pointercancel', this.handlePointerEnd);
        document.removeEventListener('touchmove', this.preventDefaultUnlessTouchDelay);
        document.removeEventListener('dragstart', this.preventDefault);
        document.removeEventListener('selectstart', this.preventDefaultWhileDragging);
        document.removeEventListener('contextmenu', this.preventDefault);
    };

    /**
     * Cancel a drag that has not started yet (waiting for threshold or touch delay)
     */
    cancelPendingDrag = (): void => {
        if (this.pendingDragStart?.delayTimer) {
            clearTimeout(this.pendingDragStart.delayTimer);
        }

        this.pendingDragStart = null;
        this.activePointerId = null;
        this.removeDocumentListeners();
    };

    /**
     * Remove all event listeners(for SPA).
     */
    clearEventListeners = (): void => {
        this.root.removeEventListener('pointerdown', this.handlePointerDown);
        this.cancelPendingDrag();
    };

    /**
     * Validate dragged item and Setup base attributes for dragged item
     *
     * @param event
     * @param clientX
     * @param clientY
     */
    onDragStart(event: PointerEvent, clientX: number, clientY: number): void {
        const target = event.target;

        //left mouse
        if (event.button !== 0) {
            return;
        }

        if (!this.draggedElement && !this.pendingDragStart && target instanceof Element) {
            const listItem: HTMLElement | null = searchParentElement(
                target,
                (el) => el.hasAttribute(this.listItemAttribute) && el.hasAttribute(this.listIdAttribute)
            );

            if (!listItem) {
                return;
            }

            const list: HTMLElement | null = this.searchListOfItem(listItem);

            if (list) {
                const actionBtnElement = list.hasAttribute(this.listHasActionBtnAttribute)
                    ? searchParentElement(target, (el) => el.hasAttribute(this.listItemActionBtnAttribute), listItem)
                    : null;

                if (!this.elementsAnimator.isMoved(listItem) && !list.hasAttribute(this.listDragDisabledAttribute) && listItem.parentElement && (!list.hasAttribute(this.listHasActionBtnAttribute) || actionBtnElement)) {
                    const pendingDragStart = {
                        listItem: listItem,
                        list: list,
                        x: clientX,
                        y: clientY,
                        delayTimer: null as number | null
                    };

                    //touch has its own delay, mouse and pen share mouseDelay
                    const delay = event.pointerType === 'touch' ? this.touchDelay : this.mouseDelay;

                    if (delay > 0) {
                        pendingDragStart.delayTimer = window.setTimeout(() => {
                            pendingDragStart.delayTimer = null;
                        }, delay);
                    }

                    this.pendingDragStart = pendingDragStart;
                    this.activePointerId = event.pointerId;
                    this.addDocumentListeners();
                }
            }
        }
    }

    /**
     * Basic Function for determining whether and where the dragged element should be placed
     *
     * @param event
     * @param x
     * @param y
     */
    onDragMove(event: PointerEvent, x: number, y: number) {

        if (!this.pendingDragStart && !this.draggedElement || event.pointerId !== this.activePointerId) {
            return;
        }

        const pendingDragStart = this.pendingDragStart;

        if (pendingDragStart) {
            const distance = Math.hypot(x - pendingDragStart.x, y - pendingDragStart.y);

            //delay is running - moving the pointer cancels the drag (on touch the page scrolls instead)
            if (pendingDragStart.delayTimer !== null) {
                if (distance >= this.dragThreshold) {
                    this.cancelPendingDrag();
                }

                return;
            }

            if (distance < this.dragThreshold) {
                return;
            }

            const {listItem, list} = pendingDragStart;

            if (!listItem.parentElement) {
                this.cancelPendingDrag();
                return;
            }

            this.pendingDragStart = null;

            this.previewElement = this.createPreviewElement(list, listItem);
            this.draggedElement = this.createDraggedElement(list, listItem, pendingDragStart.x, pendingDragStart.y);
            listItem.parentElement.insertBefore(this.previewElement, listItem);

            this.sourceElement = listItem;
            this.hideSourceElement(listItem);

            document.body.appendChild(this.draggedElement);
            this.enteredTarget = this.previewElement;
            this.emit('dragStart', listItem);
        }

        const target = document.elementFromPoint(x, y);
        const draggedElement = this.draggedElement as HTMLElement;
        const previewElement = this.previewElement as HTMLElement;

        if (target && draggedElement && previewElement) {
            event.preventDefault();
            this.updateDraggedElPosition(draggedElement, x, y);

            const foundItem = searchParentElement(
                target,
                (el) =>
                    el.hasAttribute(this.listItemAttribute) || el.hasAttribute(this.listAttribute) || el.hasAttribute(this.previewElementAttribute)
            );

            //lists of other instances are ignored
            const item = foundItem && this.root.contains(foundItem) ? foundItem : null;


            if (item && item !== previewElement && !this.elementsAnimator.isMoved(item, previewElement)) {
                //SIMULATION OF DRAGENTER EVENT
                const dragEnter = previewElement !== item && this.enteredTarget !== item;

                this.enteredTarget = item;
                const list = item.hasAttribute(this.listAttribute) ? item : this.searchListOfItem(item)!;
                const sharedGroup = previewElement.getAttribute(this.previewElementListSharedAttribute);
                const isShared = sharedGroup !== null
                    ? sharedGroup === list.getAttribute(this.listSharedAttribute)
                    : list === this.previewElementOriginalList;
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
            this.autoScroller.shouldEnableAutoScroller(x, y, target);
        }
    }

    /**
     * End of dragging - the dragged copy flies to the preview position, then finishDrop is called
     *
     * @param event pointerup/pointercancel, when omitted the drag is ended regardless of the pointer
     */
    onDragEnd = (event?: PointerEvent): void => {
        if (event && event.pointerId !== this.activePointerId) {
            return;
        }

        this.cancelPendingDrag();
        this.autoScroller.stopScroller();

        const draggedElement = this.draggedElement as HTMLElement;
        const sourceElement = this.sourceElement as HTMLElement;
        const previewElement = this.previewElement as HTMLElement;
        const previewElList = this.previewElementList as HTMLElement;
        const previewElOriginalList = this.previewElementOriginalList as HTMLElement;
        const draggedElementOriginalIndex = this.draggedElementOriginalIndex as number;

        if (draggedElement && sourceElement && previewElement) {
            const computedStyle = window.getComputedStyle(previewElement);

            //the dragging state is reset in finishDrop, so a new drag cannot start while the copy flies to the drop position
            if (this.animationDuration !== 0) {
                const position = getLayoutPosition(previewElement);
                const marginLeft = parseFloat(computedStyle.marginLeft);
                const marginTop = parseFloat(computedStyle.marginTop);

                this.elementsAnimator.animate(draggedElement, position.x - marginLeft, position.y - marginTop, () => {
                    this.finishDrop(previewElement, draggedElement, sourceElement, previewElList, previewElOriginalList, draggedElementOriginalIndex);
                });
            } else {
                this.finishDrop(previewElement, draggedElement, sourceElement, previewElList, previewElOriginalList, draggedElementOriginalIndex);
            }
        }
    };

    /**
     * Hide the original list item while its copy is dragged, its inline display is saved
     *
     * @param sourceElement
     */
    hideSourceElement = (sourceElement: HTMLElement): void => {
        this.sourceElementOriginalDisplay.set(sourceElement, {
            value: sourceElement.style.getPropertyValue('display'),
            priority: sourceElement.style.getPropertyPriority('display')
        });

        sourceElement.setAttribute(this.sourceElementAttribute, '');
        sourceElement.style.setProperty('display', 'none', 'important');
    };

    /**
     * Show the original list item again with its original inline display
     *
     * @param sourceElement
     */
    showSourceElement = (sourceElement: HTMLElement): void => {
        const originalDisplay = this.sourceElementOriginalDisplay.get(sourceElement);

        sourceElement.removeAttribute(this.sourceElementAttribute);

        //empty value removes the property, so an element without inline display stays without it
        sourceElement.style.setProperty('display', originalDisplay?.value ?? '', originalDisplay?.priority ?? '');
        this.sourceElementOriginalDisplay.delete(sourceElement);
    };

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
    finishDrop = (
        previewElement: HTMLElement,
        draggedElement: HTMLElement,
        sourceElement: HTMLElement,
        previewElList: HTMLElement,
        previewElOriginalList: HTMLElement,
        draggedElementOriginalIndex: number
    ): DropPayload => {
        //the hidden original is not counted, so this is the index of the item after the move
        const toIndex = Array.from(this.searchListItems(previewElList) as NodeList).indexOf(previewElement);
        const parent = previewElement.parentElement as HTMLElement;
        let before = previewElement.nextSibling;

        if (before === sourceElement) {
            before = sourceElement.nextSibling;
        }

        const payload: DropPayload = {
            item: sourceElement,
            from: {
                list: previewElOriginalList,
                listId: String(previewElOriginalList.getAttribute(this.listAttribute)),
                index: draggedElementOriginalIndex
            },
            to: {
                list: previewElList,
                listId: String(previewElList.getAttribute(this.listAttribute)),
                index: toIndex,
                parent: parent,
                before: before
            }
        };

        sourceElement.setAttribute(this.listIdAttribute, payload.to.listId);

        draggedElement.remove();
        previewElement.remove();
        this.showSourceElement(sourceElement);
        this.resetDraggingState();

        //after restoring the DOM the item is in its original place, nothing to move when the position did not change
        if (payload.from.listId !== payload.to.listId || payload.from.index !== payload.to.index) {
            this.applyMove(payload);
        }

        this.emit('drop', payload);

        return payload;
    };

    /**
     * Default applyMove - inserts the dropped item in the DOM (vanilla JS)
     *
     * @param payload
     */
    defaultApplyMove = (payload: DropPayload): void => {
        payload.to.parent.insertBefore(payload.item, payload.to.before);
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
            });

            previewElement.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
            this.previewElementList = list;

            return;
        }

        const lastElementPosition = getActualPosition(listItems[listItems.length - 1]);

        if (y > lastElementPosition.y + lastElementPosition.h) {
            this.elementsAnimator.animateElementsMovement(previewElElementsForAnimation, () => {
                list.appendChild(previewElement);
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
        const list = this.searchListOfItem(listItem) as HTMLElement;
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
                });
            } else {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex]);
                });
            }
        } else if (clientY < ListItemCenterPoint) {
            if (listItemIndex < Number(previewElIndex)) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex]);
                });
            } else if (listItemIndex >= 0 && listItemIndex < listItems.length) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewElement, listItems[listItemIndex].nextElementSibling);
                });
            }
        }

        previewElement.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
        this.previewElementList = list;
    };

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
    createDraggedElement = (list: HTMLElement, target: HTMLElement, x: number, y: number): HTMLElement => {
        window.getSelection()?.removeAllRanges();

        const draggedElement = this.createDraggedCopy(target);
        const computedStyle = window.getComputedStyle(target);
        const marginLeft = parseFloat(computedStyle.marginLeft);
        const marginTop = parseFloat(computedStyle.marginTop);
        const listStyleType = computedStyle.getPropertyValue('list-style-type');

        //calculate offset
        const targetRect = target.getBoundingClientRect();
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

        //set style attributes
        const rect: DOMRect = targetRect;
        draggedElement.style.setProperty('box-sizing', 'border-box', 'important');
        draggedElement.style.setProperty('width', `${rect.width}px`, 'important');
        draggedElement.style.setProperty('height', `${rect.height}px`, 'important');
        draggedElement.style.setProperty('z-index', '999999', 'important');

        if (listStyleType) {
            draggedElement.style.listStyleType = listStyleType;
        }

        //apply custom styles
        if (this.draggedElementStyle) {
            applyStyles(draggedElement, this.draggedElementStyle);
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
     * Create a visual copy of the list item for dragging
     *
     * @param target
     */
    createDraggedCopy = (target: HTMLElement): HTMLElement => {
        const copy = target.cloneNode(true) as HTMLElement;

        //duplicate ids would break labels, aria and css selectors
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

        //the copy must never be found as a list item
        copy.removeAttribute(this.listItemAttribute);

        //a checked radio in the copy would uncheck the original radio of the same group when the copy is added to the document
        copy.querySelectorAll('[name]').forEach((el) => el.removeAttribute('name'));

        //cloneNode does not copy current values of form fields
        const targetFields = target.querySelectorAll<HTMLInputElement>('input, textarea, select');
        copy.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((field, i) => {
            field.value = targetFields[i].value;
            field.checked = targetFields[i].checked;
        });

        return copy;
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
        const shared = list.getAttribute(this.listSharedAttribute);

        el.setAttribute(this.previewElementOriginalListAttribute, listId);
        el.setAttribute(this.listIdAttribute, listId);

        if (shared !== null) {
            el.setAttribute(this.previewElementListSharedAttribute, shared);
        }

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
            applyStyles(el, this.previewElementStyle);
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
        this.sourceElement = null;
        this.draggedElementOriginalIndex = null;

        this.enteredTarget = null;

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
     * Search List Element inside root
     *
     * @param listId
     */
    searchList = (listId: string): HTMLElement | null => {
        const selector = `[${this.listAttribute}="${CSS.escape(listId)}"]`;

        if (this.root.matches(selector)) {
            return this.root;
        }

        return this.root.querySelector<HTMLElement>(selector);
    };

    /**
     * Search List Element of list item
     *
     * Searches only the item ancestors, falls back to the whole root when the item is outside its list.
     *
     * @param listItem
     */
    searchListOfItem = (listItem: HTMLElement): HTMLElement | null => {
        const listId = String(listItem.getAttribute(this.listIdAttribute));

        return listItem.closest<HTMLElement>(`[${this.listAttribute}="${CSS.escape(listId)}"]`) ?? this.searchList(listId);
    };

    /**
     * Search List items Element
     *
     * Only items belonging to the list (by list id), items of nested lists are excluded.
     * The hidden original of the dragged item is excluded as well.
     *
     * @param list
     */
    searchListItems = (list: HTMLElement): NodeListOf<HTMLElement> | null => {
        const listId = CSS.escape(list.getAttribute(this.listAttribute) as string);

        return list.querySelectorAll(
            `[${this.listItemAttribute}][${this.listIdAttribute}="${listId}"]:not([${this.sourceElementAttribute}]),` +
            `[${this.previewElementAttribute}][${this.listIdAttribute}="${listId}"]`
        );
    };
}
