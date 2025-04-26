//TODO:: Multi drag
//TODO:: Locknutie OSY
//TODO:: Skus viac typov animacii
//TODO:: Ak si trufas sprav dalsiu verziu SDD kde bude tahat elementy v gride nie v listoch :)

import AutoScroller from './AutoScroller'
import { ElementsAnimator } from './ElementsAnimator'
import { SDDOptionsInterface, SimpleDragAndDropInterface, EmitterInterface } from './Interfaces'
import { createEmitter } from './Emitter'
import { addMultipleClasses, getActualPosition, getElementsFromIndexes, removeMultipleClasses, searchParentElement } from './Helpers'

export class SimpleDragAndDrop implements SimpleDragAndDropInterface, EmitterInterface {
    public readonly options!: SDDOptionsInterface
    public readonly animationDuration: number
    public readonly draggedElementStyle: Partial<CSSStyleDeclaration> | null
    public readonly draggedElementClass: string
    public readonly previewElementStyle: Partial<CSSStyleDeclaration> | null
    public readonly previewElementClass: string

    private draggedElement: HTMLElement | null
    private draggedElementOriginalIndex: number | null
    private draggedElementPosition: {
        x: number
        y: number
        offsetX: number
        offsetY: number
        directionY: number
        directionX: number
    }
    private originalStyle: string
    private previewElement: HTMLElement | null
    private previewElementList: HTMLElement | null
    private previewElementOriginalList: HTMLElement | null
    private enteredTarget: HTMLElement | null

    private readonly draggedElementAttribute: string
    private readonly previewElementAttribute: string
    private readonly previewElementOriginalListAttribute: string
    private readonly previewElementListSharedAttribute: string
    private readonly previewElementDestinationPositionAttribute: string
    private readonly listSharedAttribute: string
    private readonly listAttribute: string
    private readonly listHasActionBtnAttribute: string
    private readonly listItemActionBtnAttribute: string
    private readonly listDragDisabledAttribute: string
    private readonly listDropDisabledAttribute: string
    private readonly listItemAttribute: string
    private readonly listIdAttribute: string
    private readonly autoScroller: AutoScroller
    private readonly ignoreElementAttribute: string
    private readonly elementsAnimator: ElementsAnimator
    private elementsWithListeners: any[]

    on!: (event: string, listener: (...args: any[]) => void) => void
    emit!: (event: string, ...args: any[]) => void

    /**
     * Constructor
     *
     * @param options
     */
    constructor(options: SDDOptionsInterface) {
        //PARAMS
        this.animationDuration = options.animationDuration ?? 150
        this.previewElementStyle = options.previewElementStyle ?? null
        this.previewElementClass = options.previewElementClass ?? ''
        this.draggedElementStyle = options.draggedElementStyle ?? null
        this.draggedElementClass = options.draggedElementClass ?? ''
        this.previewElement = null
        this.previewElementList = null
        this.previewElementOriginalList = null

        //STATE
        this.draggedElement = null
        this.draggedElementOriginalIndex = null
        this.draggedElementPosition = {
            x: 0,
            y: 0,
            offsetX: 0,
            offsetY: 0,
            directionY: 0,
            directionX: 0,
        }

        this.originalStyle = ''
        this.enteredTarget = null

        //DATA ATTRIBUTES
        this.draggedElementAttribute = 'data-dragging'
        this.previewElementAttribute = 'data-preview'
        this.previewElementOriginalListAttribute = 'data-prev-orig-list'
        this.previewElementListSharedAttribute = 'data-prev-list-shared'
        this.previewElementDestinationPositionAttribute = 'data-prev-destination-position'
        this.listSharedAttribute = 'data-list-shared'
        this.listAttribute = 'data-list'
        this.listHasActionBtnAttribute = 'data-list-has-action-btn'
        this.listDragDisabledAttribute = 'data-list-drop-disabled'
        this.listDropDisabledAttribute = 'data-list-drag-disabled'
        this.listItemAttribute = 'data-list-item'
        this.listIdAttribute = 'data-list-id'
        this.listItemActionBtnAttribute = 'data-list-item-action-btn'

        //AUTO SCROLLER
        this.autoScroller = new AutoScroller(500, 50)

        //ELEMENTS ANIMATOR
        this.ignoreElementAttribute = 'data-el-ignore'
        this.elementsAnimator = new ElementsAnimator(this.animationDuration, this.ignoreElementAttribute)

        //EVENTS
        Object.assign(this, createEmitter())
        this.elementsWithListeners = []

        this.init()
    }

