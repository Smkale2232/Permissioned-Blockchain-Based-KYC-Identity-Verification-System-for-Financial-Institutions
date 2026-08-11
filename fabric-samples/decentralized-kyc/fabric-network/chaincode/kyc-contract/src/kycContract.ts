import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

// ── Data Models ───────────────────────────────────────────────────────────────

export interface KYCDocument {
  docId: string;
  ownerEmail: string;
  ownerOrg: string;
  docType: string;           // PAN | Aadhaar | Passport | AddressProof
  fileHash: string;          // SHA-256 of the actual file
  status: string;            // pending | approved | rejected
  submittedAt: string;
  updatedAt: string;
  signerEmail?: string;
  signerOrg?: string;
  txId?: string;
  remarks?: string;
}

export interface KYCCredential {
  credentialId: string;
  userEmail: string;
  userOrg: string;
  issuingOrg: string;
  issuingOfficer: string;
  claims: {
    ageVerified: boolean;
    addressVerified: boolean;
    nameVerified: boolean;
    docType: string;
  };
  issuedAt: string;
  expiresAt: string;
  status: string;            // active | revoked
  sourceDocId: string;
}

export interface AuditEntry {
  entryId: string;
  actorEmail: string;
  actorOrg: string;
  action: string;
  targetDocId?: string;
  timestamp: string;
  details?: string;
}

// ── Contract ──────────────────────────────────────────────────────────────────

@Info({ title: 'KYCContract', description: 'Decentralized KYC smart contract' })
export class KYCContract extends Contract {

  // ── Utility: get caller identity attributes ─────────────────────────────

  private getCallerEmail(ctx: Context): string {
    const id = ctx.clientIdentity;
    return id.getAttributeValue('email') || id.getID();
  }

  private getCallerOrg(ctx: Context): string {
    return ctx.clientIdentity.getMSPID();
  }

  private getCallerRole(ctx: Context): string {
    const roleAttr = ctx.clientIdentity.getAttributeValue('role');
    if (roleAttr) return roleAttr;

    const mspid = ctx.clientIdentity.getMSPID();
    const id = ctx.clientIdentity.getID();

    if (mspid === 'RegulatorMSP') {
      return id.includes('OU=admin') ? 'regulator' : 'user';
    }
    if (mspid === 'BankAMSP' || mspid === 'BankBMSP') {
      return id.includes('OU=admin') ? 'signer' : 'user';
    }

    return 'user';
  }

  // Deterministic timestamp — derived from the transaction proposal's timestamp,
  // which is identical across all endorsing peers. Never use `new Date()` / `Date.now()`
  // directly in a @Transaction() (state-writing) function.
  private now(ctx: Context): string {
    const ts = ctx.stub.getTxTimestamp();
    const millis = ts.seconds.low * 1000 + Math.floor(ts.nanos / 1e6);
    return new Date(millis).toISOString();
  }

  // ── Document lifecycle ──────────────────────────────────────────────────

  @Transaction()
  async CreateDocument(
    ctx: Context,
    docId: string,
    title: string,
    fileHash: string,
    uploaderId: string
  ): Promise<string> {
    // Check document doesn't already exist
    const existing = await ctx.stub.getState(docId);
    if (existing && existing.length > 0) {
      throw new Error(`Document ${docId} already exists`);
    }

    const callerOrg = this.getCallerOrg(ctx);
    const now = this.now(ctx);

    const doc: KYCDocument = {
      docId,
      ownerEmail: uploaderId,
      ownerOrg: callerOrg,
      docType: title,
      fileHash,
      status: 'pending',
      submittedAt: now,
      updatedAt: now,
    };

    await ctx.stub.putState(docId, Buffer.from(JSON.stringify(doc)));

    // Emit event
    ctx.stub.setEvent('DocumentCreated', Buffer.from(JSON.stringify({
      docId, uploaderId, title, callerOrg
    })));

    // Write audit entry
    await this.writeAudit(ctx, 'DOCUMENT_SUBMITTED', docId, uploaderId, callerOrg);

    return JSON.stringify(doc);
  }

  @Transaction()
  async SignDocument(
    ctx: Context,
    docId: string,
    action: string,    // approved | rejected
    remarks: string
  ): Promise<string> {
    // Verify caller has signer role
    const role = this.getCallerRole(ctx);
    if (role !== 'signer') {
      throw new Error(`Access denied: caller role is '${role}', requires 'signer'`);
    }

    // Get document
    const docBytes = await ctx.stub.getState(docId);
    if (!docBytes || docBytes.length === 0) {
      throw new Error(`Document ${docId} does not exist`);
    }

    const doc: KYCDocument = JSON.parse(docBytes.toString());

    if (doc.status !== 'pending') {
      throw new Error(`Document ${docId} is already ${doc.status}`);
    }

    if (action !== 'approved' && action !== 'rejected') {
      throw new Error(`Invalid action: ${action}. Must be 'approved' or 'rejected'`);
    }

    const signerEmail = this.getCallerEmail(ctx);
    const signerOrg = this.getCallerOrg(ctx);

    doc.status = action;
    doc.signerEmail = signerEmail;
    doc.signerOrg = signerOrg;
    doc.remarks = remarks;
    doc.txId = ctx.stub.getTxID();
    doc.updatedAt = this.now(ctx);

    await ctx.stub.putState(docId, Buffer.from(JSON.stringify(doc)));

    ctx.stub.setEvent('DocumentSigned', Buffer.from(JSON.stringify({
      docId, action, signerEmail, signerOrg
    })));

    await this.writeAudit(ctx, `DOCUMENT_${action.toUpperCase()}`, docId, signerEmail, signerOrg, remarks);

    return JSON.stringify(doc);
  }

