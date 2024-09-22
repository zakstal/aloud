import { TokenContent, Tokens, tokenize } from './script-tokens'
import { useEffect, useState, useMemo } from 'react';

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

// const reductions = {
//     [types.create]: (tokens, action) => {
//         const currentOrderId = action.currentOrderId
//         const selection = window.getSelection();
//         const currentToken = tokens[Number(currentOrderId)]
//         let text = ''
//         const currentText = currentToken.text
//         const textLength = currentText.length
//         if (textLength > selection.anchorOffset && selection.anchorOffset !== 0) {
//             text = currentText.slice(selection.anchorOffset, textLength - 1)
//             currentToken.text = currentText.slice(0, selection.anchorOffset)
//         }
        
//         // Set new element above (0), or below (1) current element
//         const offset = textLength && selection.anchorOffset === 0 ? 0 : 1
//         const newTokens = tokens.toSpliced(Number(currentOrderId) + offset, 0, {
//             text,
//             type: 'editNode',
//             id: getId()
//         })

//         console.log('offset', offset)

//         setCurrentOrderId(Number(currentOrderId) + offset)
//         setNextCaretPosition(0)
//         setTokens(newTokens)
//         action.done()
//         return newTokens

//     },
//     [types.remove]: (state, action) => {

//     },
// }

// function reducer(state, action) {
//   const func = reductions(action.type)
//   if (!func) return state
//   return func(state, action)
// }

function combineText(text1 = '', text2 = '', offset1, offset2) {
    return text1.slice(0, offset1 || text1.length) + text2.slice(offset2 || 0, text2.length)
}

function combineRange(tokens, currentOrderIdIn, nextIdIn, currentOffsetIn, nextOffsetIn) {
    let currentOrderId = currentOrderIdIn
    let nextId = nextIdIn || currentOrderIdIn - 1
    let currentOffset = currentOffsetIn
    let nextOffset = nextOffsetIn

    console.log('nextId', nextId)
    console.log('currentOrderId', currentOrderId)

    if (currentOrderId > nextId) {
        const currentTemp = currentOrderId
        currentOrderId = nextId
        nextId = currentTemp

        const currentOffsetTemp = currentOffset
        currentOffset = nextOffset
        nextOffset = currentOffsetTemp
    }

    console.log('combineRange:------------')
    console.log('currentOrderId', currentOrderId)
    console.log('nextId', nextId)
    console.log('currentOffset', currentOffset)
    console.log('nextOffset', nextOffset)
    // console.log('secondaryOrderId', secondaryOrderId)
    console.log('tokens[currentOrderId]', tokens[currentOrderId])
    console.log('tokens[nextId]', tokens[nextId])

    const nextText = tokens[nextId].text || ''
    const carotPostiion = tokens[currentOrderId].text?.length || 0 
    const currentText = tokens[currentOrderId].text

    // tokens[currentOrderId].text = (tokens[currentOrderId].text || '') + nextText
    tokens[currentOrderId].text = combineText(currentText, nextText, currentOffset, nextOffset)

    console.log("carotPostiion", carotPostiion)
    console.log('tokens--', tokens.slice(0, 10))
    const startRemoveIndex = currentOrderId + 1 // after the current to the and including next
    const forHowManyItems = nextId - currentOrderId
    const newTokens = tokens.toSpliced(startRemoveIndex, forHowManyItems)
    // const newTokens = tokens.toSpliced(currentOrderId, Math.abs(currentOrderId - (nextId || 1)))
    console.log('newTokens--', newTokens.slice(0, 10))

    
    return [newTokens, currentOffset || carotPostiion, currentOrderId]
}

function splitRange(tokens, currentOrderId, anchorOffset) {

    const currentToken = tokens[Number(currentOrderId)]
    let text = ''
    const currentText = currentToken?.text || ''
    const textLength = currentText?.length || 0
    
    if (textLength > anchorOffset && anchorOffset !== 0) {
        text = currentText.slice(anchorOffset , textLength)
        currentToken.text = currentText.slice(0, anchorOffset)
    }
    
    // Set new element above (0), or below (1) current element
    const cursorIsAtEndOfText = textLength && anchorOffset === 0
    const noText = !textLength && anchorOffset === 0
    // const offset = cursorIsAtEndOfText || noText ? 0 : 1
    const offset = anchorOffset === 0 ? 0 : 1
    // const offset = cursorIsAtEndOfText ? 0 : 1
    console.log('curr')
    const newTokens = tokens.toSpliced(Number(currentOrderId) + offset, 0, {
        text,
        type: 'editNode',
        id: getId()
    })

    console.log("newTokens", newTokens.slice(0, 10))

    return newTokens
}


