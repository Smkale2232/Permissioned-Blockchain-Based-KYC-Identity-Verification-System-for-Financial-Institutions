const pkiService = require('../../src/services/pki.service');
const credentialService = require('../../src/services/credential.service');

describe('credential.service — canonicalization correctness', () => {
  // This is the bug caught during development: JSON.stringify's array-replacer
  // form only filters/orders the TOP level of an object — nested objects
  // (like credentialSubject) would silently come out as {} if canonicalize
  // used that trick, which would mean the signature never actually committed
  // to the document hash/title at all. Locking this in so it can never
  // regress silently.
  test('nested object content is preserved, not dropped', () => {
    const doc = { id: 'doc1', title: 'Test Doc', fileHash: 'abc123' };
    const signer = {
      id: 'signer1',
      name: 'Alice',
      certificateSerialNumber: '00aa',
      privateKeyPem: pkiService.generateIdentity({ name: 'Alice', email: 'a@x.com', role: 'signer' }).privateKeyPem,
    };
    const credential = credentialService.issueDocumentCredential(doc, signer);

    expect(credential.credentialSubject.documentId).toBe('doc1');
    expect(credential.credentialSubject.title).toBe('Test Doc');
    expect(credential.credentialSubject.documentHash).toBe('abc123');
    expect(credential.credentialSubject.signedBy).toBe('Alice');
  });
});

describe('credential.service — Verifiable Credential shape', () => {
  test('issueDocumentCredential produces a W3C VC Data Model-shaped object', () => {
    const identity = pkiService.generateIdentity({ name: 'Alice', email: 'a@x.com', role: 'signer' });
    const doc = { id: 'doc1', title: 'Contract', fileHash: 'deadbeef' };
    const signer = { id: 'signer1', name: 'Alice', certificateSerialNumber: identity.serialNumber, privateKeyPem: identity.privateKeyPem };

    const credential = credentialService.issueDocumentCredential(doc, signer);

    expect(credential['@context']).toContain('https://www.w3.org/2018/credentials/v1');
    expect(credential.type).toContain('VerifiableCredential');
    expect(credential.issuer).toBe('did:docchain:signer1');
    expect(typeof credential.issuanceDate).toBe('string');
    expect(credential.proof).toBeDefined();
    expect(credential.proof.type).toBe('RsaSignature2018');
    expect(typeof credential.proof.proofValue).toBe('string');
  });
});

describe('credential.service — verification', () => {
  let identity;
  let doc;
  let signer;
  let credential;

  beforeEach(() => {
    identity = pkiService.generateIdentity({ name: 'Alice', email: 'a@x.com', role: 'signer' });
    doc = { id: 'doc1', title: 'Contract', fileHash: 'deadbeef' };
    signer = { id: 'signer1', name: 'Alice', certificateSerialNumber: identity.serialNumber, privateKeyPem: identity.privateKeyPem };
    credential = credentialService.issueDocumentCredential(doc, signer);
  });

  test('a genuine credential verifies against the issuer public key', () => {
    expect(credentialService.verifyDocumentCredential(credential, identity.publicKeyPem)).toBe(true);
  });

  test('a credential with a tampered documentHash fails verification', () => {
    const tampered = {
      ...credential,
      credentialSubject: { ...credential.credentialSubject, documentHash: 'TAMPERED-HASH' },
    };
    expect(credentialService.verifyDocumentCredential(tampered, identity.publicKeyPem)).toBe(false);
  });

  test('a credential checked against the wrong issuer public key fails verification', () => {
    const otherIdentity = pkiService.generateIdentity({ name: 'Bob', email: 'b@x.com', role: 'signer' });
    expect(credentialService.verifyDocumentCredential(credential, otherIdentity.publicKeyPem)).toBe(false);
  });

  test('never throws on malformed credentials — returns false', () => {
    expect(credentialService.verifyDocumentCredential(null, identity.publicKeyPem)).toBe(false);
    expect(credentialService.verifyDocumentCredential({}, identity.publicKeyPem)).toBe(false);
    expect(credentialService.verifyDocumentCredential({ proof: {} }, identity.publicKeyPem)).toBe(false);
  });
});
