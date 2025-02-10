exports.encodeId = (id) => {
    return Buffer.from(id)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };
  
  exports.decodeId = (encoded) => {
    const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
    return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
  };