const axiosClient = require("./axiosClient");

module.exports = {
  create(data, accessToken) {
    return axiosClient.post("/snippets", data, {
      headers: {
        Authorization: accessToken
      }
    });
  }
};
