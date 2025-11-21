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
 * Version: 1.3.3
 * Author: Open Productivity ORG
 * License: MIT
 * Date: 2025-11-21
 */

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
            if (template.startsWith('#', cursor)) {
                const end = template.indexOf('#', cursor + 1);
                if (end > -1) {
                    const code = template.substring(cursor + 1, end).trim();
                    if (code.startsWith('for(') || code.startsWith('for ') || code.startsWith('if(') || code.startsWith('if ') || code === '}') {
                        output += `${code}\n`;
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
