import {ElementsAnimatorInterface, OriginalInlineStyles, Rect} from './Interfaces';
import {getActualPosition} from './Helpers';

export class ElementsAnimator implements ElementsAnimatorInterface {
    public readonly animationDuration: number;
    public readonly animationAttribute: string;
    public readonly isMovedAttribute: string;
    public readonly ignoreAttribute: string;

    /**
     * Inline transform and transition of elements before the animator touched them,
     * restored when the animation ends, so the user styles are not lost.
     */
    private readonly originalStyles = new WeakMap<HTMLElement, OriginalInlineStyles>();

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
     * Save the inline transform and transition of the element, only when it is not animated already
     * (a running animation has its own values in the inline styles)
     *
     * @param el
     */
    private saveOriginalStyles = (el: HTMLElement): void => {
        if (this.originalStyles.has(el)) {
            return;
        }

        this.originalStyles.set(el, {
            transform: {
                value: el.style.getPropertyValue('transform'),
                priority: el.style.getPropertyPriority('transform')
            },
            transition: {
                value: el.style.getPropertyValue('transition'),
                priority: el.style.getPropertyPriority('transition')
            }
        });
    };

    /**
     * Reset element animations - the original inline transform and transition are restored
     *
     * Elements whose styles were not saved (the dragged copy) are left as they are.
     *
     * @param target
     */
    removeAnimation = (target: HTMLElement): void => {
        const original = this.originalStyles.get(target);

        if (!original) {
            return;
        }

        //empty value removes the property, so an element without inline styles stays without them
        target.style.setProperty('transition', original.transition.value, original.transition.priority);
        target.style.setProperty('transform', original.transform.value, original.transform.priority);
        this.originalStyles.delete(target);
    };

    /**
     * Translation composed with the original inline transform of the element
     *
     * @param el
     * @param x
     * @param y
     */
    private getTransform = (el: HTMLElement, x: number, y: number): string => {
        const originalTransform = this.originalStyles.get(el)?.transform.value;
        const translate = `translate3d(${x}px, ${y}px, 0px)`;

        return originalTransform && originalTransform !== 'none' ? `${translate} ${originalTransform}` : translate;
    };

    /**
     * Transition of the transform, the original inline transitions of other properties are kept
     *
     * @param el
     */
    private getTransition = (el: HTMLElement): string => {
        const originalTransition = this.originalStyles.get(el)?.transition.value;
        const transition = `transform ${this.animationDuration}ms ease`;

        return originalTransition ? `${originalTransition}, ${transition}` : transition;
    };

    /**
     * Check if the element position intersects the viewport
     *
     * @param position
     */
    isInViewport = (position: Rect): boolean => {
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
        el.style.transition = this.getTransition(el);
        el.style.transform = this.getTransform(el, x, y);

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

            this.saveOriginalStyles(el);
            el.setAttribute(this.isMovedAttribute, '');
            el.style.transform = this.getTransform(el, oldPosition.x - newPosition.x, oldPosition.y - newPosition.y);

            return true;
        });

        if (animatedElements.length === 0) {
            return;
        }

        document.body.offsetHeight;
        animatedElements.forEach((el) => this.animate(el));
    };
}
