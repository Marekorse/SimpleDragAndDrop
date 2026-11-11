# Simple drag and drop

This lightweight library allows you to quickly implement drag-and-drop functionality for HTML elements, offering customizable visuals for dragged and preview elements — all without any external dependencies.

## 💡 Overview

This library allows you to quickly implement drag-and-drop functionality for HTML elements with customizable visuals for dragged and preview elements.

## 🧩 Features

- ✨ Simple and fast initialization
- 🏷️ Based on data-attributes
- 🎬 Customizable animation duration
- 🎨 Stylable dragged and preview elements
- 🧲 Automatically scrolls the container when dragging items near the edges, making it easy to move them across long or overflowing lists.

## ⚙️ Installation
Step 1 — Configure .npmrc
Create a .npmrc file to specify the package registry and your authentication token:
 
```bash
# .npmrc
@marekorse:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken= YOUR_TOKEN
```

Step 2 — Install the package

```bash
# Install the package
npm install @marekorse/simple-drag-and-drop
```


## 🚀 Usage

```html
<ul data-list="list1" data-list-shared="group">
   <li data-list-item data-list-id="list1">
      List Item 1
   </li>
   <li data-list-item data-list-id="list1">
      List Item 2
   </li>
   <li data-list-item data-list-id="list1">
      List Item 3
   </li>
</ul>

<ul data-list="list2" data-list-shared="group">
   <li data-list-item data-list-id="list2">
      List Item 1
   </li>
   <li data-list-item data-list-id="list2">
      List Item 2
   </li>
   <li data-list-item data-list-id="list2">
      List Item 3
   </li>
</ul>
```


```js
<script>
   const options = {
      animationDuration: 150, // Animation duration in milliseconds
      draggedElementStyle: { 
          opacity: '80%', 
          border: '4px solid #FF0000' 
      }, // Custom styles for the dragged element
      draggedElementClass: 'border-4', // Custom classes for the dragged element 
      previewElementStyle: { 
          opacity: '20%' 
      }, // Style for the preview placeholder
      previewElementClass: 'border-4 border-blue-400', // Custom classes for the preview placeholder
   };

   // initialization
   const simpleDragAndDrop = new SimpleDragAndDrop(options);

   simpleDragAndDrop.on('drop', ({ from, to }) => {
      //Handle
   });
</script>
```

## 🎯 Drop

While dragging, only a copy of the item moves. The original stays in its place hidden (`display: none`).
When the copy reaches the drop position:

1. the copy and the preview are removed, the original is shown again in its original place,
2. `data-list-id` of the item is set to the target list,
3. `applyMove(payload)` moves the item - **only when the position changed**,
4. the `drop` event is emitted - **on every drop**, also when the position did not change.

The default `applyMove` inserts the item in the DOM (`to.parent.insertBefore(item, to.before)`), so vanilla JS
works without any extra code. In a framework (Vue, React, Angular...) pass your own `applyMove`,
update your data there and let the framework move the element.

`applyMove` must always reflect the move, otherwise the item stays in its original list with a wrong `data-list-id`.

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
      applyMove({ from, to }) {
         const [moved] = lists.value[from.listId].splice(from.index, 1);
         lists.value[to.listId].splice(to.index, 0, moved);
      }
   });
});

onBeforeUnmount(() => {
   simpleDragAndDrop?.clearEventListeners();
});
</script>

<template>
   <ul v-for="(items, listId) in lists" :key="listId" :data-list="listId" data-list-shared="group">
      <li v-for="item in items" :key="item.id" data-list-item :data-list-id="listId">
         {{ item.title }}
      </li>
   </ul>
</template>
```

- `:key` must be a stable id (not an index), otherwise Vue does not move the element.
- `:data-list-id` must be bound, Vue updates it when the item moves to another list.



## 📦 Options

#### Instance options

| Parameter                | Type          | Description                                                                 |
|--------------------------|---------------|-----------------------------------------------------------------------------|
| `animationDuration`      | `number`      | Duration of the reorder animation in milliseconds.                          |
| `draggedElementStyle`    | `object`      | Inline CSS styles applied to the dragged element.                           |
| `draggedElementClass`    | `string`      | CSS class(es) applied to the dragged element.                               |
| `previewElementStyle`    | `object`      | Inline CSS styles applied to the preview placeholder.                       |
| `previewElementClass`    | `string`      | CSS class(es) applied to the preview placeholder element.                   |
| `dragThreshold`          | `number`      | Distance in pixels the pointer must move before dragging starts. Default: `5`. |
| `applyMove`              | `function`    | Moves the dropped item, called only when the position changed. Default: inserts the item in the DOM. See [Drop](#-drop). |



## 🏷️ Data attributes

#### List

| Parameter                   | Required  | Type     | Description                                                                                                            |
|-----------------------------|-----------|----------|------------------------------------------------------------------------------------------------------------------------|
| `data-list`                 | ✅ Yes   | `string` | Identifier for a draggable list container.                                                                             |
| `data-list-shared`          | ⚠️ No    | `string` | ID used to group multiple lists together for shared drag-and-drop.                                                     |
| `data-list-has-action-btn`  | ⚠️ No    | —        | Enables detection of action buttons inside list items. . Must be used in combination with `data-list-item-action-btn`. |                     
| `data-list-drop-disabled`   | ⚠️ No    | —        | Disables dropping into the list.                                                                                       |
| `data-list-drag-disabled`   | ⚠️ No    | —        | Disables dragging items from the list.                                                                                 |



#### List item

| Parameter                   | Required  | Type     | Description                                                                 
|-----------------------------|-----------|----------|-----------------------------------------------------------------------------------------------------------------------|
| `data-list-item`            | ✅ Yes   | —        | Attribute used to identify a list item element.                                                                       |
| `data-list-id`              | ✅ Yes   | `string` | Attribute used to identify a list element.                                                                            |
| `data-list-item-action-btn` | ⚠️ No    | `string` | Marks an element inside a list item as an action button. Must be used in combination with `data-list-has-action-btn`. |


## ⚡ Events



| Event           | Args                         | Description                                                                 |
|-----------------|------------------------------|-----------------------------------------------------------------------------|
| `dragStart`     | `ListItem`                   | Triggered when dragging starts on a list item.                              |
| `dragOver`      | `ListItem` or `List`         | Fired continuously while dragging. Useful for tracking position or target.  |
| `dragEnter`     | `ListItem` or `List`         | Triggered when a dragged item enters another `List` or `ListItem.           |
| `dragEnd`       | —                            | Called when the drag operation completes (drop).                            |
| `drop`          | `DropPayload`                | Emitted on every drop after `applyMove`, also when the position did not change. See [Drop](#-drop). |

> `itemsUpdated` event was removed. Use `drop` instead, see [Drop](#-drop).


 
## 📋 Requirements

- Pure JavaScript, no dependencies.

## 📄 License

MIT

