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
 * Date: 2026-08-11
 */

(function() {
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

        while (cursor < template.length) {
            // Check for statement syntax: #{...}#
            if (template.startsWith('#{', cursor)) {
                const end = template.indexOf('}#', cursor + 2);
                if (end > -1) {
                    const code = template.substring(cursor + 2, end).trim();
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
                        // Add semicolon for statements that need it
                        if (code === 'break' || code === 'continue' || code === 'return') {
                            output += `${code};\n`;
                        } else {
                            output += `${code}\n`;
                        }
                    } else {
                        output += `result += ${code};\n`;
                    }
                    cursor = end + 1;
                    continue;
                }
            }

            const text = template[cursor];
            output += `result += ${JSON.stringify(text)};\n`;
            cursor++;
        }

        output += "return result;";
        return new Function('data', `with(data) { ${output} }`);
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
