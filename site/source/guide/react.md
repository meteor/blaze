# Using React in Blaze

If you'd like to use React within a larger app built with Blaze
(which is a good strategy if you'd like to incrementally migrate an app from Blaze to React), you can use
the [`react-template-helper`](https://atmospherejs.com/meteor/react-template-helper) component which renders a React
component inside a Blaze template. First run `meteor add react-template-helper`, then use the `React` helper in your
template:

```handlebars
<template name="userDisplay">
    <div>Hello, {{username}}</div>
    <div>{{> React component=UserAvatar userId=_id}}</div>
</template>
```

You will need to pass in the component class with a helper:

```js
import { Template } from 'meteor/templating';

import './userDisplay.html';
import UserAvatar from './UserAvatar.js';

Template.userDisplay.helpers({
  UserAvatar () {
    return UserAvatar;
  }
})
```

The `component` argument is the React component to include, which should be passed in with a helper.

Every other argument is passed as a prop to the component when it is rendered.

Note that there a few caveats:

- React components must be the only thing in the wrapper element. Due to a limitation of React (see
  facebook/react [#1970](https://github.com/facebook/react/issues/1970), [#2484](https://github.com/facebook/react/issues/2484)),
  a React component must be rendered as the only child of its parent node, meaning it cannot have any siblings.

- This means a React component also can't be the only thing in a Blaze template, because it's impossible to tell where
  the template will be used.

## Passing callbacks to a React component

To pass a callback to a React component that you are including with this helper, make
a [template helper that returns a function](http://blazejs.org/guide/reusable-components.html#Pass-callbacks), and pass
it in as a prop, like so:

```js
Template.userDisplay.helpers({
  onClick () {
    const instance = Template.instance();

    // Return a function from this helper, where the template instance is in
    // a closure
    return () => {
      instance.hasBeenClicked.set(true)
    }
  }
});
```

To use it in Blaze:

```handlebars
<template name="userDisplay">
    <div>
        {{> React component=UserAvatar userId=_id onClick=onClick}}
    </div>
</template>
```

## Blaze Templates in React

We can also use Blaze templates in React components. This is similarly useful for a gradual transition strategy; but
more importantly, it allows us to continue to use the multitude of Atmosphere packages built for Blaze in our React
projects, as well as core packages like `accounts-ui`.

One way to do this is with the [`gadicc:blaze-react-component`](https://atmospherejs.com/gadicc/blaze-react-component)
package. First run `meteor add gadicc:blaze-react-component`, then import and use it in your components as follows:

```jsx
import React from 'react';
import Blaze from 'meteor/gadicc:blaze-react-component';

const App = () => (
  <div>
    <Blaze template="itemsList" items={items}/>
  </div>
);
```

The `<Blaze template="itemsList" items={items} />` line is the same as if you had
written <code v-pre>{{> itemsList items=items}}</code> inside of a Blaze template. For other options and further
information, see the package's [project page](https://github.com/gadicc/meteor-blaze-react-component).


