const hash = "SHA-256";
const iterations = 1000;
const keyLength = 48;

async function getDerivation(hash, salt, password, iterations, keyLength) {
  const textEncoder = new TextEncoder("utf-8");
  const passwordBuffer = textEncoder.encode(password);
  const importedKey = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"]);

  const saltBuffer = textEncoder.encode(salt);
  const params = {name: "PBKDF2", hash: hash, salt: saltBuffer, iterations: iterations};
  const derivation = await crypto.subtle.deriveBits(params, importedKey, keyLength*8);
  return derivation;
}

async function getKey(derivation) {
  const ivlen = 16;
  const keylen = 32;
  const derivedKey = derivation.slice(0, keylen);
  const iv = derivation.slice(keylen);
  const importedEncryptionKey = await crypto.subtle.importKey('raw', derivedKey, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']);
  return {
    key: importedEncryptionKey,
    iv: iv
  }
}

async function encrypt(text, keyObject) {
    const textEncoder = new TextEncoder("utf-8");
    const textBuffer = textEncoder.encode(text);
    const encryptedText = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: keyObject.iv }, keyObject.key, textBuffer);
    return encryptedText;
}

async function decrypt(encryptedText, keyObject) {
    const textDecoder = new TextDecoder("utf-8");
    const decryptedText = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: keyObject.iv }, keyObject.key, encryptedText);
    return textDecoder.decode(decryptedText);
}

async function encryptData(text, password, salt) {
	const derivation = await getDerivation(hash, salt, password, iterations, keyLength);
	const keyObject = await getKey(derivation);
	const encryptedObject = await encrypt(JSON.stringify(text), keyObject);
	return encryptedObject;
}

async function decryptData(encryptedObject, password, salt) {
	const derivation = await getDerivation(hash, salt, password, iterations, keyLength);
	const keyObject = await getKey(derivation);
	const decryptedObject = await decrypt(encryptedObject, keyObject);
	return decryptedObject;
}

function getPassword() {
  return prompt('Password');
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
  return Date.now().toString();
}

function showDecryptedPage(decrypted) {
  document.querySelector('#container').innerHTML = marked(decrypted);
  hide('#encrypt-tools');
  hide('#instructions');
  show('#container');
}

function hide(selector) {
  document.querySelector(selector).style.display = 'none';
}

function show(selector) {
  document.querySelector(selector).style.display = 'block';
}

function download() {
  hide("#download-instructions");
  const text = document.documentElement.outerHTML;
  const filename = "stashed.html";
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

async function encryptClick() {
  const salt = getSalt();
  var encrypted = await encryptData(getPlaintext(), getPassword(), salt);
  encrypted = arrayBufferToBase64(encrypted);
  setEncrypted(encrypted + "|" + salt);
  show('#instructions');
  hide('#encrypt-tools');
  hide('#container');
  document.querySelector('#container').innerHTML = "";
  document.querySelector('#plaintext').value = "";
  document.querySelector('#preview').innerHTML = "";
  show("#download-instructions");
}

async function decryptClick() {
  var encrypted = getEncrypted();
  const salt = encrypted.split("|")[1];
  encrypted = encrypted.split("|")[0];
  var plaintext = await decryptData(base64ToArrayBuffer(encrypted), getPassword(), salt).catch(error => alert('Error with decryption'));
  var plaintext = JSON.parse(plaintext);
  setPlaintext(plaintext);
  showDecryptedPage(plaintext);
}

function preview() {
  document.querySelector('#preview').innerHTML = "<h4>Preview:</h4><hr />" + marked(document.querySelector('#plaintext').value) + "<hr />";
}

function createMode() {
  show('#encrypt-tools');
  hide('#instructions');
  hide('#container');
  document.querySelector('#container').innerHTML = "";
  document.querySelector('#plaintext').value = "";
  document.querySelector('#encrypted').value = "";
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#encrypt-button').addEventListener('click', encryptClick);
  document.querySelector('#decrypt-button').addEventListener('click', decryptClick);
  document.querySelector('#create-button').addEventListener('click', createMode);
  document.querySelector('#download-button').addEventListener('click', download);
  document.querySelector('#plaintext').addEventListener('input', preview);
});
