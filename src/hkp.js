// hkp-client - A HKP client implementation in javascript
// Copyright (C) 2015 Tankred Hase
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 3.0 of the License, or (at your option) any later version.
//
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

/**
 * This class implements a client for the OpenPGP HTTP Keyserver Protocol (HKP)
 * in order to lookup and upload keys on standard public key servers.
 */
class HKP {
  /**
   * Initialize the HKP client and configure it with the key server url and fetch function.
   * @param {String} [keyServerBaseUrl] - The HKP key server base url including
   *   the protocol to use, e.g. 'https://pgp.mit.edu'; defaults to
   *   openpgp.config.keyserver (https://keyserver.ubuntu.com)
   * @param {Object} [config] - Full configuration, defaults to openpgp.config
   */
  constructor(keyServerBaseUrl = 'https://keyserver.ubuntu.com') {
    this._baseUrl = keyServerBaseUrl;
    this._fetch = typeof globalThis.fetch === 'function' ? globalThis.fetch : require('node-fetch');
  }

  /**
   * Search for a public key on the key server either by key ID or part of the user ID.
   * @param  {String}   options.keyId   The long public key ID.
   * @param  {String}   options.query   This can be any part of the key user ID such as name
   *   or email address.
   * @returns {String} The ascii armored public key.
   * @async
   */
  lookup(options) {
    let uri = this._baseUrl + '/pks/lookup?op=get&options=mr&search=';
    const fetch = this._fetch;

    if (options.keyId) {
      uri += '0x' + encodeURIComponent(options.keyId);
    } else if (options.query) {
      uri += encodeURIComponent(options.query);
    } else {
      throw new Error('You must provide a query parameter!');
    }

    return fetch(uri).then(function(response) {
      if (response.status === 200) {
        return response.text();
      }
    }).then(function(publicKeyArmored) {
      if (!publicKeyArmored || publicKeyArmored.indexOf('-----END PGP PUBLIC KEY BLOCK-----') < 0) {
        return;
      }
      return publicKeyArmored.trim();
    });
  }

  /**
   * Upload a public key to the server.
   * @param {String} publicKeyArmored - An ascii armored public key to be uploaded.
   * @returns {Promise}
   * @async
   */
  upload(publicKeyArmored) {
    const uri = this._baseUrl + '/pks/add';
    const fetch = this._fetch;

    return fetch(uri, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: 'keytext=' + encodeURIComponent(publicKeyArmored)
    });
  }
}

module.exports = HKP;