  @Transaction(false)
  @Returns('string')
  async GetDocument(ctx: Context, docId: string): Promise<string> {
    const docBytes = await ctx.stub.getState(docId);
    if (!docBytes || docBytes.length === 0) {
      throw new Error(`Document ${docId} does not exist`);
    }
    return docBytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  async GetDocumentHistory(ctx: Context, docId: string): Promise<string> {
    const role = this.getCallerRole(ctx);
    if (role !== 'regulator' && role !== 'signer') {
      throw new Error('Access denied: only regulators and signers can view document history');
    }

    const iterator = await ctx.stub.getHistoryForKey(docId);
    const history: any[] = [];

    while (true) {
      const result = await iterator.next();
      if (result.done) break;

      const record: any = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
      };

      if (!result.value.isDelete) {
        record.value = JSON.parse(result.value.value.toString());
      }

      history.push(record);
    }

    await iterator.close();
    return JSON.stringify(history);
  }

  @Transaction(false)
  @Returns('string')
  async GetMyDocuments(ctx: Context, ownerEmail: string): Promise<string> {
    // NOTE: getQueryResult requires CouchDB as the state database. If this peer
    // is running LevelDB (the default), this call throws at runtime regardless
    // of endorsement policy. Confirm your peer's stateDatabase config before
    // relying on this function.
    const queryString = JSON.stringify({
      selector: { ownerEmail }
    });

    const iterator = await ctx.stub.getQueryResult(queryString);
    const docs: any[] = [];

    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      docs.push(JSON.parse(result.value.value.toString()));
    }

