<a name="Template"></a>

## Template
**Kind**: global class  
**Summary**: The class for defining templates  
**Instancename**: Template.myTemplate  

* [Template](#Template)
    * [.body](#Template.body)
    * [.dynamic(template, [data])](#Template.dynamic)

<a name="Template.body"></a>

### Template.body
**Kind**: static property of [<code>Template</code>](#Template)  
**Summary**: The [template object](#Template-Declarations) representing your `<body>`
tag.  
**Locus**: Client  
<a name="Template.dynamic"></a>

### Template.dynamic(template, [data])
**Kind**: static method of [<code>Template</code>](#Template)  
**Summary**: Choose a template to include dynamically, by name.  
**Istemplate**: true  
**Locus**: Templates  

| Param | Type | Description |
| --- | --- | --- |
| template | <code>String</code> | The name of the template to include. |
| [data] | <code>Object</code> | Optional. The data context in which to include the template. |

