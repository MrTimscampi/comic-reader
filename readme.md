# &lt;comic-reader&gt;

> ___Note___: This component is in very early development and should not be used in production.

A comic reader as a web component. Usage is as simple as:

```html
<comic-reader src="https://example.com/whiz-comics-01.cbz"></comic-reader>
```

## Install

Using Yarn:

```shell
yarn add comic-reader
```

npm:

```shell
npm install comic-reader
```

## API

### Attributes / Properties

Every attribute is also available as a property (and vice versa). Here are the properties for configuring the reader:

#### src

There are 2 forms, a string URL (relative to the `document.baseURI`) and an object. Here are how they are used:

```html
<comic-reader src="./whiz-comics-01.cbz"></comic-reader>
```

Alternatively this can be set by a property:

```js
let reader = document.querySelector('comic-reader');
reader.src = './whiz-comics-01-cbz';
```

This will fetch `whiz-comics-01.cbz` and extract the comic into the reader. The supported formats are:

* __cbz__: A zip archive. Extension does not matter.
* __cbr__: A rar archive. Extension does not matter.

#### page

Set the page. This will navigate to that page immediately. This is useful, for example, to restore the page that the user was previously reading.

```html
<comic-reader src="./whiz-comics-01.cbz" page="8"></comic-reader>
```

Alternatively set via a property:

```js
let reader = document.querySelector('comic-reader');
reader.page = 18;
```

#### title

Show a title in the top pane navigation. This is useful to, for example, show the comic title and issue number in a context where this might not be obvious to the reader otherwise.

The title will be displayed above the page progress.

```html
<comic-reader title="Baffling Mysteries #9"></comic-reader>
```

Or with JavaScript:

```js
let reader = document.querySelector('comic-reader');
reader.title = 'Baffling Mysteries #9';
```

#### cover

Show a cover image while the book is loaded. When loading from an archive such as cbr or cbz there can be a delay before the first page is visible to the user. Using `cover` lets them see an image (usually the cover of the comic) while the loading is happening. As soon as the first page is painted the cover will no longer be shown.

This is similar to the `poster` attribute on `<video>` elements.

```html
<comic-reader src="./path/to/book.cbz" cover="./path/to/cover.jpg"></comic-reader>
```

#### controls

Show the top and bottom toolbars. Normally this is controlled by the user clicking within the middle of the image. Setting the boolean `controls` attribute will make these be shown.

```html
<comic-reader src="./path/to/book.cbz" controls></comic-reader>
```

The user can still disable the controls by clicking within the middle of the page, this doesn't change that. It just makes them be initially shown (if present in the HTML), or makes them be shown when hidden (if added dynamically).

### Events

These events are emitted:

#### page

This event is emitted as pages are navigated. You might use this, for example, to store the current page in order to restore it later.

```js
let reader = document.querySelector('comic-reader');

reader.addEventListener('page', ev => {
  let page = ev.detail;
  
  // Do something with the page...
});
```

### Slots

The following optional slots are provided to customize the look of `<comic-reader>`.

#### top-left-nav

The top pane navigation is activated when the user clicks within the middle third area of the viewport. It contains a button to turn on fullscreen mode and also displays the current page.

You can add content to the top left portion of the nav; immediately to the left of the page progress and title section. The follow example displays a back button using this slot:

```html
<comic-reader title="Baffling Mysteries #9" src="./demo.cbz">
  <a href="./" slot="top-left-nav">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <title>Back</title>
      <path d="M427 234.625H167.296l119.702-119.702L256 85 85 256l171 171 29.922-29.924-118.626-119.701H427v-42.75z"/>
    </svg>
  </a>
</comic-reader>
```

Which will look like so:

![Example of usage of the top-left-nav slot displaying a back button](https://user-images.githubusercontent.com/361671/53805364-ecbb3400-3f17-11e9-8ec8-0a34deaa12b6.png)

## License 

BSD-2-Clause