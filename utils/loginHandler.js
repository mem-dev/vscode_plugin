const keytar = require("keytar");
const config = require("./config");
const axiosClient = require("./axiosClient");

module.exports = {
  login(token) {
    return axiosClient.post("/authorize/ext_auth", { id: token }).then(res => {
      keytar.setPassword(config.serviceName, config.serviceName, res.data.token);
    });
  },
  async accessToken() {
    const creds = await keytar.findPassword(config.serviceName);
    return creds;
  }
};
