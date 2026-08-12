/**
 * hashJS: A JavaScript Templating Library
 *
 * This library provides a mechanism to compile and render templates using pure JavaScript.
 * By leveraging the power of JavaScript's scope and context, hashJS allows for dynamic rendering of templates
 * based on provided data. Instead of introducing new syntax, hashJS utilizes native JavaScript within templates,
 * offering both simplicity and flexibility to developers.
 *
 * https://hashjs.org/
 *
 * Version: 1.3.6
 * Author: Open Productivity ORG
 * License: MIT
 * Date: 2026-08-12
 */

(function() {

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escape a value for safe inclusion in HTML text or a quoted attribute.
 * Null and undefined become the empty string rather than the words "null"
 * and "undefined".
 */
const escapeHtml = function(value) {
    if (value === null || value === undefined) { return ''; }
    return String(value).replace(/[&<>"']/g, function(c) { return ESCAPE_MAP[c]; });
};

/**
 * Coerce an expression result into template output. An expression that
 * resolves to nothing renders as nothing, rather than as the text
 * "undefined" or "null".
 */
const toOutput = function(value) {
    return (value === null || value === undefined) ? '' : value;
};

// Names every template can use, whether or not they appear in the data.
const templateGlobals = {
    __out: toOutput,
    htmlEncode: escapeHtml,
    htmlencode: escapeHtml
};

/**
 * Build the scope a compiled template runs against.
 *
 * The `has` trap claims every name, which keeps `with` from falling through
 * to the enclosing scope and throwing on a name the data does not carry.
 * Lookups then resolve in order: the data, the template globals, the real
 * global object (so Math, JSON, Date and friends still work), and finally
 * the empty string. A missing name therefore renders empty instead of
 * aborting the whole template over one typo.
 */
const createScope = function(data) {
    const source = (data && typeof data === 'object') ? data : {};
    if (typeof Proxy === 'undefined') { return source; }
    return new Proxy(source, {
        has: function() { return true; },
        get: function(target, key) {
            if (key === Symbol.unscopables) { return undefined; }
            if (key in target) { return target[key]; }
            if (key in templateGlobals) { return templateGlobals[key]; }
            if (typeof globalThis !== 'undefined' && key in globalThis) { return globalThis[key]; }
            return '';
        }
    });
};

/**
 * Decide whether the text between two hashes is really an expression.
 *
 * A lone `#` in ordinary markup is common — anchor targets, CSS colours,
 * issue numbers — and two of them in the same template would otherwise pair
 * up and swallow everything in between. Anything that will not parse as a
 * JavaScript expression is not one, so the hash is emitted as text instead.
 */
const isExpression = function(code) {
    if (code === '') { return false; }
    try {
        new Function('return (' + code + '\n);');
        return true;
    } catch (e) {
        return false;
    }
};

const hashJS = function(templateElementOrId, data, outputElementOrId) {
    // Helper function to resolve element from ID or element
    const resolveElement = function(elementOrId, paramName) {
        if (typeof elementOrId === 'string') {
            const element = document.getElementById(elementOrId);
            if (!element) {
                throw new Error(`${paramName}: Element with ID "${elementOrId}" not found`);
            }
            return element;
        } else if (elementOrId instanceof HTMLElement) {
            return elementOrId;
        } else {
            throw new Error(`${paramName}: Must be either an element ID (string) or a DOM element`);
        }
    };

    // Resolve template element
    this.templateElement = resolveElement(templateElementOrId, 'Template element');

    // Use the 'text' property for script tags with non-standard types, otherwise use 'innerHTML'
    this.originalTemplate = this.templateElement.tagName === 'SCRIPT' ? this.templateElement.text : this.templateElement.innerHTML;
    this.currentData = data;
    this.compiledFunction = this.compileTemplate(this.originalTemplate);

    // If the outputElementOrId is provided, use that element to display the output
    this.outputElement = outputElementOrId ? resolveElement(outputElementOrId, 'Output element') : this.templateElement;

    if (data) this.update();
};

hashJS.prototype = {
    compileTemplate: function(template) {
        let output = "let result = '';\n";
        let cursor = 0;

        // Literal text is gathered up and emitted in one assignment per run,
        // rather than one per character.
        let literal = '';
        const flush = function() {
            if (literal !== '') {
                output += `result += ${JSON.stringify(literal)};\n`;
                literal = '';
            }
        };

        while (cursor < template.length) {
            // Check for statement syntax: #{...}#
            if (template.startsWith('#{', cursor)) {
                const end = template.indexOf('}#', cursor + 2);
                if (end > -1) {
                    const code = template.substring(cursor + 2, end).trim();
                    flush();
                    output += `${code}\n`;
                    cursor = end + 2;
                    continue;
                }
            }

            // Check for expression/control syntax: #...#
            if (template.startsWith('#', cursor)) {
                const end = template.indexOf('#', cursor + 1);
                if (end > -1) {
                    const code = template.substring(cursor + 1, end).trim();

                    // Determine if this is a control structure or an expression
                    // Control structures are:
                    // 1. Anything ending with { (block openers)
                    // 2. Just } (block closers)
                    // 3. Standalone keywords: else, break, continue, return, case, default
                    // 4. Lines starting with } followed by keywords (} else, } catch, etc)
                    const isControl =
                        code.endsWith('{') ||                    // if(...) {, for(...) {, while(...) {, try {, etc.
                        code === '}' ||                          // }
                        code === 'else' ||                       // else
                        code === 'break' ||                      // break
                        code === 'continue' ||                   // continue
                        code.startsWith('return ') ||            // return x;
                        code === 'return' ||                     // return;
                        code.startsWith('case ') ||              // case x:
                        code === 'default:' ||                   // default:
                        code.startsWith('} ') ||                 // } else, } catch, } finally, } while, etc.
                        /^}\s*while\s*\(/.test(code);            // } while(...) from do-while

                    if (isControl) {
                        flush();
                        // Add semicolon for statements that need it
                        if (code === 'break' || code === 'continue' || code === 'return') {
                            output += `${code};\n`;
                        } else {
                            output += `${code}\n`;
                        }
                        cursor = end + 1;
                        continue;
                    }

                    if (isExpression(code)) {
                        flush();
                        output += `result += __out(${code});\n`;
                        cursor = end + 1;
                        continue;
                    }
                    // Not an expression: this hash is ordinary text. Fall through
                    // and emit it, then carry on from the character after it —
                    // the closing hash gets its own chance to open an expression.
                }
            }

            literal += template[cursor];
            cursor++;
        }

        flush();
        output += "return result;";

        const compiled = new Function('__scope', `with(__scope) { ${output} }`);
        return function(data) { return compiled(createScope(data)); };
    },

    update: function(data) {
        if (data) this.currentData = data;
        const renderedTemplate = this.compiledFunction(this.currentData);
        this.outputElement.innerHTML = renderedTemplate;
    },

    refresh: function(data) { this.update(data); },
    bind: function(data) { this.update(data); }

};

/**
 * Render a template string with data and return the result as a string.
 *
 * The constructor works against the DOM: it resolves an element, reads its
 * markup and writes the result back into the page. This does the same
 * compilation without a document, so the same template can be rendered on a
 * server, in a worker, or anywhere else there is no DOM.
 *
 *   const html = hashJS.render('<li>#name#</li>', { name: 'Ada' });
 *
 * @param {string} template - The template source.
 * @param {object} data - The data the template is rendered against.
 * @returns {string} The rendered output.
 */
hashJS.render = function(template, data) {
    if (typeof template !== 'string') {
        throw new Error('hashJS.render: template must be a string');
    }
    return hashJS.prototype.compileTemplate(template)(data || {});
};

/**
 * Compile a template once and get a reusable render function back.
 *
 * Compilation is the expensive half of rendering. A server handling many
 * requests, or a page re-rendering a list as data changes, should compile
 * once and call the result per render.
 *
 *   const row = hashJS.compile('<li>#name#</li>');
 *   users.map(row).join('');
 *
 * @param {string} template - The template source.
 * @returns {function(object): string} A function that renders the template.
 */
hashJS.compile = function(template) {
    if (typeof template !== 'string') {
        throw new Error('hashJS.compile: template must be a string');
    }
    return hashJS.prototype.compileTemplate(template);
};

/**
 * Escape a value for safe inclusion in HTML.
 *
 * Templates get this as `htmlEncode` without importing anything. It is
 * exposed here as well so calling code can escape values before they are
 * ever put into the data.
 *
 * @param {*} value - The value to escape.
 * @returns {string} The escaped text.
 */
hashJS.escape = escapeHtml;

// Export to global scope
if (typeof window !== 'undefined') {
    window.hashJS = hashJS;
}
if (typeof global !== 'undefined') {
    global.hashJS = hashJS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hashJS;
}

})();