export function useFountainNodes(tokensIn = [], ref) {

    // const [state, dispatch] = useReducer(reducer, tokens);
    const [tokens, setTokens] = useState(tokensIn)
    const tokensChanged = useMemo(() => tokens, [tokens])
    const [nextCaretPosition, setNextCaretPosition] = useState([])
    const [currentOrderId, setCurrentOrderId] = useState(null)
    const [secondaryOrderId, setSecondaryOrderId] = useState(null) // for ranges
    const [rangeOffsets, setRangeOffsets] = useState(null) // for ranges
    const [slections, setSelections] = useState(null)

    // set cursor position after render
    useEffect(() => {
        // const handleSelectionChange = (e) => {
        //     const selection = window.getSelection();
        //     const element = ref.current;
        //     console.log('e',getElementAtCaret(), selection)

        //     setSelections(selection)

        //     if (selection.containsNode(element, true)) {
        //       console.log('Text is being selected inside the element');
        //     }
        //   };
      
        //   document.addEventListener('selectionchange', handleSelectionChange);
      
        //   return () => {
        //     document.removeEventListener('selectionchange', handleSelectionChange);
        //   };
    }, [])

    useEffect(() => {
        if (!currentOrderId) return

        const element = document.querySelector(`[data-order="${Number(currentOrderId)}"]`)
        if (!element && nextCaretPosition) return

        console.log('Set range:--')
        const range = document.createRange();
        const sel = window.getSelection();

        console.log('nextCaretPosition', nextCaretPosition)
        console.log('currentOrderId', currentOrderId)
        console.log('element', element)

        // this should handle tags that are empty but we still want the cursor
        const el = element?.childNodes[0] ? element?.childNodes[0] : element
        range.collapse(true);
        if (el) {
            range.setStart(el, nextCaretPosition);
        }
        
        sel.removeAllRanges();
        sel.addRange(range);

        setNextCaretPosition(null)

    }, [tokensChanged])

    console.log("rangeOffsets", rangeOffsets)
    return [
        tokens,
        function handleKeyDown(e) {


            if (!rangeOffsets) return
            if (e.shiftKey) return

            const [currentOffset, secondOffset] = rangeOffsets || []
            const [newTokens, carotPostiion, focusId] = combineRange(tokens, Number(currentOrderId), Number(secondaryOrderId), currentOffset, secondOffset)

            console.log("carotPostiion handleKeyDown", carotPostiion)
            setCurrentOrderId(focusId)
            setNextCaretPosition(carotPostiion)
            setSecondaryOrderId(null)
            setRangeOffsets(null)
            setTokens(newTokens)
        },
        function handleKeyUp(e) {
            const currentElement = getElementAtCaret()
            const orderId = currentElement?.dataset?.order

            // console.log('handleKeyUp', orderId,  orderId)
            if (orderId) {
                setCurrentOrderId(orderId)
                setSecondaryOrderId(null)
            }

            
            if (!e.shiftKey && orderId) {
                // console.log('currentElement.innerText', currentElement.innerText)
                tokens[orderId].text = currentElement.innerText
            }
        },
        function handleOnEnter(e) {
            console.log('handle enter--------------')
            e.preventDefault()
            try {
                const selection = window.getSelection();

                let newTokens = tokens
                let carotPostiion = 0
                let focusId = currentOrderId

                if (rangeOffsets) {
                    const [currentOffset, secondOffset] = rangeOffsets || []
                    const res = combineRange(tokens, Number(currentOrderId), Number(secondaryOrderId), currentOffset, secondOffset)

                    newTokens = res[0]
                    carotPostiion = res[1]
                    focusId = res[2]
                }

                newTokens = splitRange(newTokens, focusId, carotPostiion || selection?.anchorOffset)

                setCurrentOrderId(Number(currentOrderId) + 1)
                setNextCaretPosition(0)
                setSecondaryOrderId(null)
                setRangeOffsets(null)
                setTokens(newTokens)

            } catch (e) {
                console.log('error', e)
            }
        },
        function handleOnBackSpace(e) {
            const selection = window.getSelection();
            
            if (selection.anchorOffset !== 0 && !rangeOffsets) return
            e.preventDefault()

            console.log('handle backspace:--------------------')

            const [currentOffset, secondOffset] = rangeOffsets || []
            const [newTokens, carotPostiion, focusId] = combineRange(tokens, Number(currentOrderId), Number(secondaryOrderId), currentOffset, secondOffset)

            setCurrentOrderId(focusId)
            setNextCaretPosition(carotPostiion)
            setSecondaryOrderId(null)
            setRangeOffsets(null)
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
        },
        function handleOnSelect(e) {
            const selection = window.getSelection();

            // selection.anchorNode // start node
            // selection.anchorOffset // start node cursor start
            // selection.extentNode // end node offset
            // selection.extentOffset // end node offset

            const acnchorNode = selection.anchorNode?.parentNode
            const extentNode = selection.extentNode?.parentNode

            const acnchorNodeOrder = acnchorNode?.dataset?.order
            const extentNodeOrder = extentNode?.dataset?.order

            if (acnchorNodeOrder != extentNodeOrder && acnchorNodeOrder != null &&  extentNodeOrder != null) {
                setCurrentOrderId(acnchorNodeOrder)
                setSecondaryOrderId(extentNodeOrder)

                setRangeOffsets([selection.anchorOffset, selection.extentOffset])
            }
        },
        currentOrderId,
        secondaryOrderId
    ]
}