const db = require('./db');

const dao = {
  findSocialLoginByKey: async (key) => {
    let res = [];
    try {
        let v1Join = " LEFT OUTER JOIN oauth_v1_config_params CP ON CP.social_login_key = SL.social_login_key";
        let v2Join = " LEFT OUTER JOIN oauth_v2_config_params CP ON CP.social_login_key = SL.social_login_key";

        let selectClause = "SELECT SL.*, CP.* FROM social_logins SL";
        let whereClause = " WHERE SL.social_login_key = '$1'";

        let v1 = await db.query(selectClause + v1Join + whereClause, [key]);
        let v2 = await db.query(selectClause + v2Join + whereClause, [key]);

        res = {
          v1Config: (v1.length > 0 ? v1.rows[0] : null),
          v2Config: (v2.length > 0 ? v2.rows[0] : null)
        };
    } catch (e) {
        throw e;
    }

    return res;
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
  insertSocialLoginMapping: async (social_login_key, external_user_id, external_username, autoGeneratedUserName) => {
    try {
      await db.query('INSERT INTO social_login_mappings(social_login_key, external_user_id, external_username, username) VALUES($1, $2, $3, $4)',
        [social_login_key, external_user_id, external_username, autoGeneratedUserName]);
    } catch (e) {
        throw e;
    }
  }
}

module.exports = dao;