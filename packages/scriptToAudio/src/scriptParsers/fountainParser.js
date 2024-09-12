import { Fountain } from 'fountain-js';



const text = `INT. COFFEE SHOP - DAY
A bustling coffee shop filled with the aroma of freshly brewed coffee and the chatter of patrons. SARAH, a 30-year-old writer with messy hair and ink-stained fingers, sits at a corner table, furiously typing on her laptop.

JOHN, a handsome barista in his mid-20s, approaches with a steaming mug.

JOHN
Your usual, Sarah. Extra shot, no foam.

Sarah looks up, startled.

SARAH
Oh, thanks John. You're a lifesaver.

JOHN
(smiling)
No problem. How's the new novel coming along?

SARAH
(sighing)
Slowly. Very slowly. I think my characters are plotting against me.

JOHN
(laughs)
Well, if they stage a revolt, I've got your back. And plenty of caffeine.

Sarah grins and takes a sip of her coffee.

SARAH
You're officially my favorite person right now.

John winks and walks away. Sarah turns back to her laptop, a small smile playing on her lips as she begins to type again.

FADE OUT.
`;
        

/**
 output {
  title: '',
  html: {
    title_page: '',
    script: `<div class="dialogue"><h4>INT. COFFEE SHOP - DAY</h4><p>A bustling coffee shop filled with the aroma of freshly brewed coffee and the chatter of patrons. SARAH, a 30-year-old writer with messy hair and ink-stained fingers, sits at a corner table, furiously typing on her laptop.</p></div><p>JOHN, a handsome barista in his mid-20s, approaches with a steaming mug.</p><div class="dialogue"><h4>JOHN</h4><p>Your usual, Sarah. Extra shot, no foam.<br />Sarah looks up, startled.</p></div><div class="dialogue"><h4>SARAH</h4><p>Oh, thanks John. You're a lifesaver.</p></div><div class="dialogue"><h4>JOHN</h4><p class="parenthetical">(smiling)</p><p>No problem. How's the new novel coming along?</p></div><div class="dialogue"><h4>SARAH</h4><p class="parenthetical">(sighing)</p><p>Slowly. Very slowly. I think my characters are plotting against me.</p></div><div class="dialogue"><h4>JOHN</h4><p class="parenthetical">(laughs)</p><p>Well, if they stage a revolt, I've got your back. And plenty of caffeine.</p></div><p>Sarah grins and takes a sip of her coffee.</p><div class="dialogue"><h4>SARAH</h4><p>You're officially my favorite person right now.<br />John winks and walks away. Sarah turns back to her laptop, a small smile playing on her lips as she begins to type again.</p></div><p>FADE OUT.<br />This screenplay snippet demonstrates some key elements of Fountain format:<br />Scene headings are in all caps and start with INT. or EXT.<br />Character names are in all caps before their dialogue.<br />Parentheticals for actions or tone are in parentheses on their own line.<br />Action lines are written in plain text.<br />Transitions like FADE OUT are in all caps.<br />Fountain allows screenwriters to focus on writing without worrying about formatting, as the plain text can be easily converted to properly formatted screenplays late</p>`
  },
  tokens: [
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'INT. COFFEE SHOP - DAY' },
  DialogueToken {
    type: 'dialogue',
    text: 'A bustling coffee shop filled with the aroma of freshly brewed coffee and the chatter of patrons. SARAH, a 30-year-old writer with messy hair and ink-stained fingers, sits at a corner table, furiously typing on her laptop.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken {
    type: 'action',
    text: 'JOHN, a handsome barista in his mid-20s, approaches with a steaming mug.'
  },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'JOHN' },
  DialogueToken {
    type: 'dialogue',
    text: 'Your usual, Sarah. Extra shot, no foam.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken { type: 'action', text: 'Sarah looks up, startled.' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'SARAH' },
  DialogueToken {
    type: 'dialogue',
    text: "Oh, thanks John. You're a lifesaver."
  },
  DialogueEndToken { type: 'dialogue_end' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'JOHN' },
  ParentheticalToken { type: 'parenthetical', text: '(smiling)' },
  DialogueToken {
    type: 'dialogue',
    text: "No problem. How's the new novel coming along?"
  },
  DialogueEndToken { type: 'dialogue_end' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'SARAH' },
  ParentheticalToken { type: 'parenthetical', text: '(sighing)' },
  DialogueToken {
    type: 'dialogue',
    text: 'Slowly. Very slowly. I think my characters are plotting against me.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'JOHN' },
  ParentheticalToken { type: 'parenthetical', text: '(laughs)' },
  DialogueToken {
    type: 'dialogue',
    text: "Well, if they stage a revolt, I've got your back. And plenty of caffeine."
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken {
    type: 'action',
    text: 'Sarah grins and takes a sip of her coffee.'
  },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'SARAH' },
  DialogueToken {
    type: 'dialogue',
    text: "You're officially my favorite person right now.\n" +
      'John winks and walks away. Sarah turns back to her laptop, a small smile playing on her lips as she begins to type again.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken {
    type: 'action',
    text: 'FADE OUT.\n' +
      'This screenplay snippet demonstrates some key elements of Fountain format:\n' +
      'Scene headings are in all caps and start with INT. or EXT.\n' +
      'Character names are in all caps before their dialogue.\n' +
      'Parentheticals for actions or tone are in parentheses on their own line.\n' +
      'Action lines are written in plain text.\n' +
      'Transitions like FADE OUT are in all caps.\n' +
      'Fountain allows screenwriters to focus on writing without worrying about formatting, as the plain text can be easily converted to properly formatted screenplays late'
  }
]
}
 */

function is(input, text) {
    return input === text
}

function getDialog (output) {
    let isDialog = false
    const toProcess = []
    let character = null
    for (const token of output.tokens) {
        const tokenType = token.type

        if (is(tokenType, 'dialogue_begin')) {
            isDialog = true
        }
        if (is(tokenType, 'dialogue_end')) {
            isDialog = false
            character = null
        }

        if (isDialog && is(tokenType, 'character')) {
            character = token.text
        }
      
        if (isDialog && character && is(tokenType, 'dialogue')) {
            const characterName = character.split(" ")[0]
            toProcess.push({
                characterName,
                // character: characters[characterName],
                text: token.text
            })
        }

        if (is(tokenType, 'action')) {
          toProcess.push({
            characterName: 'Narrator',
            // character: characters[characterName],
            text: token.text
        })
        }
    }

    return toProcess
}

export function parse(scriptText) {
    let fountain = new Fountain();
    let output = fountain.parse(scriptText, true);
    const dialog = getDialog(output)    

    return {
        dialog,
        output,
    }
}