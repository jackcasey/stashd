// Symmetric AES algorithm with authenticated encryption
// Ref: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encryptionAlgorithm = "AES-GCM";

// Key derivation from passphrase
const hashAlgorithm = "SHA-256";
const iterations = 1000;
const keyLength = 48;

/* global marked */

async function getDerivation(salt, password, iterations, keyLength) {
  const textEncoder = new TextEncoder("utf-8");
  const passwordBuffer = textEncoder.encode(password);
  const importedKey = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"]);

  const saltBuffer = textEncoder.encode(salt);
  const params = {name: "PBKDF2", hash: hashAlgorithm, salt: saltBuffer, iterations: iterations};
  const derivation = await crypto.subtle.deriveBits(params, importedKey, keyLength*8);
  return derivation;
}

async function getKey(derivation) {
  const keylen = 32;
  const derivedKey = derivation.slice(0, keylen);
  const iv = derivation.slice(keylen);
  const importedEncryptionKey = await crypto.subtle.importKey("raw", derivedKey, { name: encryptionAlgorithm }, false, ["encrypt", "decrypt"]);
  return {
    key: importedEncryptionKey,
    iv: iv
  };
}

async function encrypt(text, keyObject) {
  const textEncoder = new TextEncoder("utf-8");
  const textBuffer = textEncoder.encode(text);
  const encryptedText = await crypto.subtle.encrypt({ name: encryptionAlgorithm, iv: keyObject.iv }, keyObject.key, textBuffer);
  return encryptedText;
}

async function decrypt(encryptedText, keyObject) {
  const textDecoder = new TextDecoder("utf-8");
  const decryptedText = await crypto.subtle.decrypt({ name: encryptionAlgorithm, iv: keyObject.iv }, keyObject.key, encryptedText);
  return textDecoder.decode(decryptedText);
}

async function encryptData(text, password, salt) {
  const derivation = await getDerivation(salt, password, iterations, keyLength);
  const keyObject = await getKey(derivation);
  const encryptedObject = await encrypt(JSON.stringify(text), keyObject);
  return encryptedObject;
}

async function decryptData(encryptedObject, password, salt) {
  const derivation = await getDerivation(salt, password, iterations, keyLength);
  const keyObject = await getKey(derivation);
  const decryptedObject = await decrypt(encryptedObject, keyObject);
  return decryptedObject;
}

function getPasswordForEncrypt() {
  return document.querySelector("#encrypt-password").value;
}

function getPasswordForDecrypt() {
  return document.querySelector("#decrypt-password").value;
}

function getPlaintext() {
  return document.querySelector("#plaintext").value;
}

function getEncrypted() {
  return document.querySelector("#encrypted").innerHTML;
}

function setPlaintext(text) {
  document.querySelector("#plaintext").value = text;
}

function setEncrypted(text) {
  document.querySelector("#encrypted").innerHTML = text;
}

function arrayBufferToBase64(buffer) {
  var binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa( binary );
}

function base64ToArrayBuffer(base64) {
  var binary_string =  window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array( len );
  for (var i = 0; i < len; i++)        {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function getSalt() {
  return window.crypto.getRandomValues(new Uint32Array(2)).join("");
}

function showDecryptedPage(decrypted) {
  document.querySelector("#decrypted").innerHTML = marked(decrypted);
  hideAll();
  show("#decrypted");
}

function hide(selector) {
  document.querySelector(selector).style.display = "none";
}

function hideAll() {
  hide("#encrypt-tools");
  hide("#instructions");
  hide("#password-step");
  hide("#decrypted");
  hide("#create-button");
  hide("#download-step");
  document.querySelector("#encrypt-password").value = "";
  document.querySelector("#decrypt-password").value = "";
}

function show(selector) {
  document.querySelector(selector).style.display = "block";
}

function download() {
  const text = document.documentElement.outerHTML;
  const filename = document.querySelector("#filename").value;
  const pom = document.createElement("a");
  pom.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  pom.setAttribute("download", filename);

  if (document.createEvent) {
    var event = document.createEvent("MouseEvents");
    event.initEvent("click", true, true);
    pom.dispatchEvent(event);
  }
  else {
    pom.click();
  }
}

function scrubPlaintext() {
  document.querySelector("#decrypted").innerHTML = "";
  document.querySelector("#plaintext").value = "";
  document.querySelector("#preview").innerHTML = "";
}

function passwordChange() {
  if (getPasswordForEncrypt().length > 1) {
    show("#encrypt-button-2-div");
  }
  else
  {
    hide("#encrypt-button-2-div");
  }
}

function setInstructionsMessage() {
  document.querySelector("#instructions-message").innerHTML = document.querySelector("#encrypt-message").value;
  document.querySelector("#encrypt-message").value = "";
}

async function encryptClick() {
  hideAll();
  passwordChange();
  show("#password-step");
}

async function encrypt2Click() {
  const salt = getSalt();
  var encrypted = await encryptData(getPlaintext(), getPasswordForEncrypt(), salt);
  encrypted = arrayBufferToBase64(encrypted);
  setEncrypted(encrypted + "|" + salt);
  scrubPlaintext();
  setInstructionsMessage();
  hideAll();
  show("#download-step");
}

function downloadClick() {
  // alter the page first, before downloading the content
  finishDownloadClick();
  download();
}

function finishDownloadClick() {
  hideAll();
  show("#instructions");
  show("#create-button");
}

async function decryptClick() {
  var encrypted = getEncrypted();
  const salt = encrypted.split("|")[1];
  encrypted = encrypted.split("|")[0];
  var plaintext = await decryptData(base64ToArrayBuffer(encrypted), getPasswordForDecrypt(), salt).catch(() => alert("Error with decryption"));
  plaintext = JSON.parse(plaintext);
  setPlaintext(plaintext);
  showDecryptedPage(plaintext);
}

function preview() {
  if(document.querySelector("#plaintext").value.length == 0) {
    hide("#preview-pane");
  }
  else
  {
    show("#preview-pane");
    document.querySelector("#preview").innerHTML = "<h4>Preview:</h4><hr />" + marked(document.querySelector("#plaintext").value) + "<hr />";
  }
}

function createMode() {
  hideAll();
  show("#encrypt-tools");
  document.querySelector("#decrypted").innerHTML = "";
  document.querySelector("#plaintext").value = "";
  document.querySelector("#encrypted").value = "";
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#encrypt-button").addEventListener("click", encryptClick);
  document.querySelector("#encrypt-button-2").addEventListener("click", encrypt2Click);
  document.querySelector("#decrypt-button").addEventListener("click", decryptClick);
  document.querySelector("#download-button").addEventListener("click", downloadClick);
  document.querySelector("#skip-download-button").addEventListener("click", finishDownloadClick);
  document.querySelector("#create-button").addEventListener("click", createMode);
  document.querySelector("#plaintext").addEventListener("input", preview);
  document.querySelector("#encrypt-password").addEventListener("input", passwordChange);
});