    await iterator.close();
    return JSON.stringify(docs);
  }

  // ── Regulator functions ─────────────────────────────────────────────────

  @Transaction(false)
  @Returns('string')
  async GetAllDocuments(ctx: Context): Promise<string> {
    const role = this.getCallerRole(ctx);
    if (role !== 'regulator') {
      throw new Error('Access denied: only regulators can view all documents');
    }

    const iterator = await ctx.stub.getStateByRange('', '');
    const docs: any[] = [];

    while (true) {
      const result = await iterator.next();
      if (result.done) break;

      const value = result.value.value.toString();
      try {
        const parsed = JSON.parse(value);
        // Only return KYCDocument objects (filter out credentials and audits)
        if (parsed.docId && parsed.fileHash) {
          docs.push(parsed);
        }
      } catch (_) {}
    }

    await iterator.close();
    return JSON.stringify(docs);
  }

  @Transaction(false)
  @Returns('string')
  async GetStatistics(ctx: Context): Promise<string> {
    const role = this.getCallerRole(ctx);
    if (role !== 'regulator') {
      throw new Error('Access denied: only regulators can view statistics');
    }

    const iterator = await ctx.stub.getStateByRange('', '');
    const stats = {
      totalDocuments: 0,
      pending: 0,
      signed: 0,          // renamed from approved
      rejected: 0,
      totalCredentials: 0,
      activeCredentials: 0,
      revokedCredentials: 0,
    };

    while (true) {
      const result = await iterator.next();
      if (result.done) break;

      try {
        const parsed = JSON.parse(result.value.value.toString());
        if (parsed.docId && parsed.fileHash) {
          stats.totalDocuments++;
          if (parsed.status === 'pending') stats.pending++;
          if (parsed.status === 'signed') stats.signed++;
          if (parsed.status === 'rejected') stats.rejected++;
        }
        if (parsed.credentialId) {
          stats.totalCredentials++;
          if (parsed.status === 'active') stats.activeCredentials++;
          if (parsed.status === 'revoked') stats.revokedCredentials++;
        }
      } catch (_) {}
    }

    await iterator.close();
    return JSON.stringify(stats);
  }


  // ── Verifiable Credentials ──────────────────────────────────────────────

  @Transaction()
  async IssueCredential(
    ctx: Context,
    credentialId: string,
    userEmail: string,
    sourceDocId: string,
    ageVerified: string,
    addressVerified: string,
    nameVerified: string
  ): Promise<string> {
    const role = this.getCallerRole(ctx);
    if (role !== 'signer') {
      throw new Error('Access denied: only signers can issue credentials');
    }

    // Verify source document is approved
    const docBytes = await ctx.stub.getState(sourceDocId);
    if (!docBytes || docBytes.length === 0) {
      throw new Error(`Source document ${sourceDocId} does not exist`);
    }

    const doc: KYCDocument = JSON.parse(docBytes.toString());
    if (doc.status !== 'signed') {
      throw new Error(`Cannot issue credential: document ${sourceDocId} is not signed`);
    }

    const issuingOfficer = this.getCallerEmail(ctx);
    const issuingOrg = this.getCallerOrg(ctx);

    // issuedAt and expiresAt both derive from the same deterministic tx timestamp —
    // single source of truth, no separate `new Date()` call.
    const issuedAtStr = this.now(ctx);
    const expiresDate = new Date(issuedAtStr);
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);

    const credential: KYCCredential = {
      credentialId,
      userEmail,
      userOrg: doc.ownerOrg,
      issuingOrg,
      issuingOfficer,
      claims: {
        ageVerified: ageVerified === 'true',
        addressVerified: addressVerified === 'true',
        nameVerified: nameVerified === 'true',
        docType: doc.docType,
      },
      issuedAt: issuedAtStr,
      expiresAt: expiresDate.toISOString(),
      status: 'active',
      sourceDocId,
    };

    await ctx.stub.putState(credentialId, Buffer.from(JSON.stringify(credential)));

    ctx.stub.setEvent('CredentialIssued', Buffer.from(JSON.stringify({
      credentialId, userEmail, issuingOrg
    })));

    await this.writeAudit(ctx, 'CREDENTIAL_ISSUED', sourceDocId, issuingOfficer, issuingOrg);

    return JSON.stringify(credential);
  }

  @Transaction(false)
  @Returns('string')
  async VerifyCredential(ctx: Context, credentialId: string): Promise<string> {
    const credBytes = await ctx.stub.getState(credentialId);
    if (!credBytes || credBytes.length === 0) {
      return JSON.stringify({ valid: false, reason: 'Credential not found' });
    }

    const cred: KYCCredential = JSON.parse(credBytes.toString());

    if (cred.status === 'revoked') {
      return JSON.stringify({ valid: false, reason: 'Credential has been revoked', credential: cred });
    }

    // Read-only function (@Transaction(false)) — wall-clock comparison here is fine,
    // this never gets endorsed/written to the ledger.
    if (new Date(cred.expiresAt) < new Date()) {
      return JSON.stringify({ valid: false, reason: 'Credential has expired', credential: cred });
    }

    return JSON.stringify({ valid: true, credential: cred });
  }

  @Transaction()
  async RevokeCredential(ctx: Context, credentialId: string, reason: string): Promise<string> {
    const role = this.getCallerRole(ctx);
    if (role !== 'regulator') {
      throw new Error('Access denied: only regulators can revoke credentials');
    }

    const credBytes = await ctx.stub.getState(credentialId);
    if (!credBytes || credBytes.length === 0) {
      throw new Error(`Credential ${credentialId} does not exist`);
    }

    const cred: KYCCredential = JSON.parse(credBytes.toString());
    cred.status = 'revoked';

    await ctx.stub.putState(credentialId, Buffer.from(JSON.stringify(cred)));

    const callerEmail = this.getCallerEmail(ctx);
    const callerOrg = this.getCallerOrg(ctx);

    ctx.stub.setEvent('CredentialRevoked', Buffer.from(JSON.stringify({
      credentialId, reason, revokedBy: callerEmail
    })));

    await this.writeAudit(ctx, 'CREDENTIAL_REVOKED', credentialId, callerEmail, callerOrg, reason);

    return JSON.stringify(cred);
  }

  @Transaction(false)
  @Returns("string")
  async WhoAmI(ctx: Context): Promise<string> {
      const identity = ctx.clientIdentity;

      return JSON.stringify({
          methods: Object.getOwnPropertyNames(
              Object.getPrototypeOf(identity)
          ),
          mspId: identity.getMSPID(),
          id: identity.getID(),
          roleAttribute: identity.getAttributeValue("role"),
          emailAttribute: identity.getAttributeValue("email")
      });
  }

  // ── Audit Trail ─────────────────────────────────────────────────────────

  private async writeAudit(
    ctx: Context,
    action: string,
    targetDocId: string,
    actorEmail: string,
    actorOrg: string,
    details?: string
  ): Promise<void> {
    const entryId = `audit_${ctx.stub.getTxID()}_${action}`;
    const entry: AuditEntry = {
      entryId,
      actorEmail,
      actorOrg,
      action,
      targetDocId,
      timestamp: this.now(ctx),
      details,
    };
    await ctx.stub.putState(entryId, Buffer.from(JSON.stringify(entry)));
  }

  @Transaction(false)
  @Returns('string')
  async GetAuditTrail(ctx: Context): Promise<string> {
    const role = this.getCallerRole(ctx);
    if (role !== 'regulator') {
      throw new Error('Access denied: only regulators can view audit trail');
    }

    const iterator = await ctx.stub.getStateByRange('audit_', 'audit_~');
    const entries: any[] = [];

    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      try {
        entries.push(JSON.parse(result.value.value.toString()));
      } catch (_) {}
    }

    await iterator.close();
    return JSON.stringify(entries);
  }

  // ── Init ledger (optional test data) ───────────────────────────────────

  @Transaction()
  async InitLedger(ctx: Context): Promise<void> {
    console.log('KYC Contract initialized successfully');
  }
}