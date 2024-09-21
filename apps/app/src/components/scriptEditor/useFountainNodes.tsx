import { TokenContent, Tokens, tokenize } from './script-tokens'
import { useRef, useEffect, useState, useReducer } from 'react';

const types = {
    create: 'CREATE',
    remove: 'REMOVE',
}

const getId = () => (Math.random() + 1).toString(36).substring(7);

function getElementAtCaret() {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const caretNode = range.commonAncestorContainer;
  
      // If the caretNode is a text node, get its parent element
      return caretNode.nodeType === Node.TEXT_NODE ? caretNode.parentElement : caretNode;
    }
    
    return null;
  }

const reductions = {
    [types.create]: (tokens, action) => {
        const currentOrderId = action.currentOrderId
        const selection = window.getSelection();
        const currentToken = tokens[Number(currentOrderId)]
        let text = ''
        const currentText = currentToken.text
        const textLength = currentText.length
        if (textLength > selection.anchorOffset && selection.anchorOffset !== 0) {
            text = currentText.slice(selection.anchorOffset, textLength - 1)
            currentToken.text = currentText.slice(0, selection.anchorOffset)
        }
        
        // Set new element above (0), or below (1) current element
        const offset = textLength && selection.anchorOffset === 0 ? 0 : 1
        const newTokens = tokens.toSpliced(Number(currentOrderId) + offset, 0, {
            text,
            type: 'editNode',
            id: getId()
        })

        console.log('offset', offset)

        setCurrentOrderId(Number(currentOrderId) + offset)
        setNextCaretPosition(0)
        setTokens(newTokens)
        action.done()
        return newTokens

    },
    [types.remove]: (state, action) => {

    },
}

function reducer(state, action) {
  const func = reductions(action.type)
  if (!func) return state
  return func(state, action)
}

export function useFountainNodes(tokensIn = []) {

    // const [state, dispatch] = useReducer(reducer, tokens);
    const [tokens, setTokens] = useState(tokensIn)
    const [nextCaretPosition, setNextCaretPosition] = useState([])
    const [currentOrderId, setCurrentOrderId] = useState(null)

    // set cursor position after render
    useEffect(() => {
        if (!currentOrderId) return

        const element = document.querySelector(`[data-order="${Number(currentOrderId)}"]`)
        if (!element && nextCaretPosition) return

        const range = document.createRange();
        const sel = window.getSelection();

        console.log('nextCaretPosition', nextCaretPosition)
        console.log('currentOrderId', currentOrderId)
        console.log('element', element)

        // this should handle tags that are empty but we still want the cursor
        const el = element?.childNodes[0] ? element?.childNodes[0] : element
        range.collapse(true);
        range.setStart(el, nextCaretPosition);
        
        sel.removeAllRanges();
        sel.addRange(range);

        setNextCaretPosition(null)

    }, [tokens])

    return [
        tokens,
        function handleKeyDown(e) {
            const currentElement = getElementAtCaret()
            const orderId = currentElement?.dataset?.order
            console.log('e.target',orderId,  getElementAtCaret())
            if (orderId) {
                setCurrentOrderId(orderId)
            }

            // console.log(' e.target.innerText',  currentElement.innerText)

            // tokens[orderId || currentOrderId].text = currentElement.innerText

        },
        function handleKeyUp(e) {
            const currentElement = getElementAtCaret()
            const orderId = currentElement?.dataset?.order

            console.log(' e.target.innerText',  currentElement.innerText)
            if (orderId) {
                setCurrentOrderId(orderId)
            }
   
            tokens[orderId || currentOrderId].text = currentElement.innerText
        },
        function handleOnEnter(e) {
            console.log('handle enter--------------')
            e.preventDefault()
            try {
                const currentElement = getElementAtCaret()
                const orderId = currentElement?.dataset?.order
                console.log('e.target',orderId,  getElementAtCaret())
               
                const selection = window.getSelection();
                const currentToken = tokens[Number(orderId)]
                let text = ''
                const currentText = currentToken?.text || ''
                const textLength = currentText?.length || 0
                const anchorOffset = selection.anchorOffset
                console.log('selection--------', selection)
                console.log('currentText--------', currentText)
                console.log('textLength--------', textLength)
                console.log('selection.anchorOffset', selection.anchorOffset)

                if (textLength > anchorOffset && anchorOffset !== 0) {
                    text = currentText.slice(anchorOffset , textLength)
                    currentToken.text = currentText.slice(0, anchorOffset)
                }
                
                // Set new element above (0), or below (1) current element
                const cursorIsAtEndOfText = textLength && selection.anchorOffset === 0
                const noText = !textLength && selection.anchorOffset === 0
                // const offset = cursorIsAtEndOfText || noText ? 0 : 1
                const offset = selection.anchorOffset === 0 ? 0 : 1
                // const offset = cursorIsAtEndOfText ? 0 : 1
                const newTokens = tokens.toSpliced(Number(orderId) + offset, 0, {
                    text,
                    type: 'editNode',
                    id: getId()
                })

                console.log('offset', offset)

                setCurrentOrderId(Number(currentOrderId) + 1)
                setNextCaretPosition(0)
                setTokens(newTokens)
            } catch (e) {
                console.log('error', e)
            }
        },
        function handleOnBackSpace(e) {
            const selection = window.getSelection();
            console.log('selection', selection)
            
            if (selection.anchorOffset !== 0) return
            e.preventDefault()


            
            const text = tokens[currentOrderId].text || ''
            const carotPostiion = tokens[Number(currentOrderId) - 1].text?.length || 0

            tokens[Number(currentOrderId) - 1].text = (tokens[Number(currentOrderId) - 1].text || '') + text
            const newTokens = tokens.toSpliced(Number(currentOrderId), 1)

            setCurrentOrderId(Number(currentOrderId) - 1)
            setNextCaretPosition(carotPostiion)
            setTokens(newTokens)
        },
        function clearCurrrentNode() {
            setCurrentOrderId(null)
            setNextCaretPosition(null)
        },
        function setCurrentNode(e) {
            const orderId = e.target?.dataset?.order
            if (orderId) {
                setCurrentOrderId(orderId)
            }
        }
    ]
}