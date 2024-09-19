import './script-editor.css';
import { TokenContent, Tokens } from './script-tokens'
import { useRef } from 'react';


interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
}

export const ScriptEditor =({
    scriptTokens,
    className,
}: ScriptEditorInput) => {
    const myRef = useRef(null);
    return (
        <div
            ref={myRef}
            contentEditable={true}
            className={className + ' script-editor'}
        >
            <TokenContent tokens={scriptTokens} />
        </div>
    )
}