#!/bin/bash
# Helper to copy TLS files regardless of extension
copy_tls_files() {
  local TLS_DIR=$1
  
  # signcerts - always .pem
  cp $TLS_DIR/signcerts/*.pem $TLS_DIR/server.crt
  
  # keystore - could be _sk or .pem
  KEY=$(ls $TLS_DIR/keystore/ | grep -v IssuerRevocation | head -1)
  cp $TLS_DIR/keystore/$KEY $TLS_DIR/server.key
  
  # tlscacerts - always .pem
  cp $TLS_DIR/tlscacerts/*.pem $TLS_DIR/ca.crt
}
