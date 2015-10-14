var request = require('request');
var jwt = require('jsonwebtoken');
var q = require('q');

module.exports = {
    GetAccessTokenFromContextTokenRequest: GetAccessTokenFromContextTokenRequest
}
/**
 * Private
 */
function GetContextTokenFromRequest(obj) {
    return obj.refreshtoken;
}
function GetFormattedPrincipal(principalName, hostName, realm) {
    if (hostName) {
        return principalName + "/" + hostName + "@" + realm;
    }
    return principalName + "@" + realm
}
/**
 * Public
 */
function GetAccessTokenFromContextTokenRequest(req, client_ID, appSecret) {
    req.session.sp_info = req.query;
    req.session.sp_oauth = req.body;
    var defer = q.defer()
        , decoded = jwt.decode(req.session.sp_oauth.SPAppToken, appSecret);
    var domain = getDomain(req.session.sp_oauth.SPSiteUrl);
    decoded.appctx = JSON.parse(decoded.appctx);
    var appctx = decoded.appctx,
        params = decoded['appctxsender'].split('@'),
        options = {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            form: {
                "grant_type": "refresh_token",
                "client_id": GetFormattedPrincipal(client_ID, false, params[1]),
                "client_secret": appSecret,
                "refresh_token": decoded.refreshtoken,
                "resource": GetFormattedPrincipal(params[0], domain, params[1])
            }
        },
        callback = function (req, res, body) {
            defer.resolve({ req: req, res: res, body: body, domain: domain });
        };
    request.post(appctx.SecurityTokenServiceUri, options, callback);
    return defer.promise;
}
function getDomain(SPSiteUrl) {
    SPSiteUrl = SPSiteUrl.split('://')[1];
    var start = SPSiteUrl.indexOf('/');
    return SPSiteUrl.substring(0, start)
}
function getSite(url) {
    url = url.split('://')[1];
    return url
}