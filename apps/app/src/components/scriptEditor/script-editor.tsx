import './script-editor.css';

import { TokenContent, Tokens, tokenize } from './script-tokens'
import { useRef, useEffect, useState, useCallback } from 'react';
import { useFountainNodes } from './useFountainNodes'


interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
    audioVersionNumber: string;
}

function VirtualizedList({ items, itemHeight, containerHeight }) {
    const [scrollTop, setScrollTop] = useState(0);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length
    );
    const visibleItems = items.slice(startIndex, endIndex);
    const invisibleItemsHeight = (startIndex + visibleItems.length - endIndex) * itemHeight;
    const handleScroll = (event) => {
      setScrollTop(event.target.scrollTop);
    };
    return (
      <div
        style={{ height: `${containerHeight}px`, overflowY: "scroll" }}
        onScroll={handleScroll}
        className="VirtualizedList"
      >
        <div style={{ height: `${items.length * itemHeight}px` }}>
          <div
            style={{
              position: "relative",
              height: `${visibleItems.length * itemHeight}px`,
              top: `${startIndex * itemHeight}px`,
            }}
          >
            {visibleItems.map((item) => (
              <div key={item.id} style={{ height: `${itemHeight}px` }}>
              {/* <div key={item.id}> */}
                {item.text}
              </div>
            ))}
          </div>
          {/* <div className="invisible-height" style={{ height: `${invisibleItemsHeight}px` }} /> */}
        </div>
      </div>
    );
  }

export const ScriptEditor =({
    scriptTokens,
    className,
    audioVersionNumber,
    pdfText,
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
    ] = useFountainNodes(scriptTokens, audioVersionNumber, pdfText)

    useEffect(() => {
        myRef.current && myRef.current.focus()
    }, [myRef])

    return (
        <div
            autoFocus
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