    /**
     * Initialization
     *
     * Setup all attributes for HTML elements and event listeners.
     */
    init = (): void => {
        //CREATE EVENT LISTENERS
        const onDragStart = (e: MouseEvent) => this.onDragStart(e, e.clientX, e.clientY)
        document.addEventListener('mousedown', onDragStart)

        const onTouchStart = (e: TouchEvent) => this.onDragStart(e, e.touches[0].clientX, e.touches[0].clientY)
        document.addEventListener('touchstart', onTouchStart, {
            passive: false,
        })

        const onDragEnd = () => this.onDragEnd()
        document.addEventListener('mouseup', onDragEnd)
        document.addEventListener('touchend', onDragEnd)

        const onDragMove = (e: MouseEvent) => this.onDragMove(e, e.target, e.clientX, e.clientY)
        document.addEventListener('mousemove', onDragMove, {
            passive: false,
        })

        const onTouchMove = (e: TouchEvent) =>
          this.onDragMove(e, document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY), e.touches[0].clientX, e.touches[0].clientY)
        document.addEventListener('touchmove', onTouchMove, {
            passive: false,
        })

        //SAVE LISTENERS REFERENCE TO VARIABLE
        this.elementsWithListeners.push({
            el: document,
            events: {
                mousedown: onDragStart,
                touchstart: onTouchStart,

                mouseup: onDragEnd,
                touchend: onDragEnd,

                mousemove: onDragMove,
                onTouchmove: onTouchMove,
            },
        })
    }

    /**
     * Remove all event listeners(for SPA).
     */
    clearEventListeners = (): void => {
        this.elementsWithListeners.forEach((listener) => {
            for (const [key, value] of Object.entries(listener.events)) {
                listener.el.removeEventListener(key, value)
            }
        })
    }

    /**
     * Validate dragged item and Setup base attributes for dragged item
     *
     * @param event
     * @param clientX
     * @param clientY
     */
    onDragStart(event: MouseEvent | TouchEvent, clientX: number, clientY: number): void {
        const target = event.target

        //left mouse
        if (event instanceof MouseEvent && event.button !== 0) {
            return
        }

        if (!this.draggedElement && target instanceof HTMLElement) {
            const listItem: HTMLElement | null = searchParentElement(
              target,
              (el) => el.hasAttribute(this.listItemAttribute) && el.hasAttribute(this.listIdAttribute)
            )

            const list: HTMLElement | null = this.searchList(String(listItem?.getAttribute(this.listIdAttribute)))

            if (listItem && list && (!list.hasAttribute(this.listHasActionBtnAttribute) || target.hasAttribute(this.listItemActionBtnAttribute))) {
                event.preventDefault()

                if (!this.elementsAnimator.isMoved(listItem) && !list.hasAttribute(this.listDragDisabledAttribute) && listItem.parentElement) {
                    this.previewElement = this.createPreviewElement(list, listItem)
                    this.draggedElement = this.createDraggedElement(list, listItem, clientX, clientY)
                    listItem.parentElement.insertBefore(this.previewElement, listItem)
                    this.savePreviewElPosition(this.previewElement)
                    document.body.appendChild(this.draggedElement)
                    this.enteredTarget = this.previewElement
                    this.emit('dragStart', listItem)
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
        const draggedEl = this.draggedElement as HTMLElement
        const previewEl = this.previewElement as HTMLElement

        if (target && draggedEl && previewEl) {
            event.preventDefault()
            this.updateDraggedElPosition(draggedEl, x, y)

            const item = searchParentElement(
              target,
              (el) =>
                el.hasAttribute(this.listItemAttribute) || el.hasAttribute(this.listAttribute) || el.hasAttribute(this.previewElementAttribute)
            )

            if (item && item !== previewEl && !this.elementsAnimator.isMoved(item, previewEl)) {
                //SIMULATION OF DRAGENTER EVENT
                const dragEnter = previewEl !== item && this.enteredTarget !== item
                this.enteredTarget = item
                const list = item.hasAttribute(this.listAttribute) ? item : this.searchList(String(item.getAttribute(this.listIdAttribute)))!
                const isShared = previewEl.getAttribute(this.previewElementListSharedAttribute) === list.getAttribute(this.listSharedAttribute)
                const dropDisabled = list.hasAttribute(this.listDropDisabledAttribute)

                if (!dropDisabled && isShared) {
                    //DRAGENTER
                    if (dragEnter) {
                        if (item.hasAttribute(this.listAttribute)) {
                            this.placeElementToList(previewEl, y, item)
                        } else {
                            this.replaceElement(y, item, previewEl)
                        }

                        this.emit('dragEnter', item)
                    } else {
                        //DRAGOVER
                        const { directionY, y: draggedY } = this.draggedElementPosition

                        if (!item.hasAttribute(this.listAttribute) && ((directionY === 1 && y < draggedY) || (directionY === -1 && y > draggedY))) {
                            this.replaceElement(y, item, previewEl)
                        }
                    }
                }
            }

            if (this.draggedElementPosition.x !== x) {
                Object.assign(this.draggedElementPosition, {
                    x: x,
                    directionX: x > this.draggedElementPosition.x ? 1 : -1,
                })
            }

            if (this.draggedElementPosition.y !== y) {
                Object.assign(this.draggedElementPosition, {
                    y: y,
                    directionY: y > this.draggedElementPosition.y ? 1 : -1,
                })
            }

            this.draggedElementPosition.x = x
            this.draggedElementPosition.y = y

            this.emit('dragOver', item)
            this.autoScroller.shouldEnableAutoScroller(x, y)
        }
    }

    /**
     * Checks whether the positions of the items have been changed and fire "updated" event
     *
     */
    onDragEnd = (): void => {
        this.autoScroller.stopScroller()

        const draggedEl = this.draggedElement as HTMLElement
        const previewEl = this.previewElement as HTMLElement
        const previewElList = this.previewElementList as HTMLElement
        const previewElOriginalList = this.previewElementOriginalList as HTMLElement
        const draggedElementOriginalIndex = this.draggedElementOriginalIndex as number

        if (draggedEl && previewEl) {
            const computedStyle = window.getComputedStyle(previewEl)

            if (this.animationDuration !== 0) {
                let previewElPosition = String(previewEl.getAttribute(this.previewElementDestinationPositionAttribute))
                const position = previewElPosition ? JSON.parse(previewElPosition) : getActualPosition(previewEl)
                const marginLeft = parseFloat(computedStyle.marginLeft)
                const marginTop = parseFloat(computedStyle.marginTop)

                this.elementsAnimator.animate(draggedEl, position.x - marginLeft, position.y - marginTop, () => {
                    this.replacePreviewElementWithDraggedElement(previewEl, draggedEl)
                    this.checksElementsUpdates(previewElList, previewElOriginalList, previewEl, draggedEl, draggedElementOriginalIndex)
                })
            } else {
                this.replacePreviewElementWithDraggedElement(previewEl, draggedEl)
                this.checksElementsUpdates(previewElList, previewElOriginalList, previewEl, draggedEl, draggedElementOriginalIndex)
            }

            this.resetDraggingState()
            this.emit('dragEnd')
        }
    }

    /**
     * Replace preview element with dragged element
     *
     * @param previewElement
     * @param draggedElement
     */
    replacePreviewElementWithDraggedElement = (previewElement: HTMLElement, draggedElement: HTMLElement) :void => {
        previewElement.replaceWith(draggedElement)
        draggedElement.setAttribute(this.listIdAttribute, String(previewElement.getAttribute(this.listIdAttribute)))

        if (this.draggedElementClass) {
            removeMultipleClasses(draggedElement, this.draggedElementClass)
        }

        draggedElement.style.cssText = this.originalStyle
    }

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
    ) :void => {
        const listItems = Array.from(this.searchListItems(previewElList) as NodeList)
        const draggedElIndex = listItems.indexOf(draggedElement)

        let updatedList: Node[] = []

        if (previewElList.getAttribute(this.listAttribute) !== previewElement.getAttribute(this.previewElementOriginalListAttribute)) {
            const previewElOriginalListItems = Array.from(this.searchListItems(previewElOriginalList) as NodeList)
            const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList)

            updatedList = [...previewElOriginalListItems, ...previewElListItems]
        } else if (draggedElIndex !== draggedElementOriginalIndex) {
            const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList)

            updatedList = [...previewElListItems]
        }

        // FIRE EVENT
        if (updatedList.length > 0) {
            this.emit('itemsUpdated', updatedList)
        }
    }

    /**
     * calculation of where the element should be placed in the list
     *
     * @param previewEl
     * @param y
     * @param list
     */
    placeElementToList = (previewEl: HTMLElement, y: number, list: HTMLElement): void => {
        const listItems = Array.from(this.searchListItems(list) as NodeList) as HTMLElement[];
        const previewElList = this.previewElementList as HTMLElement;
        const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList) as HTMLElement[];
        const previewElIndex = previewElListItems.indexOf(previewEl);
        const previewElElementsForAnimation = getElementsFromIndexes(previewElListItems, previewElIndex, previewElListItems.length - 1);

        if (listItems.length === 0) {
            this.elementsAnimator.animateElementsMovement(previewElElementsForAnimation, () => {
                list.insertBefore(previewEl, null);
                this.savePreviewElPosition(previewEl);
            });

            previewEl.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
            this.previewElementList = list;

            return;
        }

        const lastElementPosition = getActualPosition(listItems[listItems.length - 1]);

        if (y > lastElementPosition.y + lastElementPosition.h) {
            this.elementsAnimator.animateElementsMovement(previewElElementsForAnimation, () => {
                list.appendChild(previewEl);
                this.savePreviewElPosition(previewEl);
            });

            previewEl.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)));
            this.previewElementList = list;

            return;
        }
    };

    /**
     *  Placing the dragged element in the list based on direction and position
     *
     * @param clientY
     * @param listItem
     * @param previewEl
     */
    replaceElement = (clientY: number, listItem: HTMLElement, previewEl: HTMLElement): void => {
        const listItemParentEl = listItem.parentNode as HTMLElement
        const list = this.searchList(String(listItem.getAttribute(this.listIdAttribute))) as HTMLElement
        const listItems = Array.from(this.searchListItems(list) as NodeList) as HTMLElement[]
        const listItemIndex = listItems.indexOf(listItem)
        const previewElList = this.previewElementList as HTMLElement
        const previewElListItems = Array.from(this.searchListItems(previewElList) as NodeList) as HTMLElement[]
        const previewElIndex = previewElListItems.indexOf(previewEl)

        //ELEMENT FROM ANOTHER LIST DOES NOT REQUIRE CALCULATION
        if (previewElList.getAttribute(this.listAttribute) !== list.getAttribute(this.listAttribute)) {
            const previewElElementsForAnimation = getElementsFromIndexes(previewElListItems, previewElIndex, previewElListItems.length - 1)
            const elementsForAnimation = getElementsFromIndexes(listItems, listItemIndex, listItems.length - 1)
            const AllElementForAnimation = previewElElementsForAnimation.concat(elementsForAnimation)

            this.elementsAnimator.animateElementsMovement(AllElementForAnimation, () => {
                listItemParentEl.insertBefore(previewEl, listItem)
                this.savePreviewElPosition(previewEl)
            })

            this.previewElementList = list
            return
        }

        //CALCULATE CENTER POINT OF ELEMENT
        const listItemRect = listItem.getBoundingClientRect()
        const ListItemCenterPoint = listItemRect.y + listItemRect.height / 2
        const elementsForAnimation = getElementsFromIndexes(listItems, previewElIndex, listItemIndex)

        if (clientY > ListItemCenterPoint) {
            if (listItemIndex > Number(previewElIndex)) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewEl, listItems[listItemIndex].nextElementSibling)
                    this.savePreviewElPosition(previewEl)
                })
            } else {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewEl, listItems[listItemIndex])
                    this.savePreviewElPosition(previewEl)
                })
            }
        } else if (clientY < ListItemCenterPoint) {
            if (listItemIndex < Number(previewElIndex)) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewEl, listItems[listItemIndex])
                    this.savePreviewElPosition(previewEl)
                })
            } else if (listItemIndex >= 0 && listItemIndex < listItems.length) {
                this.elementsAnimator.animateElementsMovement(elementsForAnimation, () => {
                    listItemParentEl.insertBefore(previewEl, listItems[listItemIndex].nextElementSibling)
                    this.savePreviewElPosition(previewEl)
                })
            }
        }

        previewEl.setAttribute(this.listIdAttribute, String(list.getAttribute(this.listAttribute)))
        this.previewElementList = list
    }

    /**
     * Create dragged element
     *
     * @param list
     * @param target
     * @param x
     * @param y
     */
    createDraggedElement = (list: HTMLElement, target: HTMLElement, x: number, y: number): HTMLElement => {
        window.getSelection()?.removeAllRanges()

        const draggedElement = target
        const computedStyle = window.getComputedStyle(draggedElement as HTMLElement)
        const marginLeft = parseFloat(computedStyle.marginLeft)
        const marginTop = parseFloat(computedStyle.marginTop)
        const listStyleType = computedStyle.getPropertyValue('list-style-type')

        //calculate offset
        const targetRect = draggedElement.getBoundingClientRect()
        Object.assign(this.draggedElementPosition, {
            x: x,
            y: y,
            offsetX: x - targetRect.x + marginLeft,
            offsetY: y - targetRect.y + marginTop,
        })

        const listItems = Array.from(this.searchListItems(list) as NodeList)
        this.draggedElementOriginalIndex = listItems.indexOf(target)

        //set data attributes
        draggedElement.setAttribute(this.draggedElementAttribute, '')
        draggedElement.setAttribute(this.ignoreElementAttribute, '')

        //save original attributes
        this.originalStyle = draggedElement.style.cssText

        //set style attributes
        const rect: DOMRect = draggedElement.getBoundingClientRect()
        draggedElement.style.width = `${rect.width}px`
        draggedElement.style.height = `${rect.height}px`
        draggedElement.style.zIndex = String(999999)

        if (listStyleType) {
            draggedElement.style.listStyleType = listStyleType
        }

        //apply custom styles
        if (this.draggedElementStyle) {
            for (const [key, value] of Object.entries(this.draggedElementStyle)) {
                if (draggedElement.style.hasOwnProperty(key)) {
                    draggedElement.style.setProperty(key, value as string)
                }
            }
        }

        //apply custom classes
        if (this.draggedElementClass) {
            addMultipleClasses(draggedElement, this.draggedElementClass)
        }

        //Required style attributes
        draggedElement.style.position = 'fixed'
        draggedElement.style.touchAction = 'none'
        draggedElement.style.pointerEvents = 'none'
        draggedElement.style.left = String(0)
        draggedElement.style.top = String(0)
        draggedElement.style.transform = `translate(${x - this.draggedElementPosition.offsetX}px, ${y - this.draggedElementPosition.offsetY}px)`

        return draggedElement
    }

    /**
     * Create placeholder element
     *
     */
    createPreviewElement = (list: HTMLElement, referenceElement: HTMLElement): HTMLElement => {
        const el = document.createElement('div')
        el.className = referenceElement.className

        //set data attributes
        const listId = String(referenceElement.getAttribute(this.listIdAttribute))
        const shared = String(list.getAttribute(this.listSharedAttribute))

        el.setAttribute(this.previewElementOriginalListAttribute, listId)
        el.setAttribute(this.listIdAttribute, listId)
        el.setAttribute(this.previewElementListSharedAttribute, shared)
        el.setAttribute(this.previewElementAttribute, '')

        this.previewElementList = list
        this.previewElementOriginalList = list

        const sourceStyles = getComputedStyle(referenceElement)
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
            'box-sizing',
        ]

        for (const prop of sizeProperties) {
            el.style.setProperty(prop, sourceStyles.getPropertyValue(prop))
        }

        //apply custom classes
        if (this.previewElementClass) {
            addMultipleClasses(el, this.previewElementClass)
        }

        //apply custom styles
        if (this.previewElementStyle) {
            for (const [key, value] of Object.entries(this.previewElementStyle)) {
                if (el.style.hasOwnProperty(key)) {
                    el.style.setProperty(key, value as string)
                }
            }
        }

        return el
    }

    /**
     * Reset Dragged item attributes
     *
     */
    resetDraggingState = (): void => {
        this.draggedElement?.removeAttribute(this.draggedElementAttribute)
        this.draggedElement?.removeAttribute(this.ignoreElementAttribute)
        this.draggedElement = null
        this.draggedElementOriginalIndex = null

        this.enteredTarget = null
        this.originalStyle = ''

        this.previewElement = null
        this.previewElementList = null
        this.previewElementOriginalList = null

        this.draggedElementPosition = {
            x: 0,
            y: 0,
            offsetX: 0,
            offsetY: 0,
            directionY: 0,
            directionX: 0,
        }
    }

    /**
     * Update position for dragged element.
     *
     * @param draggedEl
     * @param x
     * @param y
     */
    updateDraggedElPosition = (draggedEl: HTMLElement, x: number, y: number): void => {
        draggedEl.style.transform = `translate(${x - this.draggedElementPosition.offsetX}px, ${y - this.draggedElementPosition.offsetY}px)`
    }

    /**
     * Search List Element
     *
     * @param listId
     */
    searchList = (listId: string): HTMLElement | null => {
        return document.querySelector(`[${this.listAttribute}="${listId}"]`)
    }

    /**
     * Search List items Element
     *
     * @param list
     */
    searchListItems = (list: HTMLElement): NodeListOf<HTMLElement> | null => {
        return list.querySelectorAll(`[${this.listItemAttribute}],[${this.previewElementAttribute}]`)
    }

    /**
     * Save current position for preview element
     *
     * @param previewEl
     */
    savePreviewElPosition = (previewEl: HTMLElement): void => {
        previewEl.setAttribute(this.previewElementDestinationPositionAttribute, JSON.stringify(getActualPosition(previewEl)))
    }
}
