# Templating

Compiles Blaze templates defined in `.html` files. Also automatically includes Blaze on the client.

This build plugin parses all of the HTML files in your app and looks for three top-level tags:

- `<head>` - Appended to the `head` section of your HTML.
- `<body>` - Appended to the `body` section of your HTML.
- `<template name="templateName">` - Compiled into a Blaze template, which can be included with `{{> templateName}}` or referenced in JS code with `Template.templateName`.

Read more on the [Templating](http://blazejs.org/api/templates).
