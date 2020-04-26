const db = require('./db');

const dao = {
  findSocialLoginByKey: async (key) => {
    let res;
    try {
        res = await db.query('SELECT client_id, redirect_uri, login_uri, state FROM social_logins WHERE social_login_key LIKE $1', [key]);
    } catch (e) {
        throw e;
    }

    return res.rows[0];
  },
  // never use this to return client, use only internally, because response contains client secret
  findConfidentialDataByKey: async (key) => {
    let res;
    try {
        res = await db.query('SELECT * FROM social_logins WHERE social_login_key LIKE $1', [key]);
    } catch (e) {
        throw e;
    }

    return res.rows[0];
  },
  findMappingDataByExternalUserId: async (key, userId) => {
    let res;
    try {
        res = await db.query('SELECT username FROM social_login_mappings WHERE social_login_key LIKE $1 and external_user_id LIKE $2', [key, userId]);
    } catch (e) {
        throw e;
    }

    return res.rows[0];
  },
  insertSocialLoginMapping: async (social_login_key, external_user_id, autoGeneratedUserName) => {
    try {
      await db.query('INSERT INTO social_login_mappings(social_login_key, external_user_id, username) VALUES($1, $2, $3)', 
        [social_login_key, external_user_id, autoGeneratedUserName]);
    } catch (e) {
        throw e;
    }
  }
}

module.exports = dao;