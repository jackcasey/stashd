# StashD

## What?
A standalone tool that produces self-decrypting password protected web pages. Also self-replicating, in that any page that has been encrypted by StashD can also be used to encrypt another page. No need to go back to the source as it were. Use it completely offline.

## Why?
StashD is the result of scratching my itch that it should be simple to have self-contained, password protected content up on the internet.

The use case that inspired this tool is having some specific instructions somewhere very easily accessible but not completely open to everyone. Think instructions on how to find and use your physical cryptocurrency wallet but without actually including the pin number or passsphrases.

Alternatively it could be used to make an html file sitting on a desktop that asks for a password when you open it.

To be honest I'm not 100% sure what this thing is useful for and under what exact circumstances it would be prefereable compared to a physical document or password protected zip file etc, but it seemed worth existing.

So I built the darn thing. Many sporadicly spaced hours later; I present StashD. It is hosted and ready for use at https://stashd.github.com (is it?)

## How does it work?

Well it takes markdown and shows a preview realtime using marked. Then when you're ready you give it a password and a short message to include on the unencrypted 'face' of the page. The markdown is saved and encrypted with the password and salt using the[SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) web standard encryption library.

Then that encrypted text is put into a hidden dom element and the plaintext and preview are scrubbed from the dom.

Then the page is transformed (by hiding and shohwing DOM elements) to show the plaintest message and decryption instructions.

This state of the page is meant to be saved to disk and/or hosted.

Entering a password will decrypt the contents of the hidden div, and run them through marked to make HTML from the markdown and show the original content.

All steps can be performed offline for better security from keyloggers etc, as your password and plaintext will be floating around a machine's memory so is suseptible to viruses or other attack vectors.

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
  * Only build step is inlining everything
  * No minification or obsfucation
  * Few dependencies
    * skeleton.css
    * marked.js
  * Very basic JS, ugly but easy to understand

* Self contained
  * Encryption and Decryption all done by one html file
  * Saved encrypted file actually contains all the code;
    * So you can start a new document straight from an old one

## Required libraries and thanks

https://github.com/remy/inliner
https://github.com/markedjs/marked
https://github.com/dhg/Skeleton
