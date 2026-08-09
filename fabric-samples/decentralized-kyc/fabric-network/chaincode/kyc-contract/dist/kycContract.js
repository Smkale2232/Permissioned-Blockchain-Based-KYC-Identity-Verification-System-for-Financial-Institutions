"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
// ── Contract ──────────────────────────────────────────────────────────────────
let KYCContract = class KYCContract extends fabric_contract_api_1.Contract {
    // ── Utility: get caller identity attributes ─────────────────────────────
    getCallerEmail(ctx) {
        const id = ctx.clientIdentity;
        return id.getAttributeValue('email') || id.getID();
    }
    getCallerOrg(ctx) {
        return ctx.clientIdentity.getMSPID();
    }
    getCallerRole(ctx) {
        const roleAttr = ctx.clientIdentity.getAttributeValue('role');
        if (roleAttr)
            return roleAttr;
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
    now(ctx) {
        const ts = ctx.stub.getTxTimestamp();
        const millis = ts.seconds.low * 1000 + Math.floor(ts.nanos / 1e6);
        return new Date(millis).toISOString();
    }
    // ── Document lifecycle ──────────────────────────────────────────────────
    async CreateDocument(ctx, docId, title, fileHash, uploaderId) {
        // Check document doesn't already exist
        const existing = await ctx.stub.getState(docId);
        if (existing && existing.length > 0) {
            throw new Error(`Document ${docId} already exists`);
        }
        const callerOrg = this.getCallerOrg(ctx);
        const now = this.now(ctx);
        const doc = {
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
    async SignDocument(ctx, docId, action, // approved | rejected
    remarks) {
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
        const doc = JSON.parse(docBytes.toString());
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
    async GetDocument(ctx, docId) {
        const docBytes = await ctx.stub.getState(docId);
        if (!docBytes || docBytes.length === 0) {
            throw new Error(`Document ${docId} does not exist`);
        }
        return docBytes.toString();
    }
    async GetDocumentHistory(ctx, docId) {
        const role = this.getCallerRole(ctx);
        if (role !== 'regulator' && role !== 'signer') {
            throw new Error('Access denied: only regulators and signers can view document history');
        }
        const iterator = await ctx.stub.getHistoryForKey(docId);
        const history = [];
        while (true) {
            const result = await iterator.next();
            if (result.done)
                break;
            const record = {
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
    async GetMyDocuments(ctx, ownerEmail) {
        // NOTE: getQueryResult requires CouchDB as the state database. If this peer
        // is running LevelDB (the default), this call throws at runtime regardless
        // of endorsement policy. Confirm your peer's stateDatabase config before
        // relying on this function.
        const queryString = JSON.stringify({
            selector: { ownerEmail }
        });
        const iterator = await ctx.stub.getQueryResult(queryString);
        const docs = [];
        while (true) {
            const result = await iterator.next();
            if (result.done)
                break;
            docs.push(JSON.parse(result.value.value.toString()));
        }
        await iterator.close();
        return JSON.stringify(docs);
    }
    // ── Regulator functions ─────────────────────────────────────────────────
    async GetAllDocuments(ctx) {
        const role = this.getCallerRole(ctx);
        if (role !== 'regulator') {
            throw new Error('Access denied: only regulators can view all documents');
        }
        const iterator = await ctx.stub.getStateByRange('', '');
        const docs = [];
        while (true) {
            const result = await iterator.next();
            if (result.done)
                break;
            const value = result.value.value.toString();
            try {
                const parsed = JSON.parse(value);
                // Only return KYCDocument objects (filter out credentials and audits)
                if (parsed.docId && parsed.fileHash) {
                    docs.push(parsed);
                }
            }
            catch (_) { }
        }
        await iterator.close();
        return JSON.stringify(docs);
    }
    async GetStatistics(ctx) {
        const role = this.getCallerRole(ctx);
        if (role !== 'regulator') {
            throw new Error('Access denied: only regulators can view statistics');
        }
        const iterator = await ctx.stub.getStateByRange('', '');
        const stats = {
            totalDocuments: 0,
            pending: 0,
            signed: 0, // renamed from approved
            rejected: 0,
            totalCredentials: 0,
            activeCredentials: 0,
            revokedCredentials: 0,
        };
        while (true) {
            const result = await iterator.next();
            if (result.done)
                break;
            try {
                const parsed = JSON.parse(result.value.value.toString());
                if (parsed.docId && parsed.fileHash) {
                    stats.totalDocuments++;
                    if (parsed.status === 'pending')
                        stats.pending++;
                    if (parsed.status === 'signed')
                        stats.signed++;
                    if (parsed.status === 'rejected')
                        stats.rejected++;
                }
                if (parsed.credentialId) {
                    stats.totalCredentials++;
                    if (parsed.status === 'active')
                        stats.activeCredentials++;
                    if (parsed.status === 'revoked')
                        stats.revokedCredentials++;
                }
            }
            catch (_) { }
        }
        await iterator.close();
        return JSON.stringify(stats);
    }
    // ── Verifiable Credentials ──────────────────────────────────────────────
    async IssueCredential(ctx, credentialId, userEmail, sourceDocId, ageVerified, addressVerified, nameVerified) {
        const role = this.getCallerRole(ctx);
        if (role !== 'signer') {
            throw new Error('Access denied: only signers can issue credentials');
        }
        // Verify source document is approved
        const docBytes = await ctx.stub.getState(sourceDocId);
        if (!docBytes || docBytes.length === 0) {
            throw new Error(`Source document ${sourceDocId} does not exist`);
        }
        const doc = JSON.parse(docBytes.toString());
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
        const credential = {
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
    async VerifyCredential(ctx, credentialId) {
        const credBytes = await ctx.stub.getState(credentialId);
        if (!credBytes || credBytes.length === 0) {
            return JSON.stringify({ valid: false, reason: 'Credential not found' });
        }
        const cred = JSON.parse(credBytes.toString());
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
    async RevokeCredential(ctx, credentialId, reason) {
        const role = this.getCallerRole(ctx);
        if (role !== 'regulator') {
            throw new Error('Access denied: only regulators can revoke credentials');
        }
        const credBytes = await ctx.stub.getState(credentialId);
        if (!credBytes || credBytes.length === 0) {
            throw new Error(`Credential ${credentialId} does not exist`);
        }
        const cred = JSON.parse(credBytes.toString());
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
    async WhoAmI(ctx) {
        const identity = ctx.clientIdentity;
        return JSON.stringify({
            methods: Object.getOwnPropertyNames(Object.getPrototypeOf(identity)),
            mspId: identity.getMSPID(),
            id: identity.getID(),
            roleAttribute: identity.getAttributeValue("role"),
            emailAttribute: identity.getAttributeValue("email")
        });
    }
    // ── Audit Trail ─────────────────────────────────────────────────────────
    async writeAudit(ctx, action, targetDocId, actorEmail, actorOrg, details) {
        const entryId = `audit_${ctx.stub.getTxID()}_${action}`;
        const entry = {
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
    async GetAuditTrail(ctx) {
        const role = this.getCallerRole(ctx);
        if (role !== 'regulator') {
            throw new Error('Access denied: only regulators can view audit trail');
        }
        const iterator = await ctx.stub.getStateByRange('audit_', 'audit_~');
        const entries = [];
        while (true) {
            const result = await iterator.next();
            if (result.done)
                break;
            try {
                entries.push(JSON.parse(result.value.value.toString()));
            }
            catch (_) { }
        }
        await iterator.close();
        return JSON.stringify(entries);
    }
    // ── Init ledger (optional test data) ───────────────────────────────────
    async InitLedger(ctx) {
        console.log('KYC Contract initialized successfully');
    }
};
exports.KYCContract = KYCContract;
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "CreateDocument", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "SignDocument", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "GetDocument", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "GetDocumentHistory", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "GetMyDocuments", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "GetAllDocuments", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "GetStatistics", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "IssueCredential", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "VerifyCredential", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "RevokeCredential", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)("string"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "WhoAmI", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "GetAuditTrail", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], KYCContract.prototype, "InitLedger", null);
exports.KYCContract = KYCContract = __decorate([
    (0, fabric_contract_api_1.Info)({ title: 'KYCContract', description: 'Decentralized KYC smart contract' })
], KYCContract);
