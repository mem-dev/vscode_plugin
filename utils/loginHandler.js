const config = require("./config");
const axiosClient = require("./axiosClient");

module.exports = {
  login(token, ctx) {
    return axiosClient.post("/authorize/ext_auth", { id: token }).then(res => {
      ctx.globalState.update(config.serviceName, res.data.token);
    });
  },
  accessToken(ctx) {
    const creds = ctx.globalState.get(config.serviceName, null);
    return creds;
  },
  logout(ctx){
    ctx.globalState.update(config.serviceName, null);
  }
};
