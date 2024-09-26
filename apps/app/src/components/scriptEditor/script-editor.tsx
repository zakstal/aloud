import './script-editor.css';

import { TokenContent, Tokens, tokenize } from './script-tokens'
import { useRef, useEffect, useState, useCallback } from 'react';
import { useFountainNodes } from './useFountainNodes'


interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
}

// const getId = () => (Math.random() + 1).toString(36).substring(7);

export const ScriptEditor =({
    scriptTokens,
    className,
}: ScriptEditorInput) => {
    const myRef = useRef(null);
    const [
        tokens, 
        handleKeyDown, 
        handleKeyUp, 
        handleEnter, 
        handleOnBackSpace,
        clearCurrrentNode, 
        setCurrentNode, 
        handleOnSelect,
        handlePaste,
        handleCut,
        currentOrderId,
        secondaryOrderId,
    ] = useFountainNodes(scriptTokens, myRef)

    useEffect(() => {
        myRef.current && myRef.current.focus()
    }, [myRef])

    return (
        <div
            autofocus
            ref={myRef}
            contentEditable={true}
            suppressContentEditableWarning={true} 
            className={className + ' script-editor'}
            onBlur={clearCurrrentNode}
            onMouseDown={setCurrentNode}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
            onCut={handleCut}
            onSelect={function(event) {
                handleOnSelect(event)
            }}
            // onSelectChange={function(event) {
            //     console.log('Selection change');
            //     console.log('Element:', event.target);
            // }}
            onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                   return  handleOnBackSpace(e)
                }
                if (e.key === 'Enter') {
                    return handleEnter(e)
                }

                handleKeyDown(e)
            }}

                
            >
                {/* <div style={{ position: 'sticky', top: 0 }}>currentOrderId: {currentOrderId}</div>
                <div>secondaryOrderId: {secondaryOrderId}</div> */}
            <TokenContent tokens={tokens} />
        </div>
    )
}