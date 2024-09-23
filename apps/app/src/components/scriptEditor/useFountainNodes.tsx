import { TokenContent, Tokens, tokenize } from './script-tokens'
import { useEffect, useState, useMemo } from 'react';


/**
 * 
 * TODO/issues
 * - full line range and backspace dosen't work
 * - hlding backspace fore several lines puts the caret in the wrong spot on key up
 * - range selected and key press puts the caret in the wrong spot
 * - rang over lines with no text dosen't show a highlight. its confusing
 * - handle dual dialog in script-tokens
 * - handle cut, copy, paste over range
 * - handle enter and backspace causes a lot of updates from setting state. Merge for singluar updates.
 * - can this handle lots of data
 * 
 * UPDATES
 * - saveing state in the browser. Indexd db?
 * 
 * Possible performance updates
 * - preact signals?
 * - windowing
 */

const noUpdateKyes = [
    'Tab',
    'CapsLock',
    'Shift',
    'Control',
    'Alt',
    'Meta',
    'ArrowLeft',
    'ArrowDown',
    'ArrowRight',
    'ArrowUp',
    'Escape',
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'F7',
    'F8',
]

const removeTokens = ['dialogue_end', 'dialogue_begin']
const capitalizeTypes = ['character', 'scene_heading', 'transition']

const transformText = (text: string, type: string) => {
    console.log("capitalizeTypes.includes(type)", capitalizeTypes.includes(type))
    if (capitalizeTypes.includes(type)) return text.toUpperCase()
    return text
}

const prepareTokensRender = (tokens: Tokens[]) => {
    return tokens.filter((token: Tokens) => !removeTokens.includes(token.type))
}

const prepareTokensSave = (tokens: Tokens[]) => {
    // dialogue_end
    // dialogue_begin
}

const noUpdateKeySet = new Set(noUpdateKyes)

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

function combineText(text1 = '', text2 = '', offset1, offset2) {
    return text1.slice(0, offset1 || text1.length) + text2.slice(offset2 || 0, text2.length)
}

function combineRange(tokens, currentOrderIdIn, nextIdIn, currentOffsetIn, nextOffsetIn) {
    let currentOrderId = currentOrderIdIn
    let nextId = nextIdIn || currentOrderIdIn - 1
    let currentOffset = currentOffsetIn
    let nextOffset = nextOffsetIn

    // make sure currentOrderId is less than nextOrderId 
    if (currentOrderId > nextId) {
        const currentTemp = currentOrderId
        currentOrderId = nextId
        nextId = currentTemp

        const currentOffsetTemp = currentOffset
        currentOffset = nextOffset
        nextOffset = currentOffsetTemp
    }

    const nextText = tokens[nextId].text || ''
    const carotPostiion = tokens[currentOrderId].text?.length || 0 
    const currentText = tokens[currentOrderId].text

    tokens[currentOrderId].text = combineText(currentText, nextText, currentOffset, nextOffset)

    const startRemoveIndex = currentOrderId + 1 // after the current to the and including next
    const forHowManyItems = nextId - currentOrderId
    const newTokens = tokens.toSpliced(startRemoveIndex, forHowManyItems)
    
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
    
    const offset = anchorOffset === 0 ? 0 : 1

    const newTokens = tokens.toSpliced(Number(currentOrderId) + offset, 0, {
        text,
        type: 'editNode',
        id: getId()
    })

    return newTokens
}


export function useFountainNodes(tokensIn = [], ref) {
    const [tokens, setTokens] = useState(prepareTokensRender(tokensIn))
    const tokensChanged = useMemo(() => tokens, [tokens])
    const [nextCaretPosition, setNextCaretPosition] = useState([])
    const [currentOrderId, setCurrentOrderId] = useState(null)
    const [secondaryOrderId, setSecondaryOrderId] = useState(null) // for ranges
    const [rangeOffsets, setRangeOffsets] = useState(null) // for ranges
    const [slections, setSelections] = useState(null)

    useEffect(() => {
        if (!currentOrderId) return

        const element = document.querySelector(`[data-order="${Number(currentOrderId)}"]`)
        if (!element && nextCaretPosition) return

        const range = document.createRange();
        const sel = window.getSelection();

        // this should handle tags that are empty but we still want the cursor
        const el = element?.childNodes[0] ? element?.childNodes[0] : element
        range.collapse(true);
        try {
            if (el) {
                range.setStart(el, nextCaretPosition);
            }
        } catch(e) {
            console.error(e)
        }
            
        sel.removeAllRanges();
        sel.addRange(range);

        setNextCaretPosition(null)

    }, [tokensChanged])

    return [
        tokens,
        function handleKeyDown(e) {
            const selection = window.getSelection();
            const currentElement = getElementAtCaret()
            const orderId = currentElement?.dataset?.order

   
            if (!rangeOffsets) return
            if (e.shiftKey) return
            if (noUpdateKeySet.has(e.key)) return

            const [currentOffset, secondOffset] = rangeOffsets || []
            const [newTokens, carotPostiion, focusId] = combineRange(tokens, Number(currentOrderId), Number(secondaryOrderId), currentOffset, secondOffset)

            // TODO each of these causes an update. maybe merge into one update via redux?
            setTokens(newTokens)
            setCurrentOrderId(focusId)
            setNextCaretPosition(carotPostiion)
            setSecondaryOrderId(null)
            setRangeOffsets(null)
        },
        function handleKeyUp(e) {
            const selection = window.getSelection();
            const currentElement = getElementAtCaret()
            const orderId = currentElement?.dataset?.order

            // setting the current orderid works best in keyUp rather than key down for some reason
            if (orderId) {
                setCurrentOrderId(orderId)
                setSecondaryOrderId(null)
            }

            
            let didUpdate = false
            if (noUpdateKeySet.has(e.key)) return
            if (e.keyCode === 32) return // space bar. having a space sometimes doesn't register in the inner text and setting the caret can fail
            if (orderId) {
                const lastToken = tokens[orderId - 1]
                const token = tokens[orderId]

                const isLastCharacter = lastToken?.type === 'character'

                const foundTokens = tokenize(currentElement.innerText, { isLastCharacter })

                // TODO update to handle multiple tokens
                if (foundTokens.length === 1 && token.type !== foundTokens[0].type) {
                    didUpdate = true
                    tokens[orderId].type = foundTokens[0].type
                }

                // TODO this shoudl 
                tokens[orderId].text = transformText(currentElement.innerText, tokens[orderId].type)

                if (didUpdate) {
                    setNextCaretPosition(selection?.anchorOffset)
                    setTokens([...tokens])
                }
            }
        },
        function handleOnEnter(e) {
            e.preventDefault()
            try {
                const selection = window.getSelection();

                let newTokens = tokens
                let carotPostiion = 0
                let focusId = currentOrderId

                // if a range has been selected handle removing it.
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