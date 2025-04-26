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
npm install simple-drag-and-drop
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
   simpleDragAndDrop.init();

	
   simpleDragAndDrop.on('itemsUpdated', (listItems) => {
        //Your logic
   })
</script>
```


## 📦 Options

#### Instance options

| Parameter                | Type          | Description                                                                 |
|--------------------------|---------------|-----------------------------------------------------------------------------|
| `animationDuration`      | `number`      | Duration of the reorder animation in milliseconds.                          |
| `draggedElementStyle`    | `object`      | Inline CSS styles applied to the dragged element.                           |
| `draggedElementClass`    | `string`      | CSS class(es) applied to the dragged element.                               |
| `previewElementStyle`    | `object`      | Inline CSS styles applied to the preview placeholder.                       |
| `previewElementClass`    | `string`      | CSS class(es) applied to the preview placeholder element.                   |



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
| `itemsUpdated`  | `ListItem[]`                 | Triggered after list items are reordered or moved between lists.            |


 
## 📋 Requirements

- Pure JavaScript, no dependencies.

## 📄 License

MIT
