// Symmetric AES algorithm with authenticated encryption
// Ref: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encryptionAlgorithm = "AES-GCM";

// Key derivation from passphrase
const hashAlgorithm = "SHA-256";
const iterations = 1000;
const keyLength = 32;
const saltLength = 16; // bytes
const ivLength = 12; // bytes


/* global marked */

async function getDerivation(salt, password, iterations, keyLength) {
  const textEncoder = new TextEncoder("utf-8");
  const passwordBuffer = textEncoder.encode(password);
  const importedKey = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"]);

  const params = {name: "PBKDF2", hash: hashAlgorithm, salt: salt, iterations: iterations};
  const derivation = await crypto.subtle.deriveBits(params, importedKey, keyLength*8);
  return derivation;
}

async function getKey(derivation, iv) {
  const importedEncryptionKey = await crypto.subtle.importKey("raw", derivation, { name: encryptionAlgorithm }, false, ["encrypt", "decrypt"]);
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

async function encryptData(text, password, salt, iv) {
  const derivation = await getDerivation(salt, password, iterations, keyLength);
  const keyObject = await getKey(derivation, iv);
  const encryptedObject = await encrypt(JSON.stringify(text), keyObject);
  return encryptedObject;
}

async function decryptData(encryptedObject, password, salt, iv) {
  const derivation = await getDerivation(salt, password, iterations, keyLength);
  const keyObject = await getKey(derivation, iv);
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

function arrayToBase64(byteArray) {
  var binary = "";
  const len = byteArray.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(byteArray[i]);
  }
  return window.btoa(binary);
}

function base64ToArray(base64) {
  var binary_string =  window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array( len );
  for (var i = 0; i < len; i++)        {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
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
  const salt = window.crypto.getRandomValues(new Uint8Array(saltLength));
  const iv = window.crypto.getRandomValues(new Uint8Array(ivLength));
  var encrypted = await encryptData(getPlaintext(), getPasswordForEncrypt(), salt, iv);
  encrypted = new Uint8Array(encrypted);

  // combine the key derivation salt, the encryption initialisation vector and the encrypted content into 1 payload
  const payload = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);

  payload.set(new Uint8Array(salt)); // 8 bytes
  payload.set(new Uint8Array(iv), saltLength); // 12 bytes
  payload.set(encrypted, saltLength + ivLength); // the rest

  setEncrypted(arrayToBase64(payload));
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
  const payload = base64ToArray(getEncrypted());

  // chop the payload into the key derivation salt, the encryption initialisation vector and the encrypted content
  const salt = payload.slice(0, saltLength);
  const iv = payload.slice(saltLength, saltLength + ivLength);
  const encrypted = payload.slice(saltLength + ivLength);

  var plaintext = await decryptData(
    encrypted.buffer, getPasswordForDecrypt(), salt, iv.buffer
  ).catch(() => alert("Error with decryption"));
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
