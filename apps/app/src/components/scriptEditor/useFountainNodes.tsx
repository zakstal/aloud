import { Tokens, tokenize } from './script-tokens'
import { useEffect, useState, useMemo } from 'react';
import { ScriptHistory } from './script-history'
import * as db from './storage'


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
 * - on removal of "character" type, update following "dialog" type to be just an action
 * - choose a name, focusId, orderId etc
 * 
 * UPDATES
 * - saveing state in the browser. Indexd db?
 * - add caret position and order id to the script hitory db object so that on undo we can represent exaclty where the user was
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


window.scriptStorage = window.scriptStorage || new ScriptHistory()

export function useFountainNodes(tokensIn = [], ref) {

    const [tokens, setTokens] = useState(prepareTokensRender(tokensIn))
    const tokensChanged = useMemo(() => tokens, [tokens])
    const [nextCaretPosition, setNextCaretPosition] = useState([])
    const [currentOrderId, setCurrentOrderId] = useState(null)
    const [secondaryOrderId, setSecondaryOrderId] = useState(null) // for ranges
    const [rangeOffsets, setRangeOffsets] = useState(null) // for ranges
    const [slections, setSelections] = useState(null)

    useEffect(() => {

        // NB ScriptHistory has an internal representation of tokens. not sure if we should keep 
        // to sets, hoever we can change the internal as we like and only update it later if needed
        window.scriptStorage.setCallbackValues(
            '1', // script version
            db,
            (tokens: Tokens[], caretPosition: number | null, currentOrderId: number | null) => { // call back that runs on "commit"
                setTokens(tokens)
                caretPosition && setNextCaretPosition(caretPosition)
                currentOrderId && setCurrentOrderId(currentOrderId)
            },
            tokens,
        )

    }, [])
    useEffect(() => {
        if (!currentOrderId) return

        const element = document.querySelector(`[data-order="${Number(currentOrderId)}"]`)
        if (!element && nextCaretPosition) return

        const range = document.createRange();
        const sel = window.getSelection();

        // this should handle tags that are empty but we still want the cursor
        const el = element?.childNodes[0] ? element?.childNodes[0] : element
        range.collapse(true);
        const textLength = element?.childNodes[0] ? element?.childNodes[0].length : element?.innerText?.length

        const caret = textLength < nextCaretPosition ? textLength : nextCaretPosition
        console.log('el', textLength, caret, nextCaretPosition)
        try {
            if (el) {
                range.setStart(el, caret);
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
        async function handleKeyDown(e) {
            const selection = window.getSelection();
            const currentElement = getElementAtCaret()
            const orderId = currentElement?.dataset?.order

            if (e.key === 'Tab' && orderId) {
                e.preventDefault()

                window.scriptStorage.modify({
                    type: 'character',
                }, orderId, selection?.anchorOffset)

                console.log("HANDLE KEY DOWN 1")
                window.scriptStorage.commit()
                setCurrentOrderId(orderId)
                setNextCaretPosition(selection?.anchorOffset)
                return
            }

            const isCtrlUndo = e.ctrlKey && e.key === 'z' 
            const isMetalUndo = e.metaKey && e.key === 'z' 
            const isShift = e.shiftKey

            if (isCtrlUndo || isMetalUndo ) {
                if (isShift) {
                    await window.scriptStorage.redo()
                    return
                }
                await window.scriptStorage.undo()
                return
            }
   
            if (!rangeOffsets) return
            if (e.shiftKey) return
            if (noUpdateKeySet.has(e.key)) return
            e.preventDefault()

            // hande range and key press
            const [currentOffset, secondOffset] = rangeOffsets || []
            const [carotPostiion, focusId] = window.scriptStorage.combineRange(Number(currentOrderId), Number(secondaryOrderId), currentOffset, secondOffset)

            setNextCaretPosition(selection?.anchorOffset)
            window.scriptStorage.commit()
  
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
                    window.scriptStorage.modify({
                        type: foundTokens[0].type
                    }, orderId, selection?.anchorOffset)
                }

                // TODO this shoudl 
                const newText = transformText(currentElement.innerText, tokens[orderId].type)

                window.scriptStorage.modify({
                    text: newText
                }, orderId, selection?.anchorOffset)
                
                console.log("HANDLE KEY UP")
                if (didUpdate) {
                    window.scriptStorage.commit()
                    setNextCaretPosition(selection?.anchorOffset)
                }
            }
        },
        function handleOnEnter(e) {
            e.preventDefault()
            try {
                const selection = window.getSelection();

                let carotPostiion = 0
                let focusId = currentOrderId

                window.scriptStorage.combineSplitRange(focusId, carotPostiion || selection?.anchorOffset)
                console.log("HANDLE ENTER combineSplitRange")
                window.scriptStorage.commit()

                setCurrentOrderId(Number(currentOrderId) + 1)
                setNextCaretPosition(0)
                setSecondaryOrderId(null)
                setRangeOffsets(null)


            } catch (e) {
                console.log('error', e)
            }
        },
        function handleOnBackSpace(e) {
            const selection = window.getSelection();
            
            if (selection.anchorOffset !== 0 && !rangeOffsets) return
            e.preventDefault()

            const [currentOffset, secondOffset] = rangeOffsets || []
            const [carotPostiion, focusId] = window.scriptStorage.combineRange(Number(currentOrderId), Number(secondaryOrderId), currentOffset, secondOffset)
            console.log("HANDLE BACKSPACE")
            window.scriptStorage.commit()

            setCurrentOrderId(focusId)
            setNextCaretPosition(carotPostiion)
            setSecondaryOrderId(null)
            setRangeOffsets(null)
            // setTokens(newTokens)
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