import { ElementsAnimatorInterface } from './Interfaces'
import { getActualPosition } from './Helpers'

export class ElementsAnimator implements ElementsAnimatorInterface {
    public readonly animationDuration: number
    public readonly oldPositionAttribute: string
    public readonly animationAttribute: string
    public readonly isMovedAttribute: string
    public readonly ignoreAttribute: string

    /**
     * Constructor
     *
     * @param animationDuration
     * @param oldPositionAttribute
     * @param animationAttribute
     * @param isMovedAttribute
     * @param ignoreAttribute
     */
    constructor(
        animationDuration: number = 500,
        ignoreAttribute: string = 'data-el-ignore',
        animationAttribute: string = 'data-el-animation-att',
        isMovedAttribute: string = 'data-el-moved-att',
        oldPositionAttribute: string = 'data-el-old-pos'
    ) {
        this.animationDuration = animationDuration
        this.oldPositionAttribute = oldPositionAttribute
        this.animationAttribute = animationAttribute
        this.isMovedAttribute = isMovedAttribute
        this.ignoreAttribute = ignoreAttribute
    }

    /**
     * Check if the element is moving
     *
     * @param el
     */
    isMoved(...el: HTMLElement[]): boolean {
        let moved = false

        el.forEach((el) => {
            if (el.hasAttribute(this.isMovedAttribute)) {
                moved = true
            }
        })

        return moved
    }

    /**
     * Reset element animations
     *
     * @param target
     */

    removeAnimation = (target: HTMLElement): void => {
        target.style.transition = ''
        target.style.transform = ''
    }

    /**
     * save the current position of the element
     *
     * @param el
     * @param position
     */
    saveElementPosition = (el: HTMLElement, position: { x: number; y: number; w: number; h: number }): HTMLElement => {
        el.setAttribute(this.oldPositionAttribute, JSON.stringify(position))
        return el
    }

    /**
     * move element to saved position
     *
     * @param el
     */
    moveToSavedPosition = (el: HTMLElement): void => {
        const position = getActualPosition(el)
        const oldPosition = JSON.parse(el.getAttribute(this.oldPositionAttribute)!)
        el.style.transform = `translate3d(${oldPosition.x - position.x}px, ${oldPosition.y - position.y}px, 0px)`
    }

    /**
     * start animation
     *
     * @param el
     * @param x
     * @param y
     * @param after
     */
    animate = (el: HTMLElement, x: number = 0, y: number = 0, after?: () => void): void => {
        el.setAttribute(this.isMovedAttribute, '')
        el.style.transition = `transform ${this.animationDuration}ms ease`
        el.style.transform = `translate3d(${x}px, ${y}px, 0px)`

        //reset animation state after end
        if (el.hasAttribute(this.animationAttribute)) {
            const animationState = Number(el.getAttribute(this.animationAttribute)!)
            clearTimeout(animationState)
        }

        const animation = setTimeout(() => {
            this.removeAnimation(el)
            el.removeAttribute(this.oldPositionAttribute)
            el.removeAttribute(this.isMovedAttribute)
            el.removeAttribute(this.animationAttribute)
            after?.()
        }, this.animationDuration)

        el.setAttribute(this.animationAttribute, String(animation))
    }

    /**
     * Animate elements
     *
     * @param elements
     * @param movement
     */
    animateElementsMovement = (elements: HTMLElement[], movement: () => void): void => {
        //SAVE ELEMENTS POSITIONS
        elements.forEach((el) => {
            this.saveElementPosition(el, getActualPosition(el))
            if (!el.hasAttribute(this.ignoreAttribute)) {
                this.saveElementPosition(el, getActualPosition(el))
                this.removeAnimation(el)
            }
        })

        //RUN ACTION
        movement()

        //PREPARE A START ANIMATION
        elements.forEach((target): void => {
            target.setAttribute(this.isMovedAttribute, '')
            this.moveToSavedPosition(target)

            //repaint
            target.offsetHeight

            this.animate(target)
        })
    }
}
