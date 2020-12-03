// Symmetric AES algorithm with authenticated encryption
// Ref: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encryptionAlgorithm = 'AES-GCM';

// Key derivation from passphrase
const hashAlgorithm = "SHA-256";
const iterations = 1000;
const keyLength = 48;


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
  const ivlen = 16;
  const keylen = 32;
  const derivedKey = derivation.slice(0, keylen);
  const iv = derivation.slice(keylen);
  const importedEncryptionKey = await crypto.subtle.importKey('raw', derivedKey, { name: encryptionAlgorithm }, false, ['encrypt', 'decrypt']);
  return {
    key: importedEncryptionKey,
    iv: iv
  }
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
  return prompt('Enter password to encrypt the page.');
}

function getPasswordForDecrypt() {
  return prompt('Enter the password that was used to encrypt this page.');
}

function getPlaintext() {
  return document.querySelector('#plaintext').value;
}

function getEncrypted() {
  return document.querySelector('#encrypted').innerHTML;
}

function setPlaintext(text) {
  document.querySelector('#plaintext').value = text;
}

function setEncrypted(text) {
  document.querySelector('#encrypted').innerHTML = text;
}

function arrayBufferToBase64(buffer) {
  var binary = '';
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
  return window.crypto.getRandomValues(new Uint32Array(2)).join('');
}

function showDecryptedPage(decrypted) {
  document.querySelector('#decrypted').innerHTML = marked(decrypted);
  hide('#encrypt-tools');
  hide('#instructions');
  show('#decrypted');
}

function hide(selector) {
  document.querySelector(selector).style.display = 'none';
}

function show(selector) {
  document.querySelector(selector).style.display = 'block';
}

function download() {
  const text = document.documentElement.outerHTML;
  const filename = "encrypted.html";
  const pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);

  if (document.createEvent) {
    var event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  }
  else {
    pom.click();
  }
}

function scrubPlaintext() {
  document.querySelector('#decrypted').innerHTML = "";
  document.querySelector('#plaintext').value = "";
  document.querySelector('#preview').innerHTML = "";
}

async function encryptClick() {
  const salt = getSalt();
  var encrypted = await encryptData(getPlaintext(), getPasswordForEncrypt(), salt);
  encrypted = arrayBufferToBase64(encrypted);
  setEncrypted(encrypted + "|" + salt);
  show('#instructions');
  hide('#encrypt-tools');
  hide('#decrypted');
  show("#create-button");
  scrubPlaintext();
  download();
}

async function decryptClick() {
  var encrypted = getEncrypted();
  const salt = encrypted.split("|")[1];
  encrypted = encrypted.split("|")[0];
  var plaintext = await decryptData(base64ToArrayBuffer(encrypted), getPasswordForDecrypt(), salt).catch(error => alert('Error with decryption'));
  var plaintext = JSON.parse(plaintext);
  setPlaintext(plaintext);
  showDecryptedPage(plaintext);
}

function preview() {
  document.querySelector('#preview').innerHTML = "<h4>Preview:</h4><hr />" + marked(document.querySelector('#plaintext').value) + "<hr />";
}

function createMode() {
  show('#encrypt-tools');
  hide("#create-button");
  hide('#instructions');
  hide('#decrypted');
  document.querySelector('#decrypted').innerHTML = "";
  document.querySelector('#plaintext').value = "";
  document.querySelector('#encrypted').value = "";
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#encrypt-button').addEventListener('click', encryptClick);
  document.querySelector('#decrypt-button').addEventListener('click', decryptClick);
  document.querySelector('#create-button').addEventListener('click', createMode);
  document.querySelector('#plaintext').addEventListener('input', preview);
});
