const socialLoginDao = require('../dao/socialLoginDao');
const builder = require('../util/builder');
const requestHelper = require('../util/requestHelper');
const parser = require('../util/parser');
const authService = require('../service/authService.js');
const uuid = require('uuid');

const service = {
  loginUrl: async (data) => {
    let socialLoginUrl = "";
    try {
      let socialLoginParams = await socialLoginDao.findSocialLoginByKey(data.key);
      const params = [socialLoginParams.client_id, socialLoginParams.state, socialLoginParams.redirect_uri];
      socialLoginUrl = builder.buildUrl(socialLoginParams.login_uri, params);
    } catch (e) {
      throw e;
    }
    return socialLoginUrl;
  },

  login: async (data) => {
    try {
      const confidentialParams = await socialLoginDao.findConfidentialDataByKey(data.key);
      headers = {
        'Accept': 'application/json'
      }
      // getting access token
      const params = [confidentialParams.client_id, confidentialParams.client_secret, confidentialParams.redirect_uri, data.code, confidentialParams.state];
      const accessTokenUrl = builder.buildUrl(confidentialParams.access_token_uri, params);
      const accessTokenResponse = await requestHelper.doGetRequest(accessTokenUrl, headers);
      const accessToken = parser.getJsonValue(accessTokenResponse, confidentialParams.access_token_json_field_path);
      const tokenType = parser.getJsonValue(accessTokenResponse, confidentialParams.token_type_json_field_path);

      if (accessToken) {
        // getting user data with access token
        let userDataUrl = confidentialParams.user_data_uri;
        if(confidentialParams.requested_with_auth_header && tokenType) {
          headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:44.0) Gecko/20100101 Firefox/44.0',
            'Authorization': tokenType + ' ' + accessToken
          }
        } else {
          userDataUrl = builder.buildUrl(confidentialParams.user_data_uri, [accessToken]);
        }
        const userDataResponse = await requestHelper.doGetRequest(userDataUrl, headers);

        const external_user_id = parser.getJsonValue(userDataResponse, confidentialParams.external_user_id_json_field_path);
        const external_user_email = parser.getJsonValue(userDataResponse, confidentialParams.external_user_email_json_field_path);

        if (external_user_id && external_user_email) {
          // checking social login mapping to determine if signup or login
          let socialLoginUser = await socialLoginDao.findMappingDataByExternalUserId(data.key, external_user_id);

          if (socialLoginUser) {
            // login user, generate token
            return await authService.generateTokens(socialLoginUser);
          } else {
            // signup user and generate token
            const autoGeneratedUserName = uuid.v4();
            const autoGeneratedPassword = uuid.v4();

            socialLoginUser = {
              username: autoGeneratedUserName,
              password: autoGeneratedPassword,
              email: external_user_email
            }

            await authService.signup(socialLoginUser);
            await socialLoginDao.insertSocialLoginMapping(data.key, external_user_id, autoGeneratedUserName);

            return await authService.generateTokens(socialLoginUser);
          }
        }
      }
    } catch (e) {
        let error = new Error();
        error.message = "Bad credentials";
        error.responseCode = 403;
        throw error;
    }
  },
  
}

module.exports = service;