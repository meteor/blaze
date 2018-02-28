---
title: Todo App
description: Build your first Meteor app with Blaze
---

## Creating an App

In this tutorial, we are going to create a simple app to manage a 'to do' list and collaborate with others on those tasks.  By the end, you should have a basic understanding of Meteor and its project structure.

To create the app, open your terminal and type:

```bash
meteor create simple-todos
```

This will create a new folder called `simple-todos` with all of the files that a Meteor app needs:

```bash
client/main.js        # a JavaScript entry point loaded on the client
client/main.html      # an HTML file that defines view templates
client/main.css       # a CSS file to define your app's styles
server/main.js        # a JavaScript entry point loaded on the server
package.json          # a control file for installing NPM packages
package-lock.json     # Describes the NPM dependency tree
.meteor               # internal Meteor files
.gitignore            # a control file for git
```

To run the newly created app:

```bash
cd simple-todos
meteor
```

Open your web browser and go to `http://localhost:3000` to see the app running.

You can play around with this default app for a bit before we continue. For example, try editing the text in `<h1>` inside `client/main.html` using your favorite text editor. When you save the file, the page in your browser will automatically update with the new content. We call this "hot code push".

> #### Newer JavaScript syntax
> Meteor supports many newer JavaScript features, such as those in ECMAScript 2015 (ES6). If you haven't tried these next-generation JavaScript features yet, we recommend taking a look at [Luke Hoban's "ES6 features"](http://git.io/es6features) to familiarize yourself with the newer syntax.

Now that you have some experience editing the files in your Meteor app, let's start working on a simple todo list application. If you find a bug or error in the tutorial, please file an issue or submit a pull request [on GitHub](https://github.com/meteor/tutorials).

## Templates

To start working on our todo list app, let's replace the code of the default starter app with the code below. Then we'll talk about what it does.

First, let's remove the body from our HTML entry-point (leaving just the `<head>` tag):

<span class="block">Remove starter HTML code <small>client/main.html</small></span>

```html
<head>
  <title>simple</title>
</head>
```

Create a new directory with the name ``imports`` inside ``simple-todos`` folder. Then we create some new files in the ``imports/`` directory:

<span class="block">Add starter HTML code <small>imports/ui/body.html</small></span>

```html
<body>
  <div class="container">
    <header>
      <h1>Todo List</h1>
    </header>
 
    <ul>
      {{#each tasks}}
        {{> task}}
      {{/each}}
    </ul>
  </div>
</body>
 
<template name="task">
  <li>{{text}}</li>
</template>
```

<span class="block">Add starter JS code <small>imports/ui/body.js</small></span>

```js
import { Template } from 'meteor/templating';
 
import './body.html';
 
Template.body.helpers({
  tasks: [
    { text: 'This is task 1' },
    { text: 'This is task 2' },
    { text: 'This is task 3' },
  ],
});
```

Inside our front-end JavaScript entry-point file, ``client/main.js``, we'll remove the rest of the code and import ``imports/ui/body.js``:

<span class="block">Import starter JS <small>client/main.js</small></span>

```js
import '../imports/ui/body.js';
```

You can read more about how imports work and how to structure your code in the [Application Structure](https://guide.meteor.com/structure.html) article of the Meteor Guide.

In our browser, the app will now look much like this:

> #### Todo List
> - This is task 1
> - This is task 2
> - This is task 3

Now let's find out what all these bits of code are doing!

### HTML files in Meteor define templates

Meteor parses HTML files and identifies three top-level tags: **&lt;head>**, **&lt;body>**, and **&lt;template>**.

Everything inside any &lt;head> tags is added to the `head` section of the HTML sent to the client, and everything inside &lt;body> tags is added to the `body` section, just like in a regular HTML file.

Everything inside &lt;template> tags is compiled into Meteor _templates_, which can be included inside HTML with `{{dstache}}> templateName}}` or referenced in your JavaScript with `Template.templateName`.

Also, the `body` section can be referenced in your JavaScript with `Template.body`. Think of it as a special "parent" template, that can include the other child templates.

### Adding logic and data to templates

All of the code in your HTML files is compiled with [Meteor's Spacebars compiler](http://blazejs.org/api/spacebars.html). Spacebars uses statements surrounded by double curly braces such as `{{dstache}}#each}}` and `{{dstache}}#if}}` to let you add logic and data to your views.

You can pass data into templates from your JavaScript code by defining _helpers_. In the code above, we defined a helper called `tasks` on `Template.body` that returns an array. Inside the body tag of the HTML, we can use `{{dstache}}#each tasks}}` to iterate over the array and insert a `task` template for each value. Inside the `#each` block, we can display the `text` property of each array item using `{{dstache}}text}}`.

In the next step, we will see how we can use helpers to make our templates display dynamic data from a database collection.

### Styling with CSS

To have a better experience while following the tutorial we suggest you copy-paste the following CSS code into your app:

<span class="block">Add CSS <small>client/main.css</small></span>

```css
/* CSS declarations go here */
body {
  font-family: sans-serif;
  background-color: #315481;
  background-image: linear-gradient(to bottom, #315481, #918e82 100%);
  background-attachment: fixed;
 
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
 
  padding: 0;
  margin: 0;
 
  font-size: 14px;
}
 
.container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100%;
  background: white;
}
 
header {
  background: #d2edf4;
  background-image: linear-gradient(to bottom, #d0edf5, #e1e5f0 100%);
  padding: 20px 15px 15px 15px;
  position: relative;
}
 
#login-buttons {
  display: block;
}
 
h1 {
  font-size: 1.5em;
  margin: 0;
  margin-bottom: 10px;
  display: inline-block;
  margin-right: 1em;
}
 
form {
  margin-top: 10px;
  margin-bottom: -10px;
  position: relative;
}
 
.new-task input {
  box-sizing: border-box;
  padding: 10px 0;
  background: transparent;
  border: none;
  width: 100%;
  padding-right: 80px;
  font-size: 1em;
}
 
.new-task input:focus{
  outline: 0;
}
 
ul {
  margin: 0;
  padding: 0;
  background: white;
}
 
.delete {
  float: right;
  font-weight: bold;
  background: none;
  font-size: 1em;
  border: none;
  position: relative;
}
 
li {
  position: relative;
  list-style: none;
  padding: 15px;
  border-bottom: #eee solid 1px;
}
 
li .text {
  margin-left: 10px;
}
 
li.checked {
  color: #888;
}
 
li.checked .text {
  text-decoration: line-through;
}
 
li.private {
  background: #eee;
  border-color: #ddd;
}
 
header .hide-completed {
  float: right;
}
 
.toggle-private {
  margin-left: 5px;
}
 
@media (max-width: 600px) {
  li {
    padding: 12px 15px;
  }
 
  .search {
    width: 150px;
    clear: both;
  }
 
  .new-task input {
    padding-bottom: 5px;
  }
}
```

## Collections

Collections are Meteor's way of storing persistent data. The special thing about collections in Meteor is that they can be accessed from both the server and the client, making it easy to write view logic without having to write a lot of server code. They also update themselves automatically, so a view component backed by a collection will automatically display the most up-to-date data.

You can read more about collections in the [Collections article](https://guide.meteor.com/collections.html) of the Meteor Guide.

Creating a new collection is as easy as calling ``MyCollection = new Mongo.Collection("my-collection");`` in your JavaScript. On the server, this sets up a MongoDB collection called ``my-collection``; on the client, this creates a cache connected to the server collection. We'll learn more about the client/server divide in step 12, but for now we can write our code with the assumption that the entire database is present on the client.

To create the collection, we define a new ``tasks`` module that creates a Mongo collection and exports it:

<span class="block">Create task collection <small>imports/api/tasks.js</small></span>

```js
import { Mongo } from 'meteor/mongo';
 
export const Tasks = new Mongo.Collection('tasks');
```

Notice that we place this file in a new ``imports/api`` directory. This is a sensible place to store API-related files for the application. We will start by putting "collections" here and later we will add "publications" that read from them and "methods" that write to them. You can read more about how to structure your code in the [Application Structure](https://guide.meteor.com/structure.html) article of the Meteor Guide.

We need to import that module on the server (this creates the MongoDB collection and sets up the plumbing to get the data to the client):

<span class="block">Load tasks collection on the server <small>server/main.js</small></span>

```js
import '../imports/api/tasks.js';
```

Let's update our client-side JavaScript code to get our tasks from a collection instead of a static array:

<span class="block">Load tasks from Tasks collection <small>imports/ui/body.js</small></span>

```js
import { Template } from 'meteor/templating';
 
import { Tasks } from '../api/tasks.js';
 
import './body.html';
 
Template.body.helpers({
  tasks() {
    return Tasks.find({});
  },
});
```

When you make these changes to the code, you'll notice that the tasks that used to be in the todo list have disappeared. That's because our database is currently empty — we need to insert some tasks!

### Inserting tasks from the server-side database console

Items inside collections are called documents. Let's use the server database console to insert some documents into our collection. In a new terminal tab, go to your app directory and type:

```bash
meteor mongo
```

This opens a console into your app's local development database. Into the prompt, type:

```bash
db.tasks.insert({ text: "Hello world!", createdAt: new Date() });
```

In your web browser, you will see the UI of your app immediately update to show the new task. You can see that we didn't have to write any code to connect the server-side database to our front-end code — it just happened automatically.

Insert a few more tasks from the database console with different text. In the next step, we'll see how to add functionality to our app's UI so that we can add tasks without using the database console.

## Forms and Events

In this step, we'll add an input field for users to add tasks to the list.

First, let's add a form to our HTML:

<span class="block">Add form for new tasks <small>imports/ui/body.html</small></span>

```html
  <div class="container">
    <header>
      <h1>Todo List</h1>
 
      <form class="new-task">
        <input type="text" name="text" placeholder="Type to add new tasks" />
      </form>
    </header>
 
    <ul>
```

Here's the JavaScript code we need to add to listen to the ``submit`` event on the form:

<span class="block">Add event handler for form submit <small>imports/ui/body.js</small></span>

```js
    return Tasks.find({});
  },
});
 
Template.body.events({
  'submit .new-task'(event) {
    // Prevent default browser form submit
    event.preventDefault();
 
    // Get value from form element
    const target = event.target;
    const text = target.text.value;
 
    // Insert a task into the collection
    Tasks.insert({
      text,
      createdAt: new Date(), // current time
    });
 
    // Clear form
    target.text.value = '';
  },
});
```

Now your app has a new input field. To add a task, just type into the input field and hit enter. If you open a new browser window and open the app again, you'll see that the list is automatically synchronized between all clients.

### Attaching events to templates
Event listeners are added to templates in much the same way as helpers are: by calling ``Template.templateName.events(...)`` with a dictionary. The keys describe the event to listen for, and the values are event handlers that are called when the event happens.

In our case above, we are listening to the ``submit`` event on any element that matches the CSS selector ``.new-task``. When this event is triggered by the user pressing enter inside the input field, our event handler function is called.

The event handler gets an argument called ``event`` that has some information about the event that was triggered. In this case ``event.target`` is our form element, and we can get the value of our input with ``event.target.text.value``. You can see all of the other properties of the ``event`` object by adding a ``console.log(event)`` and inspecting the object in your browser console.

Finally, in the last line of the event handler, we clear the input to prepare for another new task.

### Inserting into a collection
Inside the event handler, we are adding a task to the ``tasks`` collection by calling ``Tasks.insert()``. We can assign any properties to the task object, such as the time created, since we don't ever have to define a schema for the collection.

Being able to insert anything into the database from the client isn't very secure, but it's okay for now. In step 10 we'll learn how we can make our app secure and restrict how data is inserted into the database.

### Sorting our tasks
Currently, our code displays all new tasks at the bottom of the list. That's not very good for a task list, because we want to see the newest tasks first.

We can solve this by sorting the results using the ``createdAt`` field that is automatically added by our new code. Just add a sort option to the ``find`` call inside the ``tasks`` helper:

<span class="block">Show newest tasks at the top <small>imports/ui/body.js</small></span>

```js
Template.body.helpers({
  tasks() {
    // Show newest tasks at the top
    return Tasks.find({}, { sort: { createdAt: -1 } });
  },
});
```