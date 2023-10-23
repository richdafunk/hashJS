const hashJS = function(templateElementId, data) {
    this.templateElement = document.getElementById(templateElementId);
    this.originalTemplate = this.templateElement.innerHTML;
    this.currentData = data;
    this.compiledFunction = this.compileTemplate(this.originalTemplate);
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
        this.templateElement.innerHTML = renderedTemplate;
    },

    refresh: function(data) { this.update(data); },
    bind: function(data) { this.update(data); }    
};
