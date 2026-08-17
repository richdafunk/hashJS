# hashJS

Databinding and server-side rendering with plain JavaScript syntax.

A template is HTML with `#…#` in it. What goes inside the hashes is not a new
language — it is JavaScript, compiled into a real function and evaluated the way
you already expect.

```html
<ul id="app">
    #for(let user of users) {#
        <li>#user.name# &mdash; #user.email#</li>
    #}#
</ul>

<script src="https://cdn.jsdelivr.net/gh/richdafunk/hashJS@v1.3.6/hashJS.js"></script>
<script>
    fetch('/api/users')
        .then(r => r.json())
        .then(users => new hashJS('app', { users: users }));
</script>
```

There is no build step, no virtual DOM and no dependencies. The library is a
single file of about 11 kB.

## Why the syntax is the point

`#if(x) {#` compiles to `if (x) {`. `#for(let i of xs) {#` compiles to
`for (let i of xs) {`. The library never learns the keywords: any fragment
ending in `{` opens a block and any fragment starting with `}` continues one.

That means `try`/`catch`, labelled blocks, `switch` fall-through and destructuring
all work without anyone having added support for them, and it means the rules you
have to remember are the rules of JavaScript.

## The same template on both tiers

The constructor needs a document — it resolves an element, reads its markup and
writes the result back. `hashJS.render` does only the compilation and returns a
string, so the same template runs in a request handler, a worker, or anywhere
else with no DOM.

```js
// Not on npm — the name `hashjs` there belongs to an unrelated package.
// Vendor the file, or fetch it from the CDN at build time.
const hashJS = require('./hashJS.js');

// Compile once at startup; rendering is the cheap half.
const page = hashJS.compile(`
    <h1>#htmlEncode(title)#</h1>
    <ul>
    #for(let p of products) {#
        <li><a href="/product/#p.sku#">#htmlEncode(p.name)#</a></li>
    #}#
    </ul>`);

res.end(page({ title: 'Catalogue', products }));
```

Server-rendered first paint and client-side updates come from one template, so
there is no second implementation to keep in step with the first.

## API

| | |
| --- | --- |
| `new hashJS(template, data?, output?)` | Bind against the DOM. `template` and `output` are element IDs or elements. Omit `output` to render in place. |
| `.bind(data)` / `.update(data)` / `.refresh(data)` | Re-render with new data. |
| `hashJS.render(template, data)` | Compile and render a string. No DOM required. |
| `hashJS.compile(template)` | Compile once, get a `data => string` function back. |
| `hashJS.escape(value)` | Escape a value for HTML. Available inside templates as `htmlEncode`. |

Inside a template:

| | |
| --- | --- |
| `#expression#` | Evaluate and append the result. |
| `#statement {#` … `#}#` | Control flow. Anything ending in `{` opens a block. |
| `#{ statements }#` | Run code and append nothing — declarations, counters, running totals. |

## Escaping

Values are substituted exactly as they are, so anything originating with a user
must be escaped where it is written:

```html
<li>#htmlEncode(comment.body)#</li>
```

`htmlEncode` is available in every template without importing anything. Leave it
off only when the value is markup you produced yourself.

## Templates that contain `<`

A browser escapes `<` to `&lt;` inside an ordinary element before the library
ever sees the markup, which breaks an expression such as `#if(i < n) {#`. Keep
templates containing comparisons in a script block, which holds raw text:

```html
<script type="text/template" id="tpl">
    #for(let i = 0; i < rows.length; i++) {#…#}#
</script>
<div id="out"></div>

<script>new hashJS('tpl', data, 'out');</script>
```

This does not apply to `hashJS.render`, which is handed the string directly.

## Content Security Policy

Compiling a template means turning source into a function, which means
`new Function` — and a strict policy blocks that unless it allows
`script-src 'unsafe-eval'`.

You do not have to grant it. Precompile instead:

```
node precompile.js templates/ -o public/templates.js
```

That writes an ordinary script containing the render functions your templates
compile to. Load it in the page and pair it with `fromPrecompiled`:

```html
<script src="/hashJS.js"></script>
<script src="/templates.js"></script>
<script>
    const row = hashJS.fromPrecompiled(hashJSTemplates.row);
    list.innerHTML = users.map(row).join('');
</script>
```

Nothing is evaluated in the browser, so the policy stays closed. Verified
against `default-src 'none'; script-src 'unsafe-inline'`: the constructor and
`render` both raise `EvalError`, while the precompiled path renders normally.

The generated file uses `with`, so load it as a classic script — `with` is a
syntax error in strict mode and therefore in modules.

### Why runtime compilation needs eval at all

A template arrives as a string and its expressions are real JavaScript. Running
them without handing them to the engine would mean parsing and interpreting
JavaScript in JavaScript — a subset of the language, several times slower, and
no longer the thing this library promises. Precompiling moves that step to a
machine you control instead of removing it.

## Install

```html
<script src="https://cdn.jsdelivr.net/gh/richdafunk/hashJS@v1.3.6/hashJS.js"></script>
```

The file also exports through `module.exports` and assigns `global.hashJS`, so
`require` works without a bundler.

## Changes in 1.3.6

- `hashJS.render` and `hashJS.compile` for use without a DOM.
- `htmlEncode` in templates and `hashJS.escape` outside them.
- A lone `#` in ordinary markup — anchor targets, CSS colours, issue numbers — no
  longer pairs with the next one and swallows the template.
- A name the data does not carry renders empty instead of throwing, matching how
  server-side hash expressions already behave. `null` and `undefined` render
  empty rather than as the words.
- A `switch` may be laid out over several lines.
- Generated code dropped from about 8.8× the template size to 1.7×.

Full examples: <https://hashjs.org/>

## Licence

MIT.
