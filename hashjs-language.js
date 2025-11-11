// HashJS Language Definition for Monaco Editor
// Server-side rendering JavaScript template language

export function registerHashJSLanguage(monaco) {
    
    // Register the language
    monaco.languages.register({ id: 'hashjs' });

    // Define the language configuration
    monaco.languages.setLanguageConfiguration('hashjs', {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
            ['#{', '}#']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '`', close: '`' },
            { open: '#{', close: '}#' },
            { open: '#', close: '#' }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '`', close: '`' }
        ],
        folding: {
            markers: {
                start: new RegExp('^\\s*<!--\\s*#region\\b.*-->'),
                end: new RegExp('^\\s*<!--\\s*#endregion\\b.*-->')
            }
        }
    });

    // Define the tokenizer
    monaco.languages.setMonarchTokensProvider('hashjs', {
        defaultToken: '',
        tokenPostfix: '.hashjs',

        keywords: [
            'break', 'case', 'catch', 'class', 'continue', 'const',
            'constructor', 'debugger', 'default', 'delete', 'do', 'else',
            'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
            'get', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null',
            'return', 'set', 'static', 'super', 'switch', 'this', 'throw',
            'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while',
            'with', 'yield', 'async', 'await', 'of'
        ],

        typeKeywords: [],

        operators: [
            '<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',
            '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&', '|', '^',
            '!', '~', '&&', '||', '??', '?', ':', '=', '+=', '-=', '*=',
            '**=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '@'
        ],

        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        digits: /\d+(_+\d+)*/,
        octaldigits: /[0-7]+(_+[0-7]+)*/,
        binarydigits: /[0-1]+(_+[0-1]+)*/,
        hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

        regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
        regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

        tokenizer: {
            root: [
                // HashJS master file directive
                [/<!--#\s*master\s+file\s*=.*?-->/, 'meta.directive'],
                
                // HTML comments
                [/<!--/, 'comment', '@comment'],
                
                // HashJS block comments in code
                [/(#{)(\s*)(\/\*)/, ['delimiter.hash', 'white', 'comment'], '@hashBlockComment'],
                
                // HashJS multi-line code blocks: #{ ... }#
                [/#{/, 'delimiter.hash', '@hashBlock'],
                
                // HashJS for loops: #for(...) {# ... #}#
                [/#(for|if|while|switch)\s*\([^)]*\)\s*{#/, 'keyword.control.hashjs', '@hashForBlock'],
                
                // HashJS closing brace: #}#
                [/#}#/, 'delimiter.hash'],
                
                // HashJS inline expressions: #expression#
                [/#/, 'delimiter.hash', '@hashInline'],
                
                // HTML tags
                [/<\/?[a-zA-Z][\w\-]*/, 'tag', '@tag'],
                
                // HTML text content
                [/[^<#]+/, 'text']
            ],

            comment: [
                [/[^-]+/, 'comment'],
                [/-->/, 'comment', '@pop'],
                [/-/, 'comment']
            ],

            hashBlockComment: [
                [/\*\//, 'comment', '@pop'],
                [/./, 'comment']
            ],

            // Multi-line hash block: #{ JavaScript code }#
            hashBlock: [
                [/}#/, 'delimiter.hash', '@pop'],
                { include: '@javascript' }
            ],

            // For/if/while blocks: #for(...) {# ... #}#
            hashForBlock: [
                [/#}#/, 'delimiter.hash', '@pop'],
                [/#/, 'delimiter.hash', '@hashInline'],
                [/#{/, 'delimiter.hash', '@hashBlock'],
                [/<\/?[a-zA-Z][\w\-]*/, 'tag', '@tag'],
                [/[^<#]+/, 'text']
            ],

            // Inline hash expressions: #variable# or #function()#
            hashInline: [
                [/#/, 'delimiter.hash', '@pop'],
                { include: '@javascript' }
            ],

            // JavaScript tokenization
            javascript: [
                // Comments
                [/\/\/.*$/, 'comment'],
                [/\/\*/, 'comment', '@jsBlockComment'],

                // Whitespace
                { include: '@whitespace' },

                // Regular expressions
                [/\/(?!\\)(?:(?:\\.)|[^\/\\\n])*\/[gimuy]*/, 'regexp'],

                // Delimiters and operators
                [/[()\[\]]/, '@brackets'],
                [/[{}]/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],

                // Numbers
                [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
                [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
                [/0[xX](@hexdigits)n?/, 'number.hex'],
                [/0[oO]?(@octaldigits)n?/, 'number.octal'],
                [/0[bB](@binarydigits)n?/, 'number.binary'],
                [/(@digits)n?/, 'number'],

                // Delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],

                // Strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/'([^'\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string_double'],
                [/'/, 'string', '@string_single'],
                [/`/, 'string', '@string_backtick'],

                // Keywords and identifiers
                [/[a-zA-Z_$][\w$]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }]
            ],

            jsBlockComment: [
                [/\*\//, 'comment', '@pop'],
                [/./, 'comment']
            ],

            whitespace: [
                [/[ \t\r\n]+/, '']
            ],

            string_double: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],

            string_single: [
                [/[^\\']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/'/, 'string', '@pop']
            ],

            string_backtick: [
                [/\$\{/, 'delimiter.bracket', '@bracketCounting'],
                [/[^\\`$]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/`/, 'string', '@pop']
            ],

            bracketCounting: [
                [/\{/, 'delimiter.bracket', '@bracketCounting'],
                [/\}/, 'delimiter.bracket', '@pop'],
                { include: '@javascript' }
            ],

            // HTML tag handling
            tag: [
                [/[ \t\r\n]+/, ''],
                [/(xdt:Transform)(\s*=\s*)("Replace")/, ['attribute.name', 'delimiter', 'attribute.value']],
                [/(\w+)(\s*=\s*)("[^"]*")/, ['attribute.name', 'delimiter', 'attribute.value']],
                [/(\w+)(\s*=\s*)('[^']*')/, ['attribute.name', 'delimiter', 'attribute.value']],
                [/\w+/, 'attribute.name'],
                [/>/, 'tag', '@pop'],
                [/\/>/, 'tag', '@pop']
            ]
        }
    });

    // Define completions (autocomplete)
    monaco.languages.registerCompletionItemProvider('hashjs', {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            // Check if we're inside a hash block
            const textUntilPosition = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            const isInHashContext = /#[^#]*$/.test(textUntilPosition);

            const suggestions = [
                // HashJS specific functions
                {
                    label: 'write',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'write(${1:content})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Skriver ut innhold til HTML',
                    range: range
                },
                {
                    label: 'docly.getFiles',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'docly.getFiles(${1:path}, ${2:pattern}, ${3:depth}, ${4:mode})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Henter filer fra Docly',
                    range: range
                },
                {
                    label: 'docly.toHtml',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'docly.toHtml(${1:text})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Konverterer tekst til HTML-sikker streng',
                    range: range
                },
                {
                    label: 'request',
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: 'request.${1:property}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Request objekt med properties som title, params, osv',
                    range: range
                }
            ];

            // Add HashJS block snippets
            if (!isInHashContext) {
                suggestions.push(
                    {
                        label: '#{}# - Code block',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#{\\n\\t${1:// JavaScript code}\\n}#',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'HashJS kodeblokk',
                        range: range
                    },
                    {
                        label: '#for# - For loop',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#for(let ${1:item} of ${2:array}) {#\\n\\t${3}\\n#}#',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'HashJS for-løkke',
                        range: range
                    },
                    {
                        label: '#if# - If statement',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#if(${1:condition}) {#\\n\\t${2}\\n#}#',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'HashJS if-setning',
                        range: range
                    }
                );
            }

            return { suggestions: suggestions };
        }
    });

    // Register a theme for HashJS
    monaco.editor.defineTheme('hashjs-theme', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'delimiter.hash', foreground: '800080', fontStyle: 'bold', background: 'FFF9E6' },
            { token: 'keyword.control.hashjs', foreground: 'AF00DB', fontStyle: 'bold', background: 'FFF9E6' },
            { token: 'meta.directive', foreground: '008000', fontStyle: 'italic' },
            { token: 'tag', foreground: '800000' },
            { token: 'attribute.name', foreground: 'FF0000' },
            { token: 'attribute.value', foreground: '0000FF' },
            { token: 'comment', foreground: '008000', fontStyle: 'italic', background: 'FFF9E6' },
            { token: 'string', foreground: 'A31515', background: 'FFF9E6' },
            { token: 'keyword', foreground: '0000FF', fontStyle: 'bold', background: 'FFF9E6' },
            { token: 'number', foreground: '098658', background: 'FFF9E6' },
            { token: 'regexp', foreground: '811F3F', background: 'FFF9E6' },
            { token: 'identifier', foreground: '001080', background: 'FFF9E6' },
            { token: 'operator', foreground: '000000', background: 'FFF9E6' },
            { token: 'delimiter', foreground: '000000', background: 'FFF9E6' },
            { token: 'white', background: 'FFF9E6' }
        ],
        colors: {
            'editor.foreground': '#000000',
            'editor.background': '#FFFFFF'
        }
    });

    // Dark theme variant
    monaco.editor.defineTheme('hashjs-theme-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'delimiter.hash', foreground: 'C586C0', fontStyle: 'bold', background: '3A3A2A' },
            { token: 'keyword.control.hashjs', foreground: 'C586C0', fontStyle: 'bold', background: '3A3A2A' },
            { token: 'meta.directive', foreground: '6A9955', fontStyle: 'italic' },
            { token: 'tag', foreground: '569CD6' },
            { token: 'attribute.name', foreground: '9CDCFE' },
            { token: 'attribute.value', foreground: 'CE9178' },
            { token: 'comment', foreground: '6A9955', fontStyle: 'italic', background: '3A3A2A' },
            { token: 'string', foreground: 'CE9178', background: '3A3A2A' },
            { token: 'keyword', foreground: '569CD6', fontStyle: 'bold', background: '3A3A2A' },
            { token: 'number', foreground: 'B5CEA8', background: '3A3A2A' },
            { token: 'regexp', foreground: 'D16969', background: '3A3A2A' },
            { token: 'identifier', foreground: '9CDCFE', background: '3A3A2A' },
            { token: 'operator', foreground: 'D4D4D4', background: '3A3A2A' },
            { token: 'delimiter', foreground: 'D4D4D4', background: '3A3A2A' },
            { token: 'white', background: '3A3A2A' }
        ],
        colors: {
            'editor.foreground': '#D4D4D4',
            'editor.background': '#1E1E1E'
        }
    });
}

// Example usage
export function createHashJSEditor(containerId, initialValue = '') {
    const editor = monaco.editor.create(document.getElementById(containerId), {
        value: initialValue,
        language: 'hashjs',
        theme: 'hashjs-theme',
        automaticLayout: true,
        minimap: { enabled: true },
        folding: true,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        fontSize: 14
    });

    // Apply HashJS background highlighting
    applyHashJSBackgroundHighlighting(editor);

    return editor;
}

// Helper function to apply yellow background to HashJS code sections
export function applyHashJSBackgroundHighlighting(editor) {
    let decorationsCollection = editor.createDecorationsCollection([]);
    
    function highlightHashJSCode() {
        const model = editor.getModel();
        if (!model) return;
        
        const decorations = [];
        const text = model.getValue();
        
        // First, find all HTML comments to exclude them
        const htmlComments = [];
        const commentPattern = /<!--[\s\S]*?-->/g;
        let match;
        
        while ((match = commentPattern.exec(text)) !== null) {
            htmlComments.push({
                start: match.index,
                end: match.index + match[0].length
            });
        }
        
        // Helper function to check if a range overlaps with any HTML comment
        function isInHtmlComment(start, end) {
            return htmlComments.some(comment => 
                (start >= comment.start && start < comment.end) ||
                (end > comment.start && end <= comment.end) ||
                (start <= comment.start && end >= comment.end)
            );
        }
        
        // Find hash sections: #{...}# blocks and #...# inline expressions
        const blockPattern = /#\{[\s\S]*?\}#/g;  // Multi-line blocks #{...}#
        const inlinePattern = /#[^#\n]*#/g;      // Inline expressions #...#
        
        // Process block patterns first
        blockPattern.lastIndex = 0;
        while ((match = blockPattern.exec(text)) !== null) {
            const startPos = match.index;
            const endPos = match.index + match[0].length;
            
            // Skip if inside HTML comment
            if (isInHtmlComment(startPos, endPos)) continue;
            
            const startPosition = model.getPositionAt(startPos);
            const endPosition = model.getPositionAt(endPos);
            
            decorations.push({
                range: new monaco.Range(
                    startPosition.lineNumber,
                    startPosition.column,
                    endPosition.lineNumber,
                    endPosition.column
                ),
                options: {
                    inlineClassName: 'hashjs-highlight'
                }
            });
        }
        
        // Process inline patterns (but avoid overlaps with blocks)
        inlinePattern.lastIndex = 0;
        while ((match = inlinePattern.exec(text)) !== null) {
            const startPos = match.index;
            const endPos = match.index + match[0].length;
            
            // Skip if this is part of a block pattern
            if (match[0].startsWith('#{')) continue;
            
            // Skip if inside HTML comment
            if (isInHtmlComment(startPos, endPos)) continue;
            
            const startPosition = model.getPositionAt(startPos);
            const endPosition = model.getPositionAt(endPos);
            
            decorations.push({
                range: new monaco.Range(
                    startPosition.lineNumber,
                    startPosition.column,
                    endPosition.lineNumber,
                    endPosition.column
                ),
                options: {
                    inlineClassName: 'hashjs-highlight'
                }
            });
        }
        
        decorationsCollection.set(decorations);
    }
    
    // Apply highlighting initially and on content change
    highlightHashJSCode();
    editor.onDidChangeModelContent(() => {
        highlightHashJSCode();
    });
    
    return decorationsCollection;
}
