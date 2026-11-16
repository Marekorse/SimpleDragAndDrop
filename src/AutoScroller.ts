import {Axis, AutoScrollerInterface, Direction, ScrollTarget} from './Interfaces';

/**
 *
 * Auto scroller.
 *
 * Extension that ensures smooth scrolling of the screen and elements while dragging the element.
 *
 */

export class AutoScroller implements AutoScrollerInterface {
    private readonly scrollToPositionThreshold: number;
    private readonly scrollSpeed: number;
    private startTime: DOMHighResTimeStamp | null;
    private scrollAnimationState: number | null;
    private actualScrollTarget: ScrollTarget | null;

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
        this.actualScrollTarget = null;
    }

    /**
     * Check if auto-scrolling is required based on the current position and thresholds,
     * and trigger the auto-scroller if necessary.
     *
     * Viewport edges have priority, then edges of the nearest scrollable container under the pointer.
     *
     * @param x
     * @param y
     * @param el element under the pointer, if already known
     */
    shouldEnableAutoScroller = (x: number, y: number, el: Element | null = document.elementFromPoint(x, y)): void => {

        if (el) {
            const target = this.getViewportScrollTarget(x, y, el) ?? this.getContainerScrollTarget(x, y, el);

            if (target) {
                this.scrollTo(target);
            } else {
                this.stopScroller();
            }
        }
    };

    /**
     * Find the outermost scrollable element when the pointer is near the viewport edge
     *
     * @param x
     * @param y
     * @param el
     */
    getViewportScrollTarget = (x: number, y: number, el: Element): ScrollTarget | null => {
        const vw: number = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh: number = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const threshold = this.scrollToPositionThreshold;
        const edges: Array<[Axis, Direction, boolean]> = [
            ['x', 'f', x > vw - threshold],
            ['x', 'b', x < threshold],
            ['y', 'b', y < threshold],
            ['y', 'f', y > vh - threshold]
        ];

        for (const [axis, direction, isNearEdge] of edges) {
            if (!isNearEdge) {
                continue;
            }

            let scrollableElement: Element | null = null;
            let currentEl: Element | null = el;

            while (currentEl) {
                if (this.isScrollable(axis, currentEl) && !this.isScrolledToEnd(axis, direction, currentEl)) {
                    scrollableElement = currentEl;
                }

                currentEl = currentEl.parentElement;
            }

            if (scrollableElement) {
                return {axis, direction, element: scrollableElement};
            }
        }

        return null;
    };

    /**
     * Find the nearest scrollable container whose edge is under the pointer
     *
     * @param x
     * @param y
     * @param el
     */
    getContainerScrollTarget = (x: number, y: number, el: Element): ScrollTarget | null => {
        const threshold = this.scrollToPositionThreshold;
        let currentEl: Element | null = el;

        while (currentEl) {
            //root element edges are the viewport edges
            if (!this.isRootElement(currentEl)) {
                const rect = currentEl.getBoundingClientRect();

                //visible area without borders and scrollbars
                const left = rect.left + currentEl.clientLeft;
                const top = rect.top + currentEl.clientTop;
                const right = left + currentEl.clientWidth;
                const bottom = top + currentEl.clientHeight;

                const edges: Array<[Axis, Direction, boolean]> = [
                    ['x', 'f', x > right - threshold && x <= right],
                    ['x', 'b', x < left + threshold && x >= left],
                    ['y', 'b', y < top + threshold && y >= top],
                    ['y', 'f', y > bottom - threshold && y <= bottom]
                ];

                for (const [axis, direction, isNearEdge] of edges) {
                    if (isNearEdge && this.isScrollable(axis, currentEl) && !this.isScrolledToEnd(axis, direction, currentEl)) {
                        return {axis, direction, element: currentEl};
                    }
                }
            }

            currentEl = currentEl.parentElement;
        }

        return null;
    };

    /**
     * Start scrolling the target, restart only when the target has changed
     *
     * @param target
     */
    scrollTo = (target: ScrollTarget): void => {
        const actual = this.actualScrollTarget;

        if (actual && actual.axis === target.axis && actual.direction === target.direction && actual.element === target.element) {
            return;
        }

        this.stopScroller();
        this.actualScrollTarget = target;
        this.startScroller(target.axis, target.direction, target.element);
    };

    /**
     * Check if the document root (scrolled by the viewport)
     *
     * @param element
     */
    isRootElement = (element: Element): boolean => {
        return element === document.documentElement || element === document.body || element === document.scrollingElement;
    };

    isScrollable = (axis: Axis, element: Element): boolean => {
        const hasOverflow = axis === 'x' ? element.scrollWidth > element.clientWidth : element.scrollHeight > element.clientHeight;

        if (!hasOverflow) {
            return false;
        }

        const overflow = axis === 'x' ? getComputedStyle(element).overflowX : getComputedStyle(element).overflowY;

        //root is scrolled by the viewport even with overflow: visible
        if (this.isRootElement(element)) {
            return overflow !== 'hidden' && overflow !== 'clip';
        }

        return overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay';
    };

    isScrolledToEnd = (axis: Axis, direction: Direction, element: Element, tolerance = 2): boolean => {
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

    startScroller = (axis: Axis, direction: Direction, scrollableElement: Element, distance: number = 0): void => {
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
    };

    /**
     * stop scroller
     */
    stopScroller = (): void => {
        if (this.scrollAnimationState) {
            cancelAnimationFrame(this.scrollAnimationState);
        }

        this.startTime = null;
        this.scrollAnimationState = null;
        this.actualScrollTarget = null;
    };
}
