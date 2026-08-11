const pkiService = require('./pki.service');

// --- What this is, and what it deliberately is not ---
//
// This produces a JSON object shaped like the W3C Verifiable Credentials
// Data Model (https://www.w3.org/TR/vc-data-model/): the standard top-level
// fields (@context, type, issuer, issuanceDate, credentialSubject, proof)
// are all present and mean what the spec says they mean, and `proof` is a
// REAL RSA-SHA256 signature over the credential's canonical JSON — anyone
// with the issuer's public certificate (see /api/pki/:userId/certificate)
// can independently verify it without ever calling DocChain's own API.
//
// What this is NOT: full spec compliance. There's no JSON-LD context
// resolution (the @context URL is included for shape/compatibility but
// isn't fetched or used to expand terms), no DID method resolution (the
// `issuer` id is a `did:docchain:<userId>` string — a DID-shaped identifier,
// not a resolvable DID Document on a real DID network), and no support for
// selective disclosure / zero-knowledge proof types. This is a genuine,
// independently-verifiable signed credential — just not a drop-in replacement
// for a production VC issuer built on a real DID method. See PKI.md.

const VC_CONTEXT = ['https://www.w3.org/2018/credentials/v1'];

/** Deterministic JSON string — keys sorted at every nesting level, not just
 * the top level — so the same credential content always produces the same
 * signature input. (JSON.stringify's array-replacer form only filters/orders
 * the TOP level; nested objects would silently come out empty if we used
 * that trick here, which would mean the signature never actually committed
 * to the document hash/title inside credentialSubject. Verified with a
 * one-off test before relying on this — see backend/tests/unit/credential.test.js.) */
function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Builds and signs a Verifiable Credential for a just-signed document.
 * @param {{ id: string, title: string, fileHash: string }} doc
 * @param {{ id: string, name: string, certificateSerialNumber: string, privateKeyPem: string }} signer
 * @returns {object} the full credential, including `proof`
 */
function issueDocumentCredential(doc, signer) {
  const issuanceDate = new Date().toISOString();

  const unsigned = {
    '@context': VC_CONTEXT,
    type: ['VerifiableCredential', 'DocumentSigningCredential'],
    issuer: `did:docchain:${signer.id}`,
    issuanceDate,
    credentialSubject: {
      documentId: doc.id,
      title: doc.title,
      documentHash: doc.fileHash,
      signedBy: signer.name,
      status: 'signed',
    },
  };

  const proofValue = pkiService.signData(canonicalize(unsigned), signer.privateKeyPem);

  return {
    ...unsigned,
    proof: {
      type: 'RsaSignature2018',
      created: issuanceDate,
      verificationMethod: `did:docchain:${signer.id}#certificate-${signer.certificateSerialNumber}`,
      proofPurpose: 'assertionMethod',
      proofValue,
    },
  };
}

/**
 * Re-verifies a previously-issued credential's signature against the
 * issuer's current public key. Returns false (never throws) for anything
 * malformed — a verification endpoint should treat "couldn't verify" the
 * same as "verified false".
 * @param {object} credential — must include `proof.proofValue`
 * @param {string} issuerPublicKeyPem
 */
function verifyDocumentCredential(credential, issuerPublicKeyPem) {
  try {
    if (!credential?.proof?.proofValue) return false;
    const { proof, ...unsigned } = credential;
    const canonical = canonicalize(unsigned);
    return pkiService.verifySignature(canonical, proof.proofValue, issuerPublicKeyPem);
  } catch {
    return false;
  }
}

module.exports = { issueDocumentCredential, verifyDocumentCredential };
