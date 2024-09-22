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
        currentOrderId,
        secondaryOrderId,
    ] = useFountainNodes(scriptTokens, myRef)

    // This listens for changes on target nodes to update the type of element for formatting
    useEffect(() => {
        if (!myRef.current) return
        const observer = new MutationObserver((mutationRecords) => {
            // console.log('all', mutationRecords)
            // const removedNodes = mutationRecords[0]?.removedNodes
            // const selection = window.getSelection()
            // console.log("removedNodes", selection)
            // const target = mutationRecords[0].target
            // const data = target.data

            // if (data) {

            //     console.log('target node', target)
            //     console.log('parentNode node', target.parentNode)
            //     let orderId = target.tagName ? target?.getAttribute('data-order') : target?.parentNode?.getAttribute('data-order')
                
            //     if (currentOrderId !== orderId) {
            //         setCurrentOrderId(orderId)
            //     }
                
                
            //     console.log('data', data)
                
            //     console.log('tokenized', tokenize(data)[0])
            // }

        })
        observer.observe(myRef.current, {
            characterData: true,
            subtree: true,
            // childList: true,
        })
    }, [myRef])
    return (
        <div
            ref={myRef}
            contentEditable={true}
            suppressContentEditableWarning={true} 
            className={className + ' script-editor'}
            onBlur={clearCurrrentNode}
            onMouseDown={setCurrentNode}
            onKeyUp={handleKeyUp}
            onPaste={function(e) {
                // console.log('Text', e.clipboardData.getData('Text'));
                // console.log('text/plain', e.clipboardData.getData('text/plain'));
                // console.log('text/html', e.clipboardData.getData('text/html'));
                // console.log('text/rtf', e.clipboardData.getData('text/rtf'));
            
                // console.log('Url', e.clipboardData.getData('Url'));
                // console.log('text/uri-list', e.clipboardData.getData('text/uri-list'));
                // console.log('text/x-moz-url', e.clipboardData.getData('text/x-moz-url'));
            }}
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
                <div>currentOrderId: {currentOrderId}</div>
                <div>secondaryOrderId: {secondaryOrderId}</div>
            <TokenContent tokens={tokens} />
        </div>
    )
}