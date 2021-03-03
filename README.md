# StashD

## What?

StashD produces standalone, encrypted, self-decrypting, password protected, web pages. Also self-replicating, in that any page that has been encrypted by StashD is also all of StashD and can be used to encrypt another page. No need to go back to the source as it were. Use it completely offline.

## Why?

StashD is the result of scratching my itch that it should be simple to have self-contained, password protected content up on the internet.

The use case that inspired this tool is having easily accessible but secret instructions. Think instructions on how to find and use your physical cryptocurrency wallet but without actually including the pin number or passphrases.

Alternatively it could be used to make an html file sitting on a desktop that asks for a password when you open it.

To be honest I'm not 100% sure what this thing is useful for and under what exact circumstances it would be preferable compared to a physical document or password protected zip file etc, but it seemed worth existing.

So I built the darn thing. Many sporadically spaced hours later; I present StashD. It is hosted and ready for use at https://jackcasey.github.io/stashd/.

## How does it work?

Type markdown and view a real-time preview (rendered using [markedjs](https://github.com/markedjs/marked)).

Enter a password and a short message to include on the unencrypted 'face' of the page.

The markdown is saved and encrypted with the password and salt using the[SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) web standard encryption library.

The encrypted text is put into a hidden DOM element and the sensitive original text and preview are scrubbed from the DOM.

A prompt to download the file is shown.

The encrypted page shows the user-entered message and a password prompt to decrypt.

Entering a password will decrypt the contents of the hidden encrypted text, and run them through marked to make HTML from the markdown and then show the original content cleanly.

## Implementation

Some general rules I used to keep it tight and auditable:

* Simple to use
  * Basic styling
  * Step by step usage
  * Succinct instructions
  * Markdown for formatting

* Simple to audit or contribute
  * One static html file
  * No transcoding or build pipeline
  * Only build step is in-lining everything
  * No minification or obfuscation
  * Few dependencies
    * skeleton.css
    * marked.js
  * Very basic JS, ugly but easy to understand

* Self contained
  * Encryption and Decryption all done by one html file
  * Saved encrypted file actually contains all the code;
    * So you can start a new document straight from an old one

## Required libraries and thanks

* https://github.com/remy/inliner
* https://github.com/markedjs/marked
* https://github.com/dhg/Skeleton
