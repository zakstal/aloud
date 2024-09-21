// fountain-js 0.1.10
// http://www.opensource.org/licenses/mit-license.php
// Copyright (c) 2012 Matt Daly


'use strict';

const Heading = ({ id, variant = 'h1', text = '', sceneNumber, order }: { variant: string, text?: string, sceneNumber?: number | null, order: number | null }) => {
    if (variant === 'h1') return <h1 key={id} data-order={order} >{text}</h1>
    if (variant === 'h2') return <h2 key={id} data-order={order} >{text}</h2>
    if (variant === 'h3') return <h3 key={id} data-order={order} id={sceneNumber?.toString()} className="font-courier font-bold">{text}</h3>
    if (variant === 'h4') return <h4 key={id} data-order={order} >{text}</h4>

    // TODO i know
    if (variant === 'hr') return <hr key={id} data-order={order}/>
    if (variant === 'br') return null
}

export const Paragraph = ({ id, text = '', type = '', order, dataDepth }: { text: string, type?: string, order: number, dataDepth?: number | null }) => {
    return (
        <p key={id} data-order={order} data-depth={dataDepth} className={type}>{text}</p>
    )
}


const Div = ({ id, className = '', order, children }: { className?: string, order: number, children: any }) => {
    return (
        <div key={id} data-order={order}className={className}>{children}</div>
    )
}

var regex = {
    title_page: /^((?:title|credit|author[s]?|source|notes|draft date|date|contact|copyright)\:)/gim,

    scene_heading: /^((?:\*{0,3}_?)?(?:(?:int|ext|est|i\/e)[. ]).+)|^(?:\.(?!\.+))(.+)/i,
    scene_number: /( *#(.+)# *)/,

    transition: /^((?:FADE (?:TO BLACK|OUT)|CUT TO BLACK)\.|.+ TO\:)|^(?:> *)(.+)/,
    
    dialogue: /^([A-Z*_]+[0-9A-Z (._\-')]*)(\^?)?(?:\n(?!\n+))([\s\S]+)/,
    parenthetical: /^(\(.+\))$/,

    action: /^(.+)/g,
    centered: /^(?:> *)(.+)(?: *<)(\n.+)*/g,
        
    section: /^(#+)(?: *)(.*)/,
    synopsis: /^(?:\=(?!\=+) *)(.*)/,

    note: /^(?:\[{2}(?!\[+))(.+)(?:\]{2}(?!\[+))$/,
    note_inline: /(?:\[{2}(?!\[+))([\s\S]+?)(?:\]{2}(?!\[+))/g,
    boneyard: /(^\/\*|^\*\/)$/g,

    page_break: /^\={3,}$/,
    line_break: /^ {2}$/,

    emphasis: /(_|\*{1,3}|_\*{1,3}|\*{1,3}_)(.+)(_|\*{1,3}|_\*{1,3}|\*{1,3}_)/g,
    bold_italic_underline: /(_{1}\*{3}(?=.+\*{3}_{1})|\*{3}_{1}(?=.+_{1}\*{3}))(.+?)(\*{3}_{1}|_{1}\*{3})/g,
    bold_underline: /(_{1}\*{2}(?=.+\*{2}_{1})|\*{2}_{1}(?=.+_{1}\*{2}))(.+?)(\*{2}_{1}|_{1}\*{2})/g,
    italic_underline: /(?:_{1}\*{1}(?=.+\*{1}_{1})|\*{1}_{1}(?=.+_{1}\*{1}))(.+?)(\*{1}_{1}|_{1}\*{1})/g,
    bold_italic: /(\*{3}(?=.+\*{3}))(.+?)(\*{3})/g,
    bold: /(\*{2}(?=.+\*{2}))(.+?)(\*{2})/g,
    italic: /(\*{1}(?=.+\*{1}))(.+?)(\*{1})/g,
    underline: /(_{1}(?=.+_{1}))(.+?)(_{1})/g,

    splitter: /\n{2,}/g,
    cleaner: /^\n+|\n+$/,
    standardizer: /\r\n|\r/g,
    whitespacer: /^\t+|^ {3,}/gm
};

var lexer = function (script) {
    return script.replace(regex.boneyard, '\n$1\n')
                .replace(regex.standardizer, '\n')
                .replace(regex.cleaner, '')
                .replace(regex.whitespacer, '');
};
    
export const tokenize = function (script) {
    var src    = lexer(script).split(regex.splitter)
    , i      = src.length, line, match, parts, text, meta, x, xlen, dual
    , tokens = [];

    while (i--) {
    line = src[i];
    
    // title page
    if (regex.title_page.test(line)) {
        match = line.replace(regex.title_page, '\n$1').split(regex.splitter).reverse();
        for (x = 0, xlen = match.length; x < xlen; x++) {
        parts = match[x].replace(regex.cleaner, '').split(/\:\n*/);
        tokens.push({ type: parts[0].trim().toLowerCase().replace(' ', '_'), text: parts[1].trim() });
        }
        continue;
    }

    // scene headings
    if (match = line.match(regex.scene_heading)) {
        text = match[1] || match[2];

        if (text.indexOf('  ') !== text.length - 2) {
        if (meta = text.match(regex.scene_number)) {
            meta = meta[2];
            text = text.replace(regex.scene_number, '');
        }
        tokens.push({ type: 'scene_heading', text: text, scene_number: meta || undefined });
        }
        continue;
    }

    // centered
    if (match = line.match(regex.centered)) {
        tokens.push({ type: 'centered', text: match[0].replace(/>|</g, '') });
        continue;
    }

    // transitions
    if (match = line.match(regex.transition)) {
        tokens.push({ type: 'transition', text: match[1] || match[2] });
        continue;
    }
    
    // dialogue blocks - characters, parentheticals and dialogue
    if (match = line.match(regex.dialogue)) {
        if (match[1].indexOf('  ') !== match[1].length - 2) {
        // we're iterating from the bottom up, so we need to push these backwards
        if (match[2]) {
            tokens.push({ type: 'dual_dialogue_end' });
        }

        tokens.push({ type: 'dialogue_end' });

        parts = match[3].split(/(\(.+\))(?:\n+)/).reverse();

        for (x = 0, xlen = parts.length; x < xlen; x++) {	
            text = parts[x];

            if (text.length > 0) {
            tokens.push({ type: regex.parenthetical.test(text) ? 'parenthetical' : 'dialogue', text: text });
            }
        }

        tokens.push({ type: 'character', text: match[1].trim() });
        tokens.push({ type: 'dialogue_begin', dual: match[2] ? 'right' : dual ? 'left' : undefined });

        if (dual) {
            tokens.push({ type: 'dual_dialogue_begin' });
        }

        dual = match[2] ? true : false;
        continue;
        }
    }
    
    // section
    if (match = line.match(regex.section)) {
        tokens.push({ type: 'section', text: match[2], depth: match[1].length });
        continue;
    }
    
    // synopsis
    if (match = line.match(regex.synopsis)) {
        tokens.push({ type: 'synopsis', text: match[1] });
        continue;
    }

    // notes
    if (match = line.match(regex.note)) {
        tokens.push({ type: 'note', text: match[1]});
        continue;
    }      

    // boneyard
    if (match = line.match(regex.boneyard)) {
        tokens.push({ type: match[0][0] === '/' ? 'boneyard_begin' : 'boneyard_end' });
        continue;
    }      

    // page breaks
    if (regex.page_break.test(line)) {
        tokens.push({ type: 'page_break' });
        continue;
    }
    
    // line breaks
    if (regex.line_break.test(line)) {
        tokens.push({ type: 'line_break' });
        continue;
    }

    tokens.push({ type: 'action', text: line });
    }

    return tokens;
};




var inline = {
    note: '<!-- $1 -->',

    line_break: '',

    bold_italic_underline: '<span class=\"bold italic underline\">$2</span>',
    bold_underline: '<span class=\"bold underline\">$2</span>',
    italic_underline: '<span class=\"italic underline\">$2</span>',
    bold_italic: '<span class=\"bold italic\">$2</span>',
    bold: '<span class=\"bold\">$2</span>',
    italic: '<span class=\"italic\">$2</span>',
    underline: '<span class=\"underline\">$2</span>'
};

inline.lexer = function (s) {
    if (!s) {
    return;
    }  

    var styles = [ 'underline', 'italic', 'bold', 'bold_italic', 'italic_underline', 'bold_underline', 'bold_italic_underline' ]
            , i = styles.length, style, match;

    s = s.replace(regex.note_inline, inline.note).replace(/\\\*/g, '[star]').replace(/\\_/g, '[underline]').replace(/\n/g, inline.line_break);

    // if (regex.emphasis.test(s)) {                         // this was causing only every other occurence of an emphasis syntax to be parsed
    while (i--) {
        style = styles[i];
        match = regex[style];
    
        if (match.test(s)) {
        s = s.replace(match, inline[style]);
        }
    }
    // }

    return s.replace(/\[star\]/g, '*').replace(/\[underline\]/g, '_').replace(/<br\/>/g, '').trim();
};


export type Tokens = {
    id?: stirng | null;
    text: string;
    type: 'action' | 'scene_heading' | 'dialogue_begin' | 'dialogue_end' | 'dialogue' | 'character' | 'transition';
    scene_number: number;
    dual: string;
    depth: string;
}

interface TokenContentInput {
    tokens: Tokens[];
}

export const TokenContent = function ({ tokens }: TokenContentInput) {
    if (!tokens) return []

    const title_page = []
    const htmlContent = []
    let tempHtml = []
    let i = tokens.length
    let isDiologStart = false
    let html = htmlContent
    while (i--) {
        const token = tokens[i];
        if (!token) continue
        token.text = inline.lexer(token.text);

        switch (token.type) {
            // edit node is not from foutain
            case 'editNode': html.push(<Paragraph id={token.id} order={i} text={token.text} />); break;
            case 'title': title_page.push(<Heading id={token.id} variant="h1" text={token.text} order={i}/>); title = token.text.replace('<br />', ' ').replace(/<(?:.|\n)*?>/g, ''); break;
            case 'credit': title_page.push(<Paragraph id={token.id} order={i} type="credit" text={token.text}/>); break;
            case 'author': title_page.push(<Paragraph id={token.id} order={i} type="authors" text={token.text}/>); break;
            case 'authors': title_page.push(<Paragraph id={token.id} order={i} type="authors" text={token.text}/>); break;
            case 'source': title_page.push(<Paragraph id={token.id} order={i} type="source" text={token.text}/>); break;
            case 'notes': title_page.push(<Paragraph id={token.id} order={i} type="notes" text={token.text}/>); break;
            case 'draft_date': title_page.push(<Paragraph id={token.id} order={i} type="draft-date" text={token.text} />); break;
            case 'date': title_page.push(<Paragraph id={token.id} order={i} type="date" text={token.text}/>); break;
            case 'contact': title_page.push(<Paragraph id={token.id} order={i} type="contact" text={token.text}/>); break;
            case 'copyright': title_page.push(<Paragraph id={token.id} order={i} type="copyright" text={token.text}/>); break;

            case 'scene_heading': html.push(<Heading id={token.id} variant="h3"  sceneNumber={token.scene_number} text={token.text} order={i} />); break;
            case 'transition': html.push(<Heading id={token.id} variant="h2" text={token.text} order={i}/>); break;

            case 'dual_dialogue_begin': 
                // html.push(<Div id={token.id} className="dual-dialogue" order={i} />); 
                html = htmlContent
                html.push(<Div id={token.id} className="dual-dialogue" order={i} >{tempHtml.reverse()}</Div>); 
                tempHtml = []
               
                break;
            case 'dialogue_begin':
                
                html = htmlContent
                html.push(<Div id={token.id} className={"dialogue" + (token.dual ? ' ' + token.dual : '') } order={i} >{tempHtml.reverse()}</Div>); 
                tempHtml = []
                //  html.push(<Div id={token.id} className={"dialogue" + (token.dual ? ' ' + token.dual : '') } order={i} />); 
                break;
            case 'character': html.push(<Heading id={token.id} variant="h4" text={token.text} order={i}/>); break;
            case 'parenthetical': html.push(<Paragraph id={token.id} order={i} type="parenthetical" text={token.text}/>); break;
            case 'dialogue': html.push(<Paragraph id={token.id} order={i} text={token.text} />); break;
            case 'dialogue_end': 
                // html.push(<Div id={token.id} order={i}/>); 
                html = tempHtml
                break;
            case 'dual_dialogue_end':
                // html.push(<Div id={token.id} order={i}/>); 
                html = tempHtml
                break;

            case 'section': html.push(<Paragraph id={token.id} order={i} type="section" dataDepth={token.depth} text={token.text}/>); break;
            case 'synopsis': html.push(<Paragraph id={token.id} order={i} type="synopsis" text={token.text}/>); break;

            case 'note': html.push('<!-- ' + token.text + '-->'); break;
            case 'boneyard_begin': html.push('<!-- '); break;
            case 'boneyard_end': html.push(' -->'); break;

            case 'action': html.push(<Paragraph id={token.id} order={i} text={token.text} />); break;
            case 'centered': html.push(<Paragraph id={token.id} order={i} type="centered" text={token.text}/>); break;
            
            case 'page_break': html.push(<Heading id={token.id} variant="hr" order={i} />); break;
            case 'line_break': html.push(<Heading id={token.id} variant="br" order={i} />); break;
        }
    }

    return (
        <>
            {title_page.reverse()}
            {htmlContent.reverse()}
        </>
    )
};

