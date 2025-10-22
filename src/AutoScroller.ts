export interface AutoScrollerInterface {
    speed?: number;
    threshold?: number;

    shouldEnableAutoScroller(x: number, y: number): void;

    getLastScrollableElementOnAxis(axis: string, direction: string, currentEl: HTMLElement, actualScrollAction: number): void;

    isScrollable(axis: string, element: HTMLElement): boolean;

    isScrolledToEnd(axis: string, direction: string, element: HTMLElement): boolean;

    isFullyVisibleOnAxis(axis: string, el: HTMLElement, parentEl: HTMLElement): boolean;

    startScroller(axis: string, direction: string, scrollableElement: HTMLElement, distance: number): void;

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
    private readonly scrollToPositionThreshold: number;
    private readonly scrollSpeed: number;
    private startTime: DOMHighResTimeStamp | null;
    private scrollAnimationState: number | null;
    private actualScrollAction: number | null;

    /**
     * Constructor
     *
     * @param speed
     * @param threshold
     */
    constructor(speed: number = 100, threshold: number = 50) {
        this.scrollToPositionThreshold = threshold;
        this.scrollSpeed = speed;
        this.startTime = null;
        this.scrollAnimationState = null;
        this.actualScrollAction = null;
    }

    /**
     * Check if auto-scrolling is required based on the current position and thresholds,
     * and trigger the auto-scroller if necessary.
     *
     * @param x
     * @param y
     */
    shouldEnableAutoScroller(x: number, y: number): void {
        const vw: number = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh: number = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const el: HTMLElement | null = document.elementFromPoint(x, y) as HTMLElement | null;

        if (el) {
            const elRect: DOMRect = el.getBoundingClientRect();
            if (x > vw - this.scrollToPositionThreshold) {
                // viewport X axis →
                this.getLastScrollableElementOnAxis('x', 'f', el, 1);
            } else if (x - elRect.x > el.clientWidth - this.scrollToPositionThreshold) {
                // el X axis →
                this.scrollElement('x', 'f', this.getFirstFullyVisibleElementOnAxis('x', el), 2);
            } else if (x < this.scrollToPositionThreshold) {
                // viewport X axis ←
                this.getLastScrollableElementOnAxis('x', 'b', el, 3);
            } else if (x - elRect.x < this.scrollToPositionThreshold) {
                // element X axis ←
                this.scrollElement('x', 'b', this.getFirstFullyVisibleElementOnAxis('x', el), 4);
            } else if (y < this.scrollToPositionThreshold) {
                // viewport Y axis  ↑
                this.getLastScrollableElementOnAxis('y', 'b', el, 5);
            } else if (y - elRect.y < this.scrollToPositionThreshold) {
                // element Y axis  ↑
                this.scrollElement('y', 'b', this.getFirstFullyVisibleElementOnAxis('y', el), 6);
            } else if (y > vh - this.scrollToPositionThreshold) {
                // viewport Y axis ↓
                this.getLastScrollableElementOnAxis('y', 'f', el, 7);
            } else if (y - elRect.y > elRect.height - this.scrollToPositionThreshold) {
                // element Y axis ↓
                this.scrollElement('y', 'b', this.getFirstFullyVisibleElementOnAxis('y', el), 8);
            } else {
                this.stopScroller();
            }
        }
    }

    getLastScrollableElementOnAxis(axis: 'x' | 'y', direction:'f' | 'b', currentEl: HTMLElement, actualScrollAction: number): void {
        if (actualScrollAction !== this.actualScrollAction) {
            this.stopScroller();
            this.actualScrollAction = actualScrollAction;
            let scrollableElement;

            while (currentEl) {
                if (this.isScrollable(axis, currentEl) && !this.isScrolledToEnd(axis, direction, currentEl)) {
                    scrollableElement = currentEl;
                }

                currentEl = currentEl.parentElement as HTMLElement;
            }

            if (scrollableElement) {
                this.startScroller(axis, direction, scrollableElement);
            }
        }
    }

    scrollElement(axis: string, direction: string, el: HTMLElement, actualScrollAction: number): void {
        if (actualScrollAction !== this.actualScrollAction) {
            this.stopScroller();
            this.actualScrollAction = actualScrollAction;
            this.startScroller(axis, direction, el);
        }
    }

    isScrollable = (axis: 'x' | 'y', element: HTMLElement): boolean => {
        const style = getComputedStyle(element);

        const overflowX = style.overflowX;
        const overflowY = style.overflowY;

        if (axis === 'x') {
            if (overflowX === 'hidden') return false;
            return element.scrollWidth > element.clientWidth;
        } else {
            if (overflowY === 'hidden') return false;
            return element.scrollHeight > element.clientHeight;
        }
    };

    isScrolledToEnd = (axis: 'x' | 'y', direction: 'f' | 'b', element: HTMLElement, tolerance = 2): boolean => {
        if (axis === 'x') {
            if (direction === 'f') {
                return Math.abs(element.scrollWidth - element.scrollLeft - element.clientWidth) <= tolerance;
            } else {
                return element.scrollLeft <= tolerance;
            }
        } else {
            if (direction === 'f') {
                return Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) <= tolerance;
            } else {
                return element.scrollTop <= tolerance;
            }
        }
    };

    /**
     * calculate distance and start scrolling
     *
     * @param axis
     * @param direction
     * @param scrollableElement
     * @param distance
     */

    startScroller(axis: string, direction: string, scrollableElement: HTMLElement, distance: number = 0): void {
        if (this.scrollAnimationState === null) {
            this.scrollAnimationState = requestAnimationFrame((timestamp) => {
                if (!this.startTime) {
                    this.startTime = timestamp;
                }

                const timestampDiff = timestamp - this.startTime;
                this.startTime = timestamp;

                distance += (timestampDiff / 1000) * this.scrollSpeed;

                if (distance > 1) {
                    distance = direction === 'f' ? distance : -distance;

                    if (axis === 'y') {
                        scrollableElement?.scrollBy({ left: 0, top: distance, behavior: 'instant' });
                    } else if (axis === 'x') {
                        scrollableElement?.scrollBy({ left: distance, top: 0, behavior: 'instant' });
                    }

                    distance = 0;
                }

                this.scrollAnimationState = null;
                this.startScroller(axis, direction, scrollableElement, distance);
            });
        }
    }

    isFullyVisibleOnAxis(axis: string, el: HTMLElement, parentEl: HTMLElement): boolean {
        return axis === 'x' ? el.clientWidth < parentEl.clientWidth : el.clientHeight < parentEl.clientHeight;
    }

    /**
     * Get first fully visible element on selected axis
     */
    getFirstFullyVisibleElementOnAxis(axis: string, el: HTMLElement): HTMLElement {
        let parentEl = el.parentElement;

        while (parentEl) {
            if (this.isFullyVisibleOnAxis(axis, el, parentEl)) {
                return el;
            }

            el = parentEl;
            parentEl = parentEl.parentElement;
        }

        return el;
    }

    /**
     * stop scroller
     */
    stopScroller(): void {
        if (this.scrollAnimationState) {
            cancelAnimationFrame(this.scrollAnimationState);
        }

        this.startTime = null;
        this.scrollAnimationState = null;
        this.actualScrollAction = null;
    }
}
