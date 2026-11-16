import {ElementsAnimatorInterface} from './Interfaces';
import {getActualPosition} from './Helpers';

export class ElementsAnimator implements ElementsAnimatorInterface {
    public readonly animationDuration: number;
    public readonly animationAttribute: string;
    public readonly isMovedAttribute: string;
    public readonly ignoreAttribute: string;

    /**
     * Constructor
     *
     * @param animationDuration
     * @param animationAttribute
     * @param isMovedAttribute
     * @param ignoreAttribute
     */
    constructor(
        animationDuration: number = 500,
        ignoreAttribute: string = 'data-el-ignore',
        animationAttribute: string = 'data-el-animation-att',
        isMovedAttribute: string = 'data-el-moved-att'
    ) {
        this.animationDuration = animationDuration;
        this.animationAttribute = animationAttribute;
        this.isMovedAttribute = isMovedAttribute;
        this.ignoreAttribute = ignoreAttribute;
    }

    /**
     * Check if the element is moving
     *
     * @param el
     */
    isMoved = (...el: HTMLElement[]): boolean => {
        let moved = false;

        el.forEach((el) => {
            if (el.hasAttribute(this.isMovedAttribute)) {
                moved = true;
            }
        });

        return moved;
    };

    /**
     * Reset element animations
     *
     * @param target
     */

    removeAnimation = (target: HTMLElement): void => {
        target.style.transition = '';
        target.style.transform = '';
    };

    /**
     * Check if the element position intersects the viewport
     *
     * @param position
     */
    isInViewport = (position: { x: number; y: number; w: number; h: number }): boolean => {
        return position.x + position.w > 0 && position.x < window.innerWidth && position.y + position.h > 0 && position.y < window.innerHeight;
    };

    /**
     * start animation
     *
     * @param el
     * @param x
     * @param y
     * @param after
     */
    animate = (el: HTMLElement, x: number = 0, y: number = 0, after?: () => void): void => {
        el.setAttribute(this.isMovedAttribute, '');
        el.style.transition = `transform ${this.animationDuration}ms ease`;
        el.style.transform = `translate3d(${x}px, ${y}px, 0px)`;

        //reset animation state after end
        if (el.hasAttribute(this.animationAttribute)) {
            const animationState = Number(el.getAttribute(this.animationAttribute)!);
            clearTimeout(animationState);
        }

        const animation = setTimeout(() => {
            this.removeAnimation(el);
            el.removeAttribute(this.isMovedAttribute);
            el.removeAttribute(this.animationAttribute);
            after?.();
        }, this.animationDuration);

        el.setAttribute(this.animationAttribute, String(animation));
    };

    /**
     * Animate elements
     *
     * @param elements
     * @param movement
     */
    animateElementsMovement = (elements: HTMLElement[], movement: () => void): void => {
        const oldPositions = elements.map((el) => getActualPosition(el));

        elements.forEach((el) => {
            if (!el.hasAttribute(this.ignoreAttribute)) {
                this.removeAnimation(el);
            }
        });

        movement();

        const newPositions = elements.map((el) => getActualPosition(el));

        const animatedElements = elements.filter((el, i) => {
            const oldPosition = oldPositions[i];
            const newPosition = newPositions[i];

            if (!this.isInViewport(oldPosition) && !this.isInViewport(newPosition)) {
                return false;
            }

            el.setAttribute(this.isMovedAttribute, '');
            el.style.transform = `translate3d(${oldPosition.x - newPosition.x}px, ${oldPosition.y - newPosition.y}px, 0px)`;

            return true;
        });

        if (animatedElements.length === 0) {
            return;
        }

        document.body.offsetHeight;
        animatedElements.forEach((el) => this.animate(el));
    };
}
