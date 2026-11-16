# Simple drag and drop

A lightweight library for drag-and-drop of HTML elements within a list and between lists, with customizable dragged
and preview elements. No dependencies, works with vanilla JS as well as with frameworks (Vue, React, Angular...).

## 🧩 Features

- ✨ Simple and fast initialization
- 🏷️ Based on data-attributes
- 🧱 Works with frameworks - the DOM is changed only by you, see [Drop](#-drop)
- 🖱️ Mouse, touch and pen (Pointer Events), touch scrolling is kept thanks to `touchDelay`
- 🎬 Customizable animation duration
- 🎨 Stylable dragged and preview elements
- 🧲 Automatically scrolls the container when dragging items near the edges, making it easy to move them across long or overflowing lists.
- 🔷 Written in TypeScript, types included

> ℹ️ Only **vertical** lists are supported. Horizontal lists and grids are not supported yet.

## ⚙️ Installation

The package is published to GitHub Packages, which requires an authentication token even for public packages
(a GitHub personal access token with the `read:packages` scope).

Step 1 — Configure .npmrc
Create a .npmrc file to specify the package registry and your authentication token:

```bash
# .npmrc
@marekorse:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

Step 2 — Install the package

```bash
npm install @marekorse/simple-drag-and-drop
```


## 🚀 Usage

```html
<div id="board">
   <ul data-list="list1" data-list-shared="group">
      <li data-list-item data-list-id="list1">List Item 1</li>
      <li data-list-item data-list-id="list1">List Item 2</li>
      <li data-list-item data-list-id="list1">List Item 3</li>
   </ul>

   <ul data-list="list2" data-list-shared="group">
      <li data-list-item data-list-id="list2">List Item 1</li>
      <li data-list-item data-list-id="list2">List Item 2</li>
      <li data-list-item data-list-id="list2">List Item 3</li>
   </ul>
</div>
```

```js
import { SimpleDragAndDrop } from '@marekorse/simple-drag-and-drop';

const simpleDragAndDrop = new SimpleDragAndDrop({
   root: 'board', // Id of the element the instance is mounted on (required)
   animationDuration: 150, // Animation duration in milliseconds
   draggedElementStyle: {
      opacity: '80%',
      border: '4px solid #FF0000'
   }, // Custom styles for the dragged element
   draggedElementClass: 'border-4', // Custom classes for the dragged element
   previewElementStyle: {
      opacity: '20%'
   }, // Style for the preview placeholder
   previewElementClass: 'border-4 border-blue-400' // Custom classes for the preview placeholder
});

simpleDragAndDrop.on('drop', ({ from, to }) => {
   // Handle
});
```

## 🎯 Drop

While dragging, only a copy of the item moves. A new drag cannot start until the copy reaches the drop position. The original stays in its place hidden (`display: none`).
When the copy reaches the drop position:

1. the copy and the preview are removed, the original is shown again in its original place,
2. `data-list-id` of the item is set to the target list,
3. `applyMove(payload)` moves the item - **only when the position changed**,
4. the `drop` event is emitted - **on every drop**, also when the position did not change.

The default `applyMove` inserts the item in the DOM (`to.parent.insertBefore(item, to.before)`), so vanilla JS
works without any extra code. In a framework (Vue, React, Angular...) pass your own `applyMove`,
update your data there and let the framework move the element.

`applyMove` must always reflect the move, otherwise the item stays in its original list with a wrong `data-list-id`.

The drag is cancelled without a drop when `Escape` is pressed, when the browser takes over the pointer (`pointercancel`, e.g. a system gesture)
or when `destroy()` is called during the drag. The item stays in its original place, `applyMove`
is not called and the `dragCancel` event is emitted instead of `drop`.

Payload of `applyMove` and the `drop` event:

```ts
{
  item: HTMLElement,                  // the original list item
  from: { list, listId, index },      // where the item was dragged from
  to: {
    list, listId, index,              // where the item was dropped, index without the dragged item
    parent: HTMLElement,              // element the item should be inserted into
    before: Node | null               // node the item should be inserted before, null = append
  }
}
```

#### Vue

In `applyMove` update the data only, never move elements rendered by Vue in the DOM.

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { SimpleDragAndDrop } from '@marekorse/simple-drag-and-drop';

const lists = ref({
   todo: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }],
   done: [{ id: 3, title: 'C' }]
});

let simpleDragAndDrop = null;

onMounted(() => {
   simpleDragAndDrop = new SimpleDragAndDrop({
      root: 'board',
      applyMove({ from, to }) {
         const [moved] = lists.value[from.listId].splice(from.index, 1);
         lists.value[to.listId].splice(to.index, 0, moved);
      }
   });
});

onBeforeUnmount(() => {
   simpleDragAndDrop?.destroy();
});
</script>

<template>
   <div id="board">
      <ul v-for="(items, listId) in lists" :key="listId" :data-list="listId" data-list-shared="group">
         <li v-for="item in items" :key="item.id" data-list-item :data-list-id="listId">
            {{ item.title }}
         </li>
      </ul>
   </div>
</template>
```

- `:key` must be a stable id (not an index), otherwise Vue does not move the element.
- The root id must be unique on the page, use a different id for every component instance.
- `:data-list-id` must be bound, Vue updates it when the item moves to another list.

#### React

In `applyMove` update the state only (immutably), never move elements rendered by React in the DOM.

```jsx
import { useEffect, useState } from 'react';
import { SimpleDragAndDrop } from '@marekorse/simple-drag-and-drop';

export function Board() {
   const [lists, setLists] = useState({
      todo: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }],
      done: [{ id: 3, title: 'C' }]
   });

   useEffect(() => {
      const simpleDragAndDrop = new SimpleDragAndDrop({
         root: 'board',
         applyMove({ from, to }) {
            setLists((prev) => {
               const next = { ...prev, [from.listId]: [...prev[from.listId]] };
               const [moved] = next[from.listId].splice(from.index, 1);

               if (to.listId !== from.listId) {
                  next[to.listId] = [...prev[to.listId]];
               }

               next[to.listId].splice(to.index, 0, moved);
               return next;
            });
         }
      });

      return () => simpleDragAndDrop.destroy();
   }, []);

   return (
      <div id="board">
         {Object.entries(lists).map(([listId, items]) => (
            <ul key={listId} data-list={listId} data-list-shared="group">
               {items.map((item) => (
                  <li key={item.id} data-list-item data-list-id={listId}>
                     {item.title}
                  </li>
               ))}
            </ul>
         ))}
      </div>
   );
}
```

- `key` must be a stable id (not an index), otherwise React does not move the element.
- The root id must be unique on the page, use a different id for every component instance.
- Use the functional form of `setLists`, `applyMove` is created once and would see stale state otherwise.



## 📦 Options

#### Instance options

| Parameter                | Type          | Description                                                                 |
|--------------------------|---------------|-----------------------------------------------------------------------------|
| `root`                   | `string`      | **Required.** Id of the element the instance is mounted on. Dragging starts only inside it and only lists inside it are used. |
| `animationDuration`      | `number`      | Duration of the reorder animation in milliseconds. Default: `150`.          |
| `draggedElementStyle`    | `object`      | Inline CSS styles applied to the dragged element.                           |
| `draggedElementClass`    | `string`      | CSS class(es) applied to the dragged element.                               |
| `previewElementStyle`    | `object`      | Inline CSS styles applied to the preview placeholder.                       |
| `previewElementClass`    | `string`      | CSS class(es) applied to the preview placeholder element.                   |
| `dragThreshold`          | `number`      | Distance in pixels the pointer must move before dragging starts. Default: `5`. |
| `touchDelay`             | `number`      | Touch only: time in ms the finger must be held on an item before it can be dragged. Moving the finger earlier scrolls the page. `0` = no delay, see the warning below. Default: `200`. |
| `mouseDelay`             | `number`      | Mouse and pen: time in ms the button must be held on an item before it can be dragged. Moving the pointer earlier cancels the drag. `0` = no delay. Default: `0`. |
| `autoScrollSpeed`        | `number`      | Auto scroll speed in pixels per second. Default: `500`.                     |
| `autoScrollThreshold`    | `number`      | Distance in pixels from the edge of the viewport or a scrollable container where auto scroll starts. Default: `50`. |
| `applyMove`              | `function`    | Moves the dropped item, called only when the position changed. Default: inserts the item in the DOM. See [Drop](#-drop). |

> ⚠️ **Touch devices:** do not set `touchDelay` to `0` unless you really need it. Without the delay every finger movement
> that starts on an item drags it, so the page cannot be scrolled over the items and clicking inner elements
> (buttons, links, inputs) becomes unreliable - a tap with a slight finger movement starts dragging instead of a click.



## 🏷️ Data attributes

#### List

| Parameter                   | Required  | Type     | Description                                                                                                            |
|-----------------------------|-----------|----------|------------------------------------------------------------------------------------------------------------------------|
| `data-list`                 | ✅ Yes   | `string` | Unique identifier of a draggable list container.                                                                       |
| `data-list-shared`          | ⚠️ No    | `string` | Group name. Items can be moved between lists with the same group, without it only within the list.                    |
| `data-list-has-action-btn`  | ⚠️ No    | —        | Items can be dragged only by their action button (drag handle). Must be used in combination with `data-list-item-action-btn`. |
| `data-list-drop-disabled`   | ⚠️ No    | —        | Disables dropping into the list.                                                                                       |
| `data-list-drag-disabled`   | ⚠️ No    | —        | Disables dragging items from the list.                                                                                 |



#### List item

| Parameter                   | Required  | Type     | Description                                                                                                           |
|-----------------------------|-----------|----------|-----------------------------------------------------------------------------------------------------------------------|
| `data-list-item`            | ✅ Yes   | —        | Marks a draggable list item.                                                                                          |
| `data-list-id`              | ✅ Yes   | `string` | Id of the list the item belongs to, must match `data-list` of that list.                                              |
| `data-list-item-action-btn` | ⚠️ No    | —        | Marks an element inside a list item as an action button (drag handle). Must be used in combination with `data-list-has-action-btn`. |

**Why `data-list-id` on every item?** An item is assigned to a list by this id, not by its position in the DOM.
Thanks to it lists can be nested (items of an inner list are not counted as items of the outer list) and an item
does not have to be a direct child of the list element. The id is updated automatically when the item is dropped into another list.


## 🛠️ Methods

| Method                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| `on(event, listener)`      | Adds a listener for an event, see [Events](#-events).                       |
| `init()`                   | Starts listening for drags on `root`, called by the constructor. After `destroy()` it enables dragging again, listeners have to be added again with `on`. |
| `cancelDrag()`             | Cancels a running drag without a drop, `dragCancel` is emitted.             |
| `destroy()`                | Stops listening for drags, cancels a running drag and removes all listeners added by `on`. Call it when the component is unmounted. |

> `clearEventListeners()` was renamed to `destroy()`.


## ⚡ Events

| Event           | Args                         | Description                                                                 |
|-----------------|------------------------------|-----------------------------------------------------------------------------|
| `dragStart`     | `ListItem`                   | Triggered when dragging starts on a list item.                              |
| `dragOver`      | `ListItem`, `List` or `null` | Fired continuously while dragging. Useful for tracking position or target. `null` when the pointer is not over a list. |
| `dragEnter`     | `ListItem` or `List`         | Triggered when a dragged item enters another `List` or `ListItem`.          |
| `drop`          | `DropPayload`                | End of dragging, emitted on every drop after `applyMove`, also when the position did not change. See [Drop](#-drop). |
| `dragCancel`    | `ListItem`                   | End of dragging without a drop (`Escape`, `pointercancel`, `cancelDrag()`, `destroy()`). The item stays in its original place. |

> `itemsUpdated` and `dragEnd` events were removed. Use `drop` instead, see [Drop](#-drop).



## 📋 Requirements

- No dependencies.
- A browser with Pointer Events support (all current browsers).
- Written in TypeScript, type definitions are included in the package.

## 📄 License

MIT